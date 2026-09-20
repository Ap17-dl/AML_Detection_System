"""NetworkX-based graph analysis engine for AML network topology (AML-FR-10, 11, 12).

Detects structuring patterns (fan-in/fan-out), cycles/layering rings, computes
neighborhood risk scores, and fuses graph risk with ML probabilities.
"""

from __future__ import annotations

import logging
import uuid
from decimal import Decimal
from typing import Any

import networkx as nx
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.graph_indicator import GraphIndicator
from app.models.prediction import Prediction
from app.models.transaction import Transaction
from app.schemas.graph import GraphEdge, GraphIndicatorsOut, GraphNode, NetworkSubGraphOut

logger = logging.getLogger(__name__)


async def build_account_subgraph(
    db: AsyncSession,
    account_id: uuid.UUID,
    k_hops: int = 2,
    max_transactions: int = 200,
) -> NetworkSubGraphOut:
    """Builds a NetworkX DiGraph around *account_id* up to *k_hops*, computes
    topological indicators, and returns nodes + edges for UI rendering.
    """
    target_str = str(account_id)

    # 1. Fetch relevant transactions touching account_id or its direct neighbors
    txn_res = await db.execute(
        select(Transaction)
        .where(
            or_(
                Transaction.origin_account_id == account_id,
                Transaction.destination_account_id == account_id,
            )
        )
        .order_by(Transaction.occurred_at.desc())
        .limit(max_transactions)
    )
    direct_txns = txn_res.scalars().all()

    neighbor_ids = set()
    for t in direct_txns:
        neighbor_ids.add(t.origin_account_id)
        neighbor_ids.add(t.destination_account_id)

    # If k_hops > 1, query second hop transactions
    all_txns = list(direct_txns)
    if k_hops > 1 and neighbor_ids:
        hop2_res = await db.execute(
            select(Transaction)
            .where(
                or_(
                    Transaction.origin_account_id.in_(neighbor_ids),
                    Transaction.destination_account_id.in_(neighbor_ids),
                )
            )
            .order_by(Transaction.occurred_at.desc())
            .limit(max_transactions)
        )
        hop2_txns = hop2_res.scalars().all()
        seen_txn_ids = {t.transaction_id for t in all_txns}
        for t in hop2_txns:
            if t.transaction_id not in seen_txn_ids:
                all_txns.append(t)
                neighbor_ids.add(t.origin_account_id)
                neighbor_ids.add(t.destination_account_id)

    # 2. Build NetworkX directed graph
    G = nx.DiGraph()

    edge_aggregates: dict[tuple[str, str], dict[str, Any]] = {}
    txn_ids = [t.transaction_id for t in all_txns]

    # Fetch predictions for these transactions to color edges/nodes
    preds_by_txn: dict[uuid.UUID, Prediction] = {}
    if txn_ids:
        pred_res = await db.execute(
            select(Prediction).where(Prediction.transaction_id.in_(txn_ids))
        )
        for p in pred_res.scalars().all():
            preds_by_txn[p.transaction_id] = p

    for t in all_txns:
        u = str(t.origin_account_id)
        v = str(t.destination_account_id)
        key = (u, v)
        pred = preds_by_txn.get(t.transaction_id)
        cat = pred.risk_category if pred else "low"

        if key not in edge_aggregates:
            edge_aggregates[key] = {
                "amount": float(t.amount),
                "count": 1,
                "currency": t.currency,
                "risk_category": cat,
            }
        else:
            edge_aggregates[key]["amount"] += float(t.amount)
            edge_aggregates[key]["count"] += 1
            if cat == "high" or (
                cat == "medium" and edge_aggregates[key]["risk_category"] == "low"
            ):
                edge_aggregates[key]["risk_category"] = cat

        G.add_edge(u, v, weight=float(t.amount))

    # 3. Calculate node indicators
    in_degree = G.in_degree(target_str) if G.has_node(target_str) else 0
    out_degree = G.out_degree(target_str) if G.has_node(target_str) else 0

    fan_in_ratio = (
        round(float(in_degree / max(out_degree, 1)), 4) if out_degree > 0 or in_degree > 0 else 0.0
    )
    fan_out_ratio = (
        round(float(out_degree / max(in_degree, 1)), 4) if in_degree > 0 or out_degree > 0 else 0.0
    )

    # Cycle detection around account_id
    is_in_cycle = False
    cycle_length = None
    if G.has_node(target_str):
        try:
            cycles = list(nx.simple_cycles(G))
            for cycle in cycles:
                if target_str in cycle:
                    is_in_cycle = True
                    cycle_length = len(cycle)
                    break
        except Exception:
            pass

    # Neighborhood risk: avg of adjacent nodes' predictions
    neighborhood_risks = []
    for pred in preds_by_txn.values():
        neighborhood_risks.append(float(pred.risk_probability))
    neighborhood_risk = (
        round(sum(neighborhood_risks) / len(neighborhood_risks), 4) if neighborhood_risks else 0.10
    )

    # 4. Save/update GraphIndicator
    existing_ind_res = await db.execute(
        select(GraphIndicator)
        .where(GraphIndicator.account_id == account_id)
        .order_by(GraphIndicator.computed_at.desc())
    )
    ind = existing_ind_res.scalars().first()
    if not ind:
        ind = GraphIndicator(
            account_id=account_id,
            in_degree=in_degree,
            out_degree=out_degree,
            fan_in_ratio=Decimal(str(fan_in_ratio)),
            fan_out_ratio=Decimal(str(fan_out_ratio)),
            is_in_cycle=is_in_cycle,
            cycle_length=cycle_length,
            neighborhood_risk_score=Decimal(str(neighborhood_risk)),
        )
        db.add(ind)
    else:
        ind.in_degree = in_degree
        ind.out_degree = out_degree
        ind.fan_in_ratio = Decimal(str(fan_in_ratio))
        ind.fan_out_ratio = Decimal(str(fan_out_ratio))
        ind.is_in_cycle = is_in_cycle
        ind.cycle_length = cycle_length
        ind.neighborhood_risk_score = Decimal(str(neighborhood_risk))
    await db.flush()

    # 5. Build response objects
    # Query accounts for readable labels
    account_lookup: dict[uuid.UUID, Account] = {}
    if neighbor_ids:
        acct_res = await db.execute(select(Account).where(Account.account_id.in_(neighbor_ids)))
        for a in acct_res.scalars().all():
            account_lookup[a.account_id] = a

    nodes: list[GraphNode] = []
    for node_id in G.nodes():
        node_uuid = uuid.UUID(node_id)
        acct = account_lookup.get(node_uuid)
        label = acct.account_number if acct else node_id[:8] + "…"
        n_in = G.in_degree(node_id)
        n_out = G.out_degree(node_id)

        nodes.append(
            GraphNode(
                id=node_id,
                label=label,
                type="account",
                in_degree=n_in,
                out_degree=n_out,
                risk_score=neighborhood_risk if node_id == target_str else None,
                risk_category=(
                    "high"
                    if (node_id == target_str and is_in_cycle)
                    else "medium" if (n_in > 3 or n_out > 3) else "low"
                ),
            )
        )

    edges: list[GraphEdge] = [
        GraphEdge(
            source=k[0],
            target=k[1],
            amount=round(v["amount"], 2),
            transaction_count=v["count"],
            currency=v["currency"],
            risk_category=v["risk_category"],
        )
        for k, v in edge_aggregates.items()
    ]

    indicators_out = GraphIndicatorsOut(
        account_id=account_id,
        in_degree=in_degree,
        out_degree=out_degree,
        fan_in_ratio=fan_in_ratio,
        fan_out_ratio=fan_out_ratio,
        is_in_cycle=is_in_cycle,
        cycle_length=cycle_length,
        neighborhood_risk_score=neighborhood_risk,
    )

    return NetworkSubGraphOut(
        nodes=nodes,
        edges=edges,
        indicators=indicators_out,
    )

"""Unit and integration tests for graph network analysis (AML-FR-10, AML-FR-11, AML-FR-12)."""

import uuid
from datetime import UTC, datetime
from decimal import Decimal

from app.models.account import Account
from app.models.transaction import Transaction
from app.services.graph_engine import build_account_subgraph
from app.tests.conftest import OPERATOR, FakeResult, api_client


async def test_graph_endpoint_denies_data_operator(fake_session):
    acct_id = uuid.uuid4()
    async with api_client(current_user=OPERATOR, fake_session=fake_session) as client:
        res = await client.get(f"/api/v1/graph/accounts/{acct_id}")
        assert res.status_code == 403


async def test_build_account_subgraph_computes_indicators(fake_session):
    acct_a = uuid.uuid4()
    acct_b = uuid.uuid4()
    acct_c = uuid.uuid4()

    # Form a circular cycle: A -> B -> C -> A
    t1 = Transaction(
        transaction_id=uuid.uuid4(),
        origin_account_id=acct_a,
        destination_account_id=acct_b,
        amount=Decimal("5000.00"),
        currency="USD",
        occurred_at=datetime.now(UTC),
        ingestion_status="accepted",
    )
    t2 = Transaction(
        transaction_id=uuid.uuid4(),
        origin_account_id=acct_b,
        destination_account_id=acct_c,
        amount=Decimal("4900.00"),
        currency="USD",
        occurred_at=datetime.now(UTC),
        ingestion_status="accepted",
    )
    t3 = Transaction(
        transaction_id=uuid.uuid4(),
        origin_account_id=acct_c,
        destination_account_id=acct_a,
        amount=Decimal("4800.00"),
        currency="USD",
        occurred_at=datetime.now(UTC),
        ingestion_status="accepted",
    )

    # Sequence of database query results:
    # 1. direct txns for acct_a
    fake_session.execute_results.append(FakeResult(rows=[t1, t3]))
    # 2. hop2 txns
    fake_session.execute_results.append(FakeResult(rows=[t1, t2, t3]))
    # 3. predictions for txns
    fake_session.execute_results.append(FakeResult(rows=[]))
    # 4. existing graph indicators query
    fake_session.execute_results.append(FakeResult(rows=[]))
    # 5. account lookup query
    a1 = Account(account_id=acct_a, customer_id=uuid.uuid4(), account_number="ACC-A")
    a2 = Account(account_id=acct_b, customer_id=uuid.uuid4(), account_number="ACC-B")
    a3 = Account(account_id=acct_c, customer_id=uuid.uuid4(), account_number="ACC-C")
    fake_session.execute_results.append(FakeResult(rows=[a1, a2, a3]))

    subgraph = await build_account_subgraph(db=fake_session, account_id=acct_a, k_hops=2)

    assert len(subgraph.nodes) >= 3
    assert len(subgraph.edges) >= 3
    assert subgraph.indicators is not None
    assert subgraph.indicators.account_id == acct_a
    assert subgraph.indicators.is_in_cycle is True
    assert subgraph.indicators.cycle_length == 3

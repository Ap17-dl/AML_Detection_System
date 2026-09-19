"""Customer risk profile computation service (AML-FR-16, AML-FR-17, AML-FR-18).

Calculates dynamic customer risk scores from transaction patterns, updates
customer records, and appends audit-trail snapshots to customer_risk_history.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.customer import Customer
from app.models.customer_risk_history import CustomerRiskHistory
from app.models.prediction import Prediction
from app.models.transaction import Transaction

logger = logging.getLogger(__name__)


async def recalculate_customer_risk(
    db: AsyncSession,
    customer_id: uuid.UUID,
    reason: str = "scheduled_recompute",
) -> Customer:
    """Aggregates all predictions across customer accounts, computes customer risk,
    updates customer record and appends a history record.
    """
    customer = await db.get(Customer, customer_id)
    if not customer:
        raise ValueError(f"Customer {customer_id} not found")

    # Find all accounts for customer
    acct_res = await db.execute(
        select(Account.account_id).where(Account.customer_id == customer_id)
    )
    acct_ids = acct_res.scalars().all()

    if not acct_ids:
        score = Decimal("0.1000")
        category = "low"
    else:
        # Find transactions where customer account is origin or destination
        txn_res = await db.execute(
            select(Transaction.transaction_id).where(
                (Transaction.origin_account_id.in_(acct_ids))
                | (Transaction.destination_account_id.in_(acct_ids))
            )
        )
        txn_ids = txn_res.scalars().all()

        if not txn_ids:
            score = Decimal("0.1000")
            category = "low"
        else:
            # Query predictions for these transactions
            preds_res = await db.execute(
                select(Prediction.risk_probability).where(
                    Prediction.transaction_id.in_(txn_ids)
                )
            )
            probs = [float(p) for p in preds_res.scalars().all()]

            if not probs:
                score = Decimal("0.1500")
                category = "low"
            else:
                # Customer risk takes the 80th percentile / max blend
                max_risk = max(probs)
                avg_risk = sum(probs) / len(probs)
                combined = 0.65 * max_risk + 0.35 * avg_risk
                score = Decimal(f"{combined:.4f}")

                if score >= 0.70:
                    category = "high"
                elif score >= 0.30:
                    category = "medium"
                else:
                    category = "low"

    now = datetime.now(timezone.utc)
    customer.current_risk_score = score
    customer.current_risk_category = category
    customer.risk_updated_at = now

    # Append to history
    history = CustomerRiskHistory(
        customer_id=customer_id,
        risk_score=score,
        risk_category=category,
        reason=reason,
        recorded_at=now,
    )
    db.add(history)
    await db.flush()

    return customer

"""Alert management and lifecycle service (AML-FR-19, 20, 21, 22).

Automates alert creation on high-risk prediction, manages disposition outcomes,
and links investigation case notes and feedback.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import record_audit_log
from app.models.account import Account
from app.models.alert import Alert, AnalystFeedback, CaseNote
from app.models.customer import Customer
from app.models.prediction import Prediction
from app.models.transaction import Transaction
from app.services.risk_profile import recalculate_customer_risk

logger = logging.getLogger(__name__)


async def create_alert_for_transaction(
    db: AsyncSession,
    transaction: Transaction,
    prediction: Prediction,
) -> Alert | None:
    """Generates an open alert if the transaction is flagged high or medium risk."""
    if prediction.risk_category not in ("high", "medium"):
        return None

    # Check if an alert already exists for this transaction
    res = await db.execute(
        select(Alert).where(Alert.triggering_transaction_id == transaction.transaction_id)
    )
    existing = res.scalar_one_or_none()
    if existing:
        return existing

    # Find customer id via origin account
    acct = await db.get(Account, transaction.origin_account_id)
    cust_id = acct.customer_id if acct else None

    alert = Alert(
        customer_id=cust_id,
        triggering_transaction_id=transaction.transaction_id,
        prediction_id=prediction.prediction_id,
        risk_category=prediction.risk_category,
        status="open",
        threshold_config_used={
            "model_version": prediction.model_version,
            "risk_probability": float(prediction.risk_probability),
            "risk_category": prediction.risk_category,
        },
    )
    db.add(alert)
    await db.flush()

    # Trigger customer risk update
    if cust_id:
        try:
            await recalculate_customer_risk(db=db, customer_id=cust_id, reason="new_high_risk_txn")
        except Exception:
            pass

    return alert


async def record_case_note(
    db: AsyncSession,
    alert_id: uuid.UUID,
    author_id: uuid.UUID,
    note_text: str,
) -> CaseNote:
    note = CaseNote(
        alert_id=alert_id,
        author_id=author_id,
        note_text=note_text,
    )
    db.add(note)
    await db.flush()
    return note


async def submit_disposition_feedback(
    db: AsyncSession,
    alert_id: uuid.UUID,
    analyst_id: uuid.UUID,
    outcome_label: str,
    feedback_notes: str | None = None,
    quality_rating: int | None = None,
) -> AnalystFeedback:
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise ValueError(f"Alert {alert_id} not found")

    alert.outcome = outcome_label
    alert.status = "closed"
    alert.closed_at = datetime.now(timezone.utc)

    feedback = AnalystFeedback(
        alert_id=alert_id,
        analyst_id=analyst_id,
        outcome_label=outcome_label,
        feedback_notes=feedback_notes,
        explanation_quality_rating=quality_rating,
    )
    db.add(feedback)
    await db.flush()

    # Audit log
    await record_audit_log(
        db=db,
        actor_user_id=analyst_id,
        action="alert_outcome",
        entity_type="alert",
        entity_id=alert_id,
        details={"outcome": outcome_label, "rating": quality_rating},
    )

    # Recompute customer risk score following investigation conclusion
    if alert.customer_id:
        try:
            await recalculate_customer_risk(db=db, customer_id=alert.customer_id, reason="alert_outcome")
        except Exception:
            pass

    return feedback

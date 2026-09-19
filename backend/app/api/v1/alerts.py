"""Alerts and Case Investigation endpoints (AML-FR-19, 20, 21, 22)."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import record_audit_log
from app.core.security import CurrentUser, require_role
from app.db.session import get_db
from app.models.alert import Alert, AnalystFeedback, CaseNote
from app.models.customer import Customer
from app.models.role import RoleName
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.alert import (
    AlertListOut,
    AlertOut,
    AlertUpdate,
    AnalystFeedbackCreate,
    AnalystFeedbackOut,
    CaseNoteCreate,
    CaseNoteOut,
)
from app.services.alerting import record_case_note, submit_disposition_feedback

router = APIRouter(prefix="/alerts", tags=["alerts"])

_ANALYST_OR_ADMIN = require_role(RoleName.AML_ANALYST, RoleName.ADMINISTRATOR)


@router.get("", response_model=AlertListOut)
async def list_alerts(
    status: str | None = Query(None, description="Filter by status: open, in_progress, closed"),
    risk_category: str | None = Query(None, description="Filter by risk category: low, medium, high"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(_ANALYST_OR_ADMIN),
) -> AlertListOut:
    query = select(Alert)
    count_query = select(func.count(Alert.alert_id))

    if status:
        query = query.where(Alert.status == status)
        count_query = count_query.where(Alert.status == status)
    if risk_category:
        query = query.where(Alert.risk_category == risk_category)
        count_query = count_query.where(Alert.risk_category == risk_category)

    query = query.order_by(Alert.created_at.desc())
    total_res = await db.execute(count_query)
    total = total_res.scalar() or 0

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    alerts = (await db.execute(query)).scalars().all()

    # Join metadata
    items: list[AlertOut] = []
    for a in alerts:
        cust_name = None
        if a.customer_id:
            cust = await db.get(Customer, a.customer_id)
            cust_name = cust.full_name if cust else None

        txn_amt = None
        if a.triggering_transaction_id:
            txn = await db.get(Transaction, a.triggering_transaction_id)
            txn_amt = txn.amount if txn else None

        assigned_email = None
        if a.assigned_to:
            usr = await db.get(User, a.assigned_to)
            assigned_email = usr.email if usr else None

        items.append(
            AlertOut(
                alert_id=a.alert_id,
                customer_id=a.customer_id,
                customer_name=cust_name,
                triggering_transaction_id=a.triggering_transaction_id,
                transaction_amount=txn_amt,
                prediction_id=a.prediction_id,
                risk_category=a.risk_category,
                status=a.status,
                assigned_to=a.assigned_to,
                assigned_to_email=assigned_email,
                outcome=a.outcome,
                threshold_config_used=a.threshold_config_used,
                created_at=a.created_at,
                closed_at=a.closed_at,
            )
        )

    return AlertListOut(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{alert_id}", response_model=AlertOut)
async def get_alert(
    alert_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(_ANALYST_OR_ADMIN),
) -> AlertOut:
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")

    cust_name = None
    if alert.customer_id:
        cust = await db.get(Customer, alert.customer_id)
        cust_name = cust.full_name if cust else None

    txn_amt = None
    if alert.triggering_transaction_id:
        txn = await db.get(Transaction, alert.triggering_transaction_id)
        txn_amt = txn.amount if txn else None

    assigned_email = None
    if alert.assigned_to:
        usr = await db.get(User, alert.assigned_to)
        assigned_email = usr.email if usr else None

    return AlertOut(
        alert_id=alert.alert_id,
        customer_id=alert.customer_id,
        customer_name=cust_name,
        triggering_transaction_id=alert.triggering_transaction_id,
        transaction_amount=txn_amt,
        prediction_id=alert.prediction_id,
        risk_category=alert.risk_category,
        status=alert.status,
        assigned_to=alert.assigned_to,
        assigned_to_email=assigned_email,
        outcome=alert.outcome,
        threshold_config_used=alert.threshold_config_used,
        created_at=alert.created_at,
        closed_at=alert.closed_at,
    )


@router.patch("/{alert_id}", response_model=AlertOut)
async def update_alert(
    alert_id: uuid.UUID,
    body: AlertUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(_ANALYST_OR_ADMIN),
) -> AlertOut:
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")

    if body.status is not None:
        alert.status = body.status
    if body.assigned_to is not None:
        alert.assigned_to = body.assigned_to
    if body.outcome is not None:
        alert.outcome = body.outcome

    await record_audit_log(
        db=db,
        actor_user_id=current_user.user_id,
        action="update_alert",
        entity_type="alert",
        entity_id=alert.alert_id,
        details=body.model_dump(exclude_unset=True),
    )
    await db.commit()

    return await get_alert(alert_id=alert_id, db=db, current_user=current_user)


@router.get("/{alert_id}/notes", response_model=list[CaseNoteOut])
async def list_case_notes(
    alert_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(_ANALYST_OR_ADMIN),
) -> list[CaseNoteOut]:
    res = await db.execute(
        select(CaseNote)
        .where(CaseNote.alert_id == alert_id)
        .order_by(CaseNote.created_at.asc())
    )
    notes = res.scalars().all()
    out = []
    for n in notes:
        author = await db.get(User, n.author_id)
        out.append(
            CaseNoteOut(
                note_id=n.note_id,
                alert_id=n.alert_id,
                author_id=n.author_id,
                author_name=author.full_name or author.email if author else None,
                note_text=n.note_text,
                created_at=n.created_at,
            )
        )
    return out


@router.post("/{alert_id}/notes", response_model=CaseNoteOut, status_code=201)
async def add_case_note(
    alert_id: uuid.UUID,
    body: CaseNoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(_ANALYST_OR_ADMIN),
) -> CaseNoteOut:
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")

    note = await record_case_note(
        db=db,
        alert_id=alert_id,
        author_id=current_user.user_id,
        note_text=body.note_text,
    )
    await db.commit()

    return CaseNoteOut(
        note_id=note.note_id,
        alert_id=note.alert_id,
        author_id=note.author_id,
        author_name=current_user.full_name or current_user.email,
        note_text=note.note_text,
        created_at=note.created_at,
    )


@router.post("/{alert_id}/feedback", response_model=AnalystFeedbackOut)
async def submit_feedback(
    alert_id: uuid.UUID,
    body: AnalystFeedbackCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(_ANALYST_OR_ADMIN),
) -> AnalystFeedbackOut:
    feedback = await submit_disposition_feedback(
        db=db,
        alert_id=alert_id,
        analyst_id=current_user.user_id,
        outcome_label=body.outcome_label,
        feedback_notes=body.feedback_notes,
        quality_rating=body.explanation_quality_rating,
    )
    await db.commit()

    return AnalystFeedbackOut(
        feedback_id=feedback.feedback_id,
        alert_id=feedback.alert_id,
        analyst_id=feedback.analyst_id,
        outcome_label=feedback.outcome_label,
        feedback_notes=feedback.feedback_notes,
        explanation_quality_rating=feedback.explanation_quality_rating,
        submitted_at=feedback.submitted_at,
        reviewed_for_retraining=feedback.reviewed_for_retraining,
    )

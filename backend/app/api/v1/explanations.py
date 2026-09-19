"""Explanation API endpoints (AML-FR-13, AML-FR-14, AML-FR-15)."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import CurrentUser, require_role
from app.db.session import get_db
from app.models.prediction import Prediction
from app.models.role import RoleName
from app.models.transaction import Transaction
from app.schemas.explanation import ExplanationOut
from app.services.explainer import get_or_create_explanation
from app.services.inference import predict_and_persist

router = APIRouter(tags=["explanations"])

_ANALYST_OR_ADMIN = require_role(RoleName.AML_ANALYST, RoleName.ADMINISTRATOR)


@router.get(
    "/transactions/{transaction_id}/explanation",
    response_model=ExplanationOut,
    summary="Get SHAP feature explanation for a transaction prediction",
)
async def get_transaction_explanation(
    transaction_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(_ANALYST_OR_ADMIN),
) -> ExplanationOut:
    """Returns the SHAP local feature importance and natural language narrative."""
    txn_res = await db.execute(
        select(Transaction).where(Transaction.transaction_id == transaction_id)
    )
    txn = txn_res.scalar_one_or_none()
    if not txn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction {transaction_id} not found",
        )

    # Get or create prediction
    pred_res = await db.execute(
        select(Prediction)
        .where(Prediction.transaction_id == transaction_id)
        .order_by(Prediction.predicted_at.desc())
    )
    pred = pred_res.scalars().first()
    if not pred:
        pred = await predict_and_persist(db=db, transaction=txn)

    explanation = await get_or_create_explanation(db=db, prediction=pred, transaction=txn)
    await db.commit()

    return ExplanationOut.model_validate(explanation)

"""Prediction endpoints for transaction AML risk scoring (AML-FR-07, AML-FR-08, AML-FR-09)."""

import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import CurrentUser, require_role
from app.db.session import get_db
from app.models.model_metadata import ModelMetadata
from app.models.prediction import Prediction
from app.models.role import RoleName
from app.models.transaction import Transaction
from app.schemas.prediction import ModelMetadataOut, PredictionOut
from app.services.inference import predict_and_persist

router = APIRouter(tags=["predictions"])

_ANALYST_OR_ADMIN = require_role(RoleName.AML_ANALYST, RoleName.ADMINISTRATOR)


@router.get(
    "/transactions/{transaction_id}/prediction",
    response_model=PredictionOut,
    summary="Get or compute prediction for a transaction",
)
async def get_transaction_prediction(
    transaction_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(_ANALYST_OR_ADMIN),
) -> PredictionOut:
    """Returns the ML prediction for a given transaction.

    If not already scored, runs inference and stores the prediction.
    """
    txn_res = await db.execute(
        select(Transaction).where(Transaction.transaction_id == transaction_id)
    )
    txn = txn_res.scalar_one_or_none()
    if not txn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction {transaction_id} not found",
        )

    # Fetch latest prediction
    pred_res = await db.execute(
        select(Prediction)
        .where(Prediction.transaction_id == transaction_id)
        .order_by(Prediction.predicted_at.desc())
    )
    pred = pred_res.scalars().first()

    if not pred:
        # Run inference on the fly
        pred = await predict_and_persist(db=db, transaction=txn)
        await db.commit()

    return PredictionOut.model_validate(pred)


@router.get(
    "/models",
    response_model=list[ModelMetadataOut],
    summary="List ML model metadata and benchmark performance metrics",
)
async def list_models(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(_ANALYST_OR_ADMIN),
) -> list[ModelMetadataOut]:
    result = await db.execute(
        select(ModelMetadata).order_by(ModelMetadata.created_at.desc())
    )
    models = result.scalars().all()
    return [ModelMetadataOut.model_validate(m) for m in models]

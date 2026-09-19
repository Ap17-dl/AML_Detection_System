"""Inference service for AML transaction risk scoring (AML-FR-07, AML-FR-08, AML-FR-09).

Loads the active serialized ML model, extracts features, calculates probability,
determines risk category (low/medium/high), and saves predictions.
"""

from __future__ import annotations

import logging
import os
import uuid
from decimal import Decimal
from pathlib import Path
from typing import Any

import joblib
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_metadata import ModelMetadata
from app.models.prediction import Prediction
from app.models.transaction import Transaction
from ml.dataset import extract_features_single

logger = logging.getLogger(__name__)

# In-memory cached model artifact
_MODEL_CACHE: dict[str, Any] = {}
DEFAULT_MODEL_VERSION = "xgb_v1.0.0"
DEFAULT_ARTIFACT_PATH = Path(__file__).resolve().parent.parent.parent / "ml" / "artifacts" / f"{DEFAULT_MODEL_VERSION}.joblib"


def get_model_artifact(artifact_path: str | Path | None = None) -> dict:
    """Loads and caches the model artifact in memory."""
    path_str = str(artifact_path or DEFAULT_ARTIFACT_PATH)
    if path_str in _MODEL_CACHE:
        return _MODEL_CACHE[path_str]

    if not Path(path_str).exists():
        # If the specific file doesn't exist, fallback to default
        if Path(DEFAULT_ARTIFACT_PATH).exists():
            path_str = str(DEFAULT_ARTIFACT_PATH)
        else:
            raise FileNotFoundError(f"Model artifact not found at {path_str}")

    artifact = joblib.load(path_str)
    _MODEL_CACHE[path_str] = artifact
    return artifact


def score_transaction(
    amount: float,
    occurred_at: Any,
    channel: str | None = None,
    txn_velocity_24h: float = 1.0,
    historical_avg_amount: float | None = None,
    artifact: dict | None = None,
) -> tuple[float, str, str]:
    """Calculates risk probability and category for a single transaction.

    Returns:
        (risk_probability, risk_category, model_version)
    """
    art = artifact or get_model_artifact()
    model = art["model"]
    metrics = art.get("metrics", {})
    version = metrics.get("model_version", DEFAULT_MODEL_VERSION)
    thresh_low = float(metrics.get("threshold_low_max", 0.30))
    thresh_med = float(metrics.get("threshold_medium_max", 0.70))

    features = extract_features_single(
        amount=amount,
        occurred_at=occurred_at,
        channel=channel,
        txn_velocity_24h=txn_velocity_24h,
        historical_avg_amount=historical_avg_amount,
    )

    probs = model.predict_proba(features)[0]
    prob = float(probs[1]) if len(probs) > 1 else float(probs[0])
    prob = max(0.0, min(1.0, prob))

    if prob <= thresh_low:
        category = "low"
    elif prob <= thresh_med:
        category = "medium"
    else:
        category = "high"

    return prob, category, version


async def predict_and_persist(
    db: AsyncSession,
    transaction: Transaction,
    txn_velocity_24h: float = 1.0,
    historical_avg_amount: float | None = None,
) -> Prediction:
    """Computes risk prediction for a transaction and persists it to the database."""
    # Ensure active model is recorded in metadata if not present
    result = await db.execute(
        select(ModelMetadata).where(ModelMetadata.model_version == DEFAULT_MODEL_VERSION)
    )
    meta = result.scalar_one_or_none()
    if not meta:
        art = get_model_artifact()
        metrics = art.get("metrics", {})
        meta = ModelMetadata(
            model_version=DEFAULT_MODEL_VERSION,
            algorithm=metrics.get("algorithm", "XGBoost"),
            trained_at=transaction.occurred_at,
            training_dataset=metrics.get("training_dataset", "synthetic_aml_5000"),
            precision_score=Decimal(str(metrics.get("precision_score", 1.0))),
            recall_score=Decimal(str(metrics.get("recall_score", 1.0))),
            f1_score=Decimal(str(metrics.get("f1_score", 1.0))),
            pr_auc=Decimal(str(metrics.get("pr_auc", 1.0))),
            roc_auc=Decimal(str(metrics.get("roc_auc", 1.0))),
            false_positive_rate=Decimal(str(metrics.get("false_positive_rate", 0.0))),
            false_negative_rate=Decimal(str(metrics.get("false_negative_rate", 0.0))),
            threshold_low_max=Decimal(str(metrics.get("threshold_low_max", 0.30))),
            threshold_medium_max=Decimal(str(metrics.get("threshold_medium_max", 0.70))),
            is_active=True,
            artifact_path=str(DEFAULT_ARTIFACT_PATH),
        )
        db.add(meta)
        await db.flush()

    prob, cat, version = score_transaction(
        amount=float(transaction.amount),
        occurred_at=transaction.occurred_at,
        channel=transaction.channel,
        txn_velocity_24h=txn_velocity_24h,
        historical_avg_amount=historical_avg_amount,
    )

    # Check existing prediction for this txn and model
    res = await db.execute(
        select(Prediction).where(
            Prediction.transaction_id == transaction.transaction_id,
            Prediction.model_version == version,
        )
    )
    pred = res.scalar_one_or_none()
    if pred:
        pred.risk_probability = Decimal(f"{prob:.5f}")
        pred.risk_category = cat
        pred.combined_risk_score = Decimal(f"{prob:.5f}")
    else:
        pred = Prediction(
            transaction_id=transaction.transaction_id,
            model_version=version,
            risk_probability=Decimal(f"{prob:.5f}"),
            risk_category=cat,
            combined_risk_score=Decimal(f"{prob:.5f}"),
        )
        db.add(pred)

    await db.flush()
    return pred

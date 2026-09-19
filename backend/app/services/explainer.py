"""SHAP explainer service for AML predictions (AML-FR-13, AML-FR-14, AML-FR-15).

Calculates local SHAP feature contributions for a transaction prediction and
generates audit-persisted natural-language explanations.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any

import numpy as np
import shap
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.explanation import Explanation
from app.models.prediction import Prediction
from app.models.transaction import Transaction
from app.services.inference import get_model_artifact
from ml.dataset import FEATURE_NAMES, extract_features_single

logger = logging.getLogger(__name__)

_EXPLAINER_CACHE: dict[str, shap.TreeExplainer] = {}

FEATURE_LABELS = {
    "amount": "Transfer amount",
    "log_amount": "Normalized transaction volume",
    "hour_of_day": "Hour of day",
    "day_of_week": "Day of week",
    "is_weekend": "Weekend timing",
    "is_night": "Off-hours transaction (nighttime)",
    "is_round_amount": "Round dollar structuring pattern",
    "channel_online": "Online channel",
    "channel_branch": "Branch channel",
    "channel_atm": "ATM channel",
    "channel_wire": "High-risk wire transfer channel",
    "txn_velocity_24h": "24-hour transaction frequency",
    "amount_to_avg_ratio": "Spike relative to typical customer average",
}


def get_tree_explainer() -> shap.TreeExplainer:
    """Returns a cached TreeExplainer instance for the active model."""
    if "active" in _EXPLAINER_CACHE:
        return _EXPLAINER_CACHE["active"]

    artifact = get_model_artifact()
    model = artifact["model"]
    explainer = shap.TreeExplainer(model)
    _EXPLAINER_CACHE["active"] = explainer
    return explainer


def explain_transaction(
    amount: float,
    occurred_at: Any,
    channel: str | None = None,
    txn_velocity_24h: float = 1.0,
    historical_avg_amount: float | None = None,
    top_k: int = 5,
) -> tuple[list[dict[str, Any]], str]:
    """Computes SHAP feature importance and creates narrative text for a single transaction.

    Returns:
        (top_features, narrative_text)
    """
    explainer = get_tree_explainer()
    features = extract_features_single(
        amount=amount,
        occurred_at=occurred_at,
        channel=channel,
        txn_velocity_24h=txn_velocity_24h,
        historical_avg_amount=historical_avg_amount,
    )

    shap_values = explainer.shap_values(features)
    # If binary classification returns list of arrays or 2D array
    if isinstance(shap_values, list):
        vals = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
    elif len(shap_values.shape) == 2:
        vals = shap_values[0]
    else:
        vals = shap_values[0, :, 1] if shap_values.shape[-1] == 2 else shap_values[0, :]

    contributions = []
    for name, val in zip(FEATURE_NAMES, vals):
        sv = float(val)
        direction = "increases_risk" if sv > 0 else "decreases_risk"
        friendly = FEATURE_LABELS.get(name, name)
        contributions.append(
            {
                "feature": name,
                "shap_value": round(sv, 4),
                "direction": direction,
                "description": friendly,
            }
        )

    # Sort by absolute SHAP value descending
    contributions.sort(key=lambda c: abs(c["shap_value"]), reverse=True)
    top_features = contributions[:top_k]

    # Generate natural language narrative
    risk_drivers = [c for c in top_features if c["direction"] == "increases_risk"]
    mitigating = [c for c in top_features if c["direction"] == "decreases_risk"]

    driver_phrases = [
        f"{c['description'].lower()} (+{c['shap_value']:.2f})"
        for c in risk_drivers[:3]
    ]
    mitigating_phrases = [
        f"{c['description'].lower()} ({c['shap_value']:.2f})"
        for c in mitigating[:2]
    ]

    parts = []
    if driver_phrases:
        parts.append(f"Flagged primarily due to: {', '.join(driver_phrases)}.")
    if mitigating_phrases:
        parts.append(f"Mitigating indicators include: {', '.join(mitigating_phrases)}.")
    if not parts:
        parts.append("Transaction risk evaluated based on baseline behavioral and channel indicators.")

    narrative_text = " ".join(parts)
    return top_features, narrative_text


async def get_or_create_explanation(
    db: AsyncSession,
    prediction: Prediction,
    transaction: Transaction,
) -> Explanation:
    """Fetches existing explanation or computes, persists, and returns new one."""
    res = await db.execute(
        select(Explanation).where(Explanation.prediction_id == prediction.prediction_id)
    )
    existing = res.scalar_one_or_none()
    if existing:
        return existing

    top_features, narrative = explain_transaction(
        amount=float(transaction.amount),
        occurred_at=transaction.occurred_at,
        channel=transaction.channel,
    )

    explanation = Explanation(
        prediction_id=prediction.prediction_id,
        top_features=top_features,
        narrative_text=narrative,
    )
    db.add(explanation)
    await db.flush()
    return explanation

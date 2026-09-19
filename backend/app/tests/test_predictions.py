"""Unit and integration tests for ML prediction and model metadata (AML-FR-07, AML-FR-08, AML-FR-09)."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from app.models.model_metadata import ModelMetadata
from app.models.prediction import Prediction
from app.models.transaction import Transaction
from app.services.inference import score_transaction
from app.tests.conftest import ADMIN, ANALYST, OPERATOR, FakeResult, FakeSession, api_client


def test_score_transaction_bounds_and_categories():
    now = datetime(2026, 3, 15, 14, 0, 0, tzinfo=timezone.utc)

    # Typical small transaction
    prob_low, cat_low, ver_low = score_transaction(
        amount=45.0,
        occurred_at=now,
        channel="online",
    )
    assert 0.0 <= prob_low <= 1.0
    assert cat_low in ("low", "medium", "high")
    assert ver_low == "xgb_v1.0.0"

    # Extreme suspicious structuring / night transaction
    night = datetime(2026, 3, 15, 3, 0, 0, tzinfo=timezone.utc)
    prob_high, cat_high, _ = score_transaction(
        amount=9900.0,
        occurred_at=night,
        channel="wire",
        txn_velocity_24h=8.0,
        historical_avg_amount=200.0,
    )
    assert 0.0 <= prob_high <= 1.0
    assert cat_high in ("low", "medium", "high")


async def test_prediction_endpoint_rbac(fake_session):
    txn_id = uuid.uuid4()
    # Data Operator is denied from predictions endpoint (Analyst & Admin only)
    async with api_client(current_user=OPERATOR, fake_session=fake_session) as client:
        res = await client.get(f"/api/v1/transactions/{txn_id}/prediction")
        assert res.status_code == 403


async def test_prediction_endpoint_allows_analyst_and_returns_prediction(fake_session):
    txn_id = uuid.uuid4()
    txn = Transaction(
        transaction_id=txn_id,
        origin_account_id=uuid.uuid4(),
        destination_account_id=uuid.uuid4(),
        amount=Decimal("500.00"),
        currency="USD",
        occurred_at=datetime.now(timezone.utc),
    )
    pred = Prediction(
        prediction_id=uuid.uuid4(),
        transaction_id=txn_id,
        model_version="xgb_v1.0.0",
        risk_probability=Decimal("0.85400"),
        risk_category="high",
        combined_risk_score=Decimal("0.85400"),
        predicted_at=datetime.now(timezone.utc),
    )

    # First query gets transaction, second gets prediction
    fake_session.execute_results.append(FakeResult(scalar=txn))
    fake_session.execute_results.append(FakeResult(rows=[pred]))

    async with api_client(current_user=ANALYST, fake_session=fake_session) as client:
        res = await client.get(f"/api/v1/transactions/{txn_id}/prediction")
        assert res.status_code == 200
        data = res.json()
        assert data["transaction_id"] == str(txn_id)
        assert data["risk_category"] == "high"
        assert data["risk_probability"] == 0.854


async def test_list_models_allows_admin(fake_session):
    meta = ModelMetadata(
        model_version="xgb_v1.0.0",
        algorithm="XGBoost",
        trained_at=datetime.now(timezone.utc),
        training_dataset="synthetic_aml_5000",
        precision_score=Decimal("0.9600"),
        recall_score=Decimal("0.9400"),
        f1_score=Decimal("0.9500"),
        pr_auc=Decimal("0.9800"),
        roc_auc=Decimal("0.9900"),
        false_positive_rate=Decimal("0.0200"),
        false_negative_rate=Decimal("0.0600"),
        threshold_low_max=Decimal("0.3000"),
        threshold_medium_max=Decimal("0.7000"),
        is_active=True,
        artifact_path="/path/to/model",
        created_at=datetime.now(timezone.utc),
    )
    fake_session.execute_results.append(FakeResult(rows=[meta]))

    async with api_client(current_user=ADMIN, fake_session=fake_session) as client:
        res = await client.get("/api/v1/models")
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 1
        assert data[0]["model_version"] == "xgb_v1.0.0"
        assert data[0]["algorithm"] == "XGBoost"
        assert data[0]["f1_score"] == 0.95

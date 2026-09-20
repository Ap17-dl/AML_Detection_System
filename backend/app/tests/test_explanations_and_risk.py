"""Unit and integration tests for SHAP explanations and customer risk profiling (AML-FR-13..18)."""

import uuid
from datetime import UTC, datetime
from decimal import Decimal

from app.models.customer import Customer
from app.models.customer_risk_history import CustomerRiskHistory
from app.models.explanation import Explanation
from app.models.prediction import Prediction
from app.models.transaction import Transaction
from app.services.explainer import explain_transaction
from app.tests.conftest import ANALYST, OPERATOR, FakeResult, api_client


def test_explain_transaction_outputs_features_and_narrative():
    now = datetime(2026, 3, 15, 2, 30, 0, tzinfo=UTC)
    top_features, narrative = explain_transaction(
        amount=12500.0,
        occurred_at=now,
        channel="wire",
        txn_velocity_24h=7.0,
        historical_avg_amount=300.0,
        top_k=4,
    )
    assert len(top_features) == 4
    for feat in top_features:
        assert "feature" in feat
        assert "shap_value" in feat
        assert feat["direction"] in ("increases_risk", "decreases_risk")
        assert "description" in feat
    assert isinstance(narrative, str)
    assert len(narrative) > 10


async def test_explanation_endpoint_denies_data_operator(fake_session):
    txn_id = uuid.uuid4()
    async with api_client(current_user=OPERATOR, fake_session=fake_session) as client:
        res = await client.get(f"/api/v1/transactions/{txn_id}/explanation")
        assert res.status_code == 403


async def test_explanation_endpoint_allows_analyst(fake_session):
    txn_id = uuid.uuid4()
    pred_id = uuid.uuid4()
    txn = Transaction(
        transaction_id=txn_id,
        origin_account_id=uuid.uuid4(),
        destination_account_id=uuid.uuid4(),
        amount=Decimal("15000.00"),
        currency="USD",
        occurred_at=datetime.now(UTC),
    )
    pred = Prediction(
        prediction_id=pred_id,
        transaction_id=txn_id,
        model_version="xgb_v1.0.0",
        risk_probability=Decimal("0.92000"),
        risk_category="high",
        predicted_at=datetime.now(UTC),
    )
    explanation = Explanation(
        explanation_id=uuid.uuid4(),
        prediction_id=pred_id,
        top_features=[
            {
                "feature": "amount",
                "shap_value": 0.45,
                "direction": "increases_risk",
                "description": "Transfer amount",
            }
        ],
        narrative_text="Flagged primarily due to transfer amount (+0.45).",
        generated_at=datetime.now(UTC),
    )

    fake_session.execute_results.append(FakeResult(scalar=txn))
    fake_session.execute_results.append(FakeResult(rows=[pred]))
    fake_session.execute_results.append(FakeResult(scalar=explanation))

    async with api_client(current_user=ANALYST, fake_session=fake_session) as client:
        res = await client.get(f"/api/v1/transactions/{txn_id}/explanation")
        assert res.status_code == 200
        data = res.json()
        assert data["prediction_id"] == str(pred_id)
        assert len(data["top_features"]) == 1
        assert "narrative_text" in data


async def test_customer_risk_profile_endpoint(fake_session):
    cust_id = uuid.uuid4()
    customer = Customer(
        customer_id=cust_id,
        full_name="Jane Doe",
        current_risk_score=Decimal("0.7800"),
        current_risk_category="high",
        risk_updated_at=datetime.now(UTC),
    )
    hist = CustomerRiskHistory(
        history_id=uuid.uuid4(),
        customer_id=cust_id,
        risk_score=Decimal("0.7800"),
        risk_category="high",
        reason="manual_request",
        recorded_at=datetime.now(UTC),
    )

    fake_session.get_results[cust_id] = customer
    fake_session.execute_results.append(FakeResult(rows=[hist]))

    async with api_client(current_user=ANALYST, fake_session=fake_session) as client:
        res = await client.get(f"/api/v1/customers/{cust_id}/risk-profile")
        assert res.status_code == 200
        data = res.json()
        assert data["customer_id"] == str(cust_id)
        assert data["current_risk_score"] == 0.78
        assert data["current_risk_category"] == "high"
        assert len(data["history"]) == 1

"""Unit and integration tests for Alerts, Dashboard, Reports, and Audit Logging (AML-FR-19..25)."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from app.models.alert import Alert, AnalystFeedback, CaseNote
from app.models.audit_log import AuditLog
from app.models.customer import Customer
from app.models.prediction import Prediction
from app.models.transaction import Transaction
from app.models.user import User
from app.services.alerting import create_alert_for_transaction
from app.tests.conftest import ADMIN, ANALYST, OPERATOR, FakeResult, FakeSession, api_client


async def test_create_alert_for_high_risk_transaction(fake_session):
    txn_id = uuid.uuid4()
    cust_id = uuid.uuid4()
    acct_id = uuid.uuid4()

    txn = Transaction(
        transaction_id=txn_id,
        origin_account_id=acct_id,
        destination_account_id=uuid.uuid4(),
        amount=Decimal("9900.00"),
        currency="USD",
        occurred_at=datetime.now(timezone.utc),
    )
    pred = Prediction(
        prediction_id=uuid.uuid4(),
        transaction_id=txn_id,
        model_version="xgb_v1.0.0",
        risk_probability=Decimal("0.89000"),
        risk_category="high",
    )

    # 1. Check existing alert query returns None
    fake_session.execute_results.append(FakeResult(scalar=None))

    alert = await create_alert_for_transaction(db=fake_session, transaction=txn, prediction=pred)
    assert alert is not None
    assert alert.risk_category == "high"
    assert alert.status == "open"
    assert alert.triggering_transaction_id == txn_id


async def test_alerts_endpoint_denies_data_operator(fake_session):
    async with api_client(current_user=OPERATOR, fake_session=fake_session) as client:
        res = await client.get("/api/v1/alerts")
        assert res.status_code == 403


async def test_alerts_endpoint_allows_analyst(fake_session):
    alert = Alert(
        alert_id=uuid.uuid4(),
        risk_category="high",
        status="open",
        created_at=datetime.now(timezone.utc),
    )
    # Count query, then list query
    fake_session.execute_results.append(FakeResult(scalar=1))
    fake_session.execute_results.append(FakeResult(rows=[alert]))

    async with api_client(current_user=ANALYST, fake_session=fake_session) as client:
        res = await client.get("/api/v1/alerts")
        assert res.status_code == 200
        data = res.json()
        assert data["total"] == 1
        assert len(data["items"]) == 1
        assert data["items"][0]["risk_category"] == "high"


async def test_dashboard_summary_allows_all_staff(fake_session):
    # Setup results for 8 queries in dashboard summary:
    # 1. open_alerts, 2. total_txns, 3. high_risk, 4. customers, 5. closed, 6. false_positives,
    # 7. by_risk, 8. by_status, 9. recent
    fake_session.execute_results.append(FakeResult(scalar=5))   # open alerts
    fake_session.execute_results.append(FakeResult(scalar=200)) # total txns
    fake_session.execute_results.append(FakeResult(scalar=12))  # high risk
    fake_session.execute_results.append(FakeResult(scalar=45))  # customers
    fake_session.execute_results.append(FakeResult(scalar=10))  # closed alerts
    fake_session.execute_results.append(FakeResult(scalar=2))   # false positives
    fake_session.execute_results.append(FakeResult(rows=[("high", 10), ("medium", 5), ("low", 2)]))
    fake_session.execute_results.append(FakeResult(rows=[("open", 5), ("closed", 10)]))
    fake_session.execute_results.append(FakeResult(rows=[]))    # recent alerts

    async with api_client(current_user=OPERATOR, fake_session=fake_session) as client:
        res = await client.get("/api/v1/dashboard/summary")
        assert res.status_code == 200
        data = res.json()
        assert data["open_alerts_count"] == 5
        assert data["total_transactions_count"] == 200
        assert data["false_positive_rate"] == 0.2


async def test_reports_export_csv(fake_session):
    fake_session.execute_results.append(FakeResult(rows=[])) # alerts query

    async with api_client(current_user=ANALYST, fake_session=fake_session) as client:
        res = await client.get("/api/v1/reports/export?report_type=alerts")
        assert res.status_code == 200
        assert res.headers["content-type"].startswith("text/csv")
        assert "alert_id" in res.text


async def test_audit_logs_denies_analyst_allows_admin(fake_session):
    async with api_client(current_user=ANALYST, fake_session=fake_session) as client:
        res = await client.get("/api/v1/audit-logs")
        assert res.status_code == 403

    log = AuditLog(
        audit_id=uuid.uuid4(),
        action="login",
        entity_type="user",
        created_at=datetime.now(timezone.utc),
    )
    fake_session.execute_results.append(FakeResult(scalar=1))
    fake_session.execute_results.append(FakeResult(rows=[log]))

    async with api_client(current_user=ADMIN, fake_session=fake_session) as client:
        res = await client.get("/api/v1/audit-logs")
        assert res.status_code == 200
        data = res.json()
        assert data["total"] == 1
        assert len(data["items"]) == 1
        assert data["items"][0]["action"] == "login"

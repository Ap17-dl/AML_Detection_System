"""Unit and integration tests for CSV ingestion and row validation (AML-FR-04, AML-FR-05, AML-FR-06)."""

import io

from app.services.ingestion import _validate_row
from app.tests.conftest import ANALYST, api_client


def test_validate_row_valid():
    row = {
        "origin_account": "ACC-001",
        "destination_account": "ACC-002",
        "amount": "15000.50",
        "occurred_at": "2026-03-15T10:30:00Z",
        "currency": "USD",
        "transaction_type": "wire",
        "channel": "online",
        "origin_customer_name": "Alice Smith",
        "destination_customer_name": "Bob Jones",
    }
    parsed, errors = _validate_row(row, row_number=1)
    assert len(errors) == 0
    assert parsed is not None
    assert parsed["origin_account"] == "ACC-001"
    assert parsed["destination_account"] == "ACC-002"
    assert parsed["amount"] == 15000.50
    assert parsed["currency"] == "USD"


def test_validate_row_missing_required_fields():
    row = {
        "origin_account": "ACC-001",
        "destination_account": "",
        "amount": "",
        "occurred_at": "",
    }
    parsed, errors = _validate_row(row, row_number=2)
    assert len(errors) == 3
    fields_with_errors = {e.field for e in errors}
    assert "destination_account" in fields_with_errors
    assert "amount" in fields_with_errors
    assert "occurred_at" in fields_with_errors


def test_validate_row_invalid_amount_negative_or_zero():
    row = {
        "origin_account": "ACC-001",
        "destination_account": "ACC-002",
        "amount": "-500",
        "occurred_at": "2026-03-15T10:30:00Z",
    }
    parsed, errors = _validate_row(row, row_number=3)
    assert any(e.field == "amount" and "Amount must be > 0." in e.message for e in errors)

    row["amount"] = "0"
    parsed, errors = _validate_row(row, row_number=3)
    assert any(e.field == "amount" and "Amount must be > 0." in e.message for e in errors)


def test_validate_row_same_origin_and_destination():
    row = {
        "origin_account": "ACC-001",
        "destination_account": "ACC-001",
        "amount": "250.00",
        "occurred_at": "2026-03-15T10:30:00Z",
    }
    parsed, errors = _validate_row(row, row_number=4)
    assert any("must differ" in e.message for e in errors)


def test_validate_row_invalid_date():
    row = {
        "origin_account": "ACC-001",
        "destination_account": "ACC-002",
        "amount": "100.00",
        "occurred_at": "not-a-date",
    }
    parsed, errors = _validate_row(row, row_number=5)
    assert any(e.field == "occurred_at" for e in errors)


async def test_csv_import_endpoint_rbac(fake_session):
    csv_content = b"origin_account,destination_account,amount,occurred_at\nACC-1,ACC-2,100,2026-01-01T00:00:00Z"
    files = {"file": ("test.csv", io.BytesIO(csv_content), "text/csv")}

    # Analysts are read-only and denied
    async with api_client(current_user=ANALYST, fake_session=fake_session) as client:
        res = await client.post("/api/v1/transactions/import", files=files)
        assert res.status_code == 403


async def test_ingest_csv_populates_multiple_tables(fake_session):
    import uuid

    from app.models.account import Account
    from app.models.alert import Alert
    from app.models.audit_log import AuditLog
    from app.models.customer import Customer
    from app.models.explanation import Explanation
    from app.models.ingestion_batch import IngestionBatch
    from app.models.prediction import Prediction
    from app.models.transaction import Transaction
    from app.services.ingestion import ingest_csv
    from app.tests.conftest import FakeResult

    # CSV with 1 transaction
    csv_bytes = (
        b"origin_account,destination_account,amount,occurred_at,channel,transaction_type,origin_customer_name,destination_customer_name\n"
        b"ACC-101,ACC-102,15000.00,2026-03-15T12:00:00Z,wire,wire,Alice Smith,Bob Jones\n"
    )

    # Queue up execute results for FakeSession:
    # 1. origin account lookup -> None
    fake_session.execute_results.append(FakeResult(scalar=None))
    # 2. origin customer name lookup -> empty
    fake_session.execute_results.append(FakeResult(rows=[]))
    # 3. dest account lookup -> None
    fake_session.execute_results.append(FakeResult(scalar=None))
    # 4. dest customer name lookup -> empty
    fake_session.execute_results.append(FakeResult(rows=[]))
    # 5. model_metadata lookup -> found
    fake_session.execute_results.append(FakeResult(scalar="xgb_v1.0.0"))
    # 6. alert existing check -> None
    fake_session.execute_results.append(FakeResult(scalar=None))

    operator_id = uuid.uuid4()
    batch, errors = await ingest_csv(
        db=fake_session,
        csv_bytes=csv_bytes,
        filename="test_multi_table.csv",
        uploaded_by=operator_id,
    )

    assert len(errors) == 0
    assert batch.accepted_rows == 1
    assert batch.status == "completed"

    added_types = {type(obj) for obj in fake_session.added}
    assert IngestionBatch in added_types
    assert Customer in added_types
    assert Account in added_types
    assert Transaction in added_types
    assert Prediction in added_types
    assert Explanation in added_types
    assert Alert in added_types
    assert AuditLog in added_types


async def test_initial_batch_rejects_more_than_3_files(fake_session):
    csv_bytes = b"origin_account,destination_account,amount,occurred_at\nACC-1,ACC-2,100,2026-01-01T00:00:00Z"
    files = [
        ("files", ("f1.csv", io.BytesIO(csv_bytes), "text/csv")),
        ("files", ("f2.csv", io.BytesIO(csv_bytes), "text/csv")),
        ("files", ("f3.csv", io.BytesIO(csv_bytes), "text/csv")),
        ("files", ("f4.csv", io.BytesIO(csv_bytes), "text/csv")),
    ]
    async with api_client(current_user=ANALYST, fake_session=fake_session) as client:
        res = await client.post("/api/v1/transactions/initial-batch", files=files)
        assert res.status_code == 422
        data = res.json()
        assert data["error"]["code"] == "too_many_files"

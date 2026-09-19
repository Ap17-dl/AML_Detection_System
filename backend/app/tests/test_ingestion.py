"""Unit and integration tests for CSV ingestion and row validation (AML-FR-04, AML-FR-05, AML-FR-06)."""

import io
from app.services.ingestion import _validate_row, ingest_csv
from app.tests.conftest import ADMIN, ANALYST, OPERATOR, FakeSession, FakeResult, api_client


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

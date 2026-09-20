"""CSV ingestion service — validates, creates customers/accounts/transactions from CSV uploads.

Implements AML-FR-04 (accept CSV input), AML-FR-05 (row-level validation), and supports
AML-FR-06 (ingestion error reporting) via the IngestionReportOut schema.
"""

from __future__ import annotations

import csv
import io
import uuid
from datetime import datetime
from decimal import Decimal, InvalidOperation

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.customer import Customer
from app.models.ingestion_batch import IngestionBatch
from app.models.transaction import Transaction
from app.schemas.transaction import IngestionRowError

# Columns we expect in an uploaded CSV.  The CSV header names are normalised to lowercase
# before lookup so the user can supply any casing they like.
REQUIRED_COLUMNS = {
    "origin_account",
    "destination_account",
    "amount",
    "occurred_at",
}

OPTIONAL_COLUMNS = {
    "external_ref",
    "currency",
    "transaction_type",
    "channel",
    "origin_customer_name",
    "destination_customer_name",
    "origin_customer_country",
    "destination_customer_country",
}


def _normalise_header(header: str) -> str:
    return header.strip().lower().replace(" ", "_").replace("-", "_")


async def _resolve_or_create_account(
    db: AsyncSession,
    account_number: str,
    customer_name: str | None,
    customer_country: str | None,
    cache: dict[str, uuid.UUID],
) -> uuid.UUID:
    """Returns the account_id for *account_number*, creating the account and a stub
    customer if they don't already exist.  Uses an in-memory cache to avoid duplicate
    lookups within the same batch.
    """
    if account_number in cache:
        return cache[account_number]

    result = await db.execute(
        select(Account.account_id).where(Account.account_number == account_number)
    )
    existing = result.scalar_one_or_none()
    if existing:
        cache[account_number] = existing
        return existing

    # Create a stub customer (risk profiling happens in Sprint 4)
    customer = Customer(
        full_name=customer_name or f"Customer ({account_number})",
        country=customer_country,
    )
    db.add(customer)
    await db.flush()  # populates customer.customer_id

    account = Account(
        customer_id=customer.customer_id,
        account_number=account_number,
    )
    db.add(account)
    await db.flush()

    cache[account_number] = account.account_id
    return account.account_id


def _validate_row(
    row: dict[str, str], row_number: int
) -> tuple[dict | None, list[IngestionRowError]]:
    """Validates a single CSV row.  Returns (parsed_data, errors).

    If errors is non-empty the row should be rejected; parsed_data is only usable when
    errors is empty.
    """
    errors: list[IngestionRowError] = []

    # --- required field presence ---
    for col in sorted(REQUIRED_COLUMNS):
        if not row.get(col, "").strip():
            errors.append(
                IngestionRowError(row=row_number, field=col, message=f"'{col}' is required.")
            )

    if errors:
        return None, errors  # no point validating further

    # --- amount ---
    amount_raw = row["amount"].strip()
    amount = None
    try:
        amount = Decimal(amount_raw)
        if amount <= 0:
            errors.append(
                IngestionRowError(row=row_number, field="amount", message="Amount must be > 0.")
            )
    except (InvalidOperation, ValueError):
        errors.append(
            IngestionRowError(
                row=row_number,
                field="amount",
                message=f"'{amount_raw}' is not a valid decimal number.",
            )
        )

    # --- occurred_at ---
    occurred_raw = row["occurred_at"].strip()
    occurred_at = None
    for fmt in (
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%m/%d/%Y %H:%M:%S",
        "%m/%d/%Y",
    ):
        try:
            occurred_at = datetime.strptime(occurred_raw, fmt)
            break
        except ValueError:
            continue
    if occurred_at is None:
        errors.append(
            IngestionRowError(
                row=row_number,
                field="occurred_at",
                message=f"'{occurred_raw}' is not a recognized timestamp format.",
            )
        )

    # --- origin ≠ destination ---
    origin = row["origin_account"].strip()
    destination = row["destination_account"].strip()
    if origin == destination:
        errors.append(
            IngestionRowError(
                row=row_number,
                field="destination_account",
                message="Origin and destination accounts must differ.",
            )
        )

    if errors:
        return None, errors

    return {
        "external_ref": row.get("external_ref", "").strip() or None,
        "origin_account": origin,
        "destination_account": destination,
        "amount": amount,
        "currency": row.get("currency", "").strip() or "USD",
        "transaction_type": row.get("transaction_type", "").strip() or None,
        "channel": row.get("channel", "").strip() or None,
        "occurred_at": occurred_at,
        "origin_customer_name": row.get("origin_customer_name", "").strip() or None,
        "destination_customer_name": row.get("destination_customer_name", "").strip() or None,
        "origin_customer_country": row.get("origin_customer_country", "").strip() or None,
        "destination_customer_country": row.get("destination_customer_country", "").strip() or None,
    }, []


async def ingest_csv(
    db: AsyncSession,
    *,
    csv_bytes: bytes,
    filename: str | None,
    uploaded_by: uuid.UUID,
) -> tuple[IngestionBatch, list[IngestionRowError]]:
    """Parses and validates a CSV file, inserting valid rows as transactions.

    Returns the IngestionBatch record and a flat list of per-row errors.
    """
    batch = IngestionBatch(
        uploaded_by=uploaded_by,
        source_type="csv",
        filename=filename,
    )
    db.add(batch)
    await db.flush()

    text = csv_bytes.decode("utf-8-sig")  # handles BOM if present
    reader = csv.DictReader(io.StringIO(text))
    if reader.fieldnames is None:
        batch.status = "failed"
        batch.total_rows = 0
        return batch, [
            IngestionRowError(row=0, field="header", message="CSV file has no header row.")
        ]

    # Normalise column names
    reader.fieldnames = [_normalise_header(h) for h in reader.fieldnames]

    # Check required columns exist in header
    missing_cols = REQUIRED_COLUMNS - set(reader.fieldnames)
    if missing_cols:
        batch.status = "failed"
        batch.total_rows = 0
        return batch, [
            IngestionRowError(
                row=0,
                field=col,
                message=f"Required column '{col}' is missing from the CSV header.",
            )
            for col in sorted(missing_cols)
        ]

    all_errors: list[IngestionRowError] = []
    accepted = 0
    total = 0
    account_cache: dict[str, uuid.UUID] = {}

    for row_number, raw_row in enumerate(reader, start=2):  # row 1 = header
        total += 1
        normalised_row = {_normalise_header(k): v for k, v in raw_row.items()}
        parsed, row_errors = _validate_row(normalised_row, row_number)

        if row_errors:
            all_errors.extend(row_errors)
            continue

        assert parsed is not None  # guaranteed by _validate_row

        try:
            origin_id = await _resolve_or_create_account(
                db,
                parsed["origin_account"],
                parsed.get("origin_customer_name"),
                parsed.get("origin_customer_country"),
                account_cache,
            )
            dest_id = await _resolve_or_create_account(
                db,
                parsed["destination_account"],
                parsed.get("destination_customer_name"),
                parsed.get("destination_customer_country"),
                account_cache,
            )

            txn = Transaction(
                external_ref=parsed["external_ref"],
                origin_account_id=origin_id,
                destination_account_id=dest_id,
                amount=parsed["amount"],
                currency=parsed["currency"],
                transaction_type=parsed["transaction_type"],
                channel=parsed["channel"],
                occurred_at=parsed["occurred_at"],
                ingestion_batch_id=batch.batch_id,
                ingestion_status="accepted",
            )
            db.add(txn)
            await db.flush()

            try:
                from app.models.prediction import Prediction
                from app.services.inference import score_transaction

                prob, cat, version = score_transaction(
                    amount=float(txn.amount),
                    occurred_at=txn.occurred_at,
                    channel=txn.channel,
                )
                pred = Prediction(
                    transaction_id=txn.transaction_id,
                    model_version=version,
                    risk_probability=Decimal(f"{prob:.5f}"),
                    risk_category=cat,
                    combined_risk_score=Decimal(f"{prob:.5f}"),
                )
                db.add(pred)
            except Exception:
                # If model scoring fails, transaction is still safely accepted
                pass

            accepted += 1
        except Exception as exc:
            all_errors.append(
                IngestionRowError(
                    row=row_number,
                    field="__row__",
                    message=f"Unexpected error: {exc}",
                )
            )

    batch.total_rows = total
    batch.accepted_rows = accepted
    batch.rejected_rows = total - accepted
    batch.status = "completed"
    batch.completed_at = datetime.utcnow()

    return batch, all_errors

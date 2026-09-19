import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


# ── Customer Schemas ───────────────────────────────────────────────────────────


class CustomerOut(BaseModel):
    customer_id: uuid.UUID
    external_ref: str | None = None
    full_name: str
    date_of_birth: datetime | None = None
    country: str | None = None
    occupation: str | None = None
    kyc_level: str | None = None
    onboarded_at: datetime | None = None
    current_risk_score: float | None = None
    current_risk_category: str | None = None
    risk_updated_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CustomerListOut(BaseModel):
    items: list[CustomerOut]
    total: int
    page: int
    page_size: int


# ── Account Schemas ────────────────────────────────────────────────────────────


class AccountOut(BaseModel):
    account_id: uuid.UUID
    customer_id: uuid.UUID
    account_number: str
    account_type: str | None = None
    currency: str = "USD"
    opened_at: datetime | None = None
    status: str = "active"
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Transaction Schemas ────────────────────────────────────────────────────────


class TransactionOut(BaseModel):
    transaction_id: uuid.UUID
    external_ref: str | None = None
    origin_account_id: uuid.UUID
    destination_account_id: uuid.UUID
    amount: Decimal
    currency: str = "USD"
    transaction_type: str | None = None
    channel: str | None = None
    occurred_at: datetime
    ingested_at: datetime
    ingestion_status: str = "accepted"
    ingestion_error: str | None = None
    created_at: datetime

    # These are populated in Sprint 3 when predictions are wired in
    risk_category: str | None = None
    risk_probability: float | None = None
    model_version: str | None = None

    model_config = {"from_attributes": True, "protected_namespaces": ()}


class TransactionListOut(BaseModel):
    items: list[TransactionOut]
    total: int
    page: int
    page_size: int


class TransactionDetailOut(TransactionOut):
    """Extended transaction detail including linked account info."""

    origin_account_number: str | None = None
    destination_account_number: str | None = None


# ── Ingestion Schemas ──────────────────────────────────────────────────────────


class IngestionRowError(BaseModel):
    """A single per-row validation failure from CSV import."""

    row: int = Field(description="1-indexed row number in the CSV file")
    field: str = Field(description="Column name that failed validation")
    message: str


class IngestionReportOut(BaseModel):
    """Response shape for POST /api/v1/transactions/import (AML-FR-05/06)."""

    batch_id: uuid.UUID
    filename: str | None = None
    total_rows: int
    accepted_rows: int
    rejected_rows: int
    status: str
    errors: list[IngestionRowError] = []

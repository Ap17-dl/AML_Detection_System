import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class AlertOut(BaseModel):
    alert_id: uuid.UUID
    customer_id: uuid.UUID | None = None
    customer_name: str | None = None
    triggering_transaction_id: uuid.UUID | None = None
    transaction_amount: Decimal | None = None
    prediction_id: uuid.UUID | None = None
    risk_category: str
    status: str
    assigned_to: uuid.UUID | None = None
    assigned_to_email: str | None = None
    outcome: str | None = None
    threshold_config_used: dict[str, Any] | None = None
    created_at: datetime
    closed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


class AlertListOut(BaseModel):
    items: list[AlertOut]
    total: int
    page: int
    page_size: int


class AlertUpdate(BaseModel):
    status: str | None = Field(None, pattern="^(open|in_progress|closed)$")
    outcome: str | None = Field(
        None, pattern="^(confirmed_suspicious|false_positive|further_investigation)$"
    )
    assigned_to: uuid.UUID | None = None


class CaseNoteCreate(BaseModel):
    note_text: str = Field(min_length=1, max_length=5000)


class CaseNoteOut(BaseModel):
    note_id: uuid.UUID
    alert_id: uuid.UUID
    author_id: uuid.UUID
    author_name: str | None = None
    note_text: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


class AnalystFeedbackCreate(BaseModel):
    outcome_label: str = Field(
        pattern="^(confirmed_suspicious|false_positive|further_investigation)$"
    )
    feedback_notes: str | None = None
    explanation_quality_rating: int | None = Field(None, ge=1, le=5)


class AnalystFeedbackOut(BaseModel):
    feedback_id: uuid.UUID
    alert_id: uuid.UUID
    analyst_id: uuid.UUID
    outcome_label: str
    feedback_notes: str | None = None
    explanation_quality_rating: int | None = None
    submitted_at: datetime
    reviewed_for_retraining: bool = False

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


class DashboardSummaryOut(BaseModel):
    open_alerts_count: int
    high_risk_txns_count: int
    total_transactions_count: int
    customers_monitored_count: int
    false_positive_rate: float
    alerts_by_risk: dict[str, int]
    alerts_by_status: dict[str, int]
    recent_alerts: list[AlertOut] = []

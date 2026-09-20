import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    SmallInteger,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Alert(Base):
    """Mirrors public.alerts — see 03_Backend_Schema.md §8.1."""

    __tablename__ = "alerts"
    __table_args__ = (
        CheckConstraint("status IN ('open', 'in_progress', 'closed')", name="ck_alerts_status"),
        CheckConstraint(
            "outcome IS NULL OR outcome IN ('confirmed_suspicious', 'false_positive', 'further_investigation')",
            name="ck_alerts_outcome",
        ),
    )

    alert_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    customer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customers.customer_id", ondelete="SET NULL")
    )
    triggering_transaction_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("transactions.transaction_id", ondelete="SET NULL")
    )
    prediction_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("predictions.prediction_id", ondelete="SET NULL")
    )
    risk_category: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="open")
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="SET NULL")
    )
    outcome: Mapped[str | None] = mapped_column(String(30))
    threshold_config_used: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class CaseNote(Base):
    """Mirrors public.case_notes — see 03_Backend_Schema.md §8.2."""

    __tablename__ = "case_notes"

    note_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    alert_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("alerts.alert_id", ondelete="CASCADE"), nullable=False
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False
    )
    note_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class AnalystFeedback(Base):
    """Mirrors public.analyst_feedback — see 03_Backend_Schema.md §8.3."""

    __tablename__ = "analyst_feedback"
    __table_args__ = (
        CheckConstraint(
            "explanation_quality_rating IS NULL OR (explanation_quality_rating >= 1 AND explanation_quality_rating <= 5)",
            name="ck_feedback_quality_rating",
        ),
    )

    feedback_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    alert_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("alerts.alert_id", ondelete="CASCADE"), nullable=False
    )
    analyst_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False
    )
    outcome_label: Mapped[str] = mapped_column(String(30), nullable=False)
    feedback_notes: Mapped[str | None] = mapped_column(Text)
    explanation_quality_rating: Mapped[int | None] = mapped_column(SmallInteger)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    reviewed_for_retraining: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

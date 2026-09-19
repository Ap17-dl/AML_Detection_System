import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Numeric, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Prediction(Base):
    """Mirrors public.predictions — see 03_Backend_Schema.md §4.2."""

    __tablename__ = "predictions"
    __table_args__ = (
        CheckConstraint(
            "risk_probability >= 0 AND risk_probability <= 1",
            name="ck_predictions_probability_range",
        ),
        CheckConstraint(
            "risk_category IN ('low', 'medium', 'high')",
            name="ck_predictions_risk_category",
        ),
        UniqueConstraint("transaction_id", "model_version", name="uq_prediction_per_txn_model"),
    )

    prediction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    transaction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("transactions.transaction_id", ondelete="CASCADE"),
        nullable=False,
    )
    model_version: Mapped[str] = mapped_column(
        String(40), ForeignKey("model_metadata.model_version"), nullable=False
    )
    risk_probability: Mapped[Decimal] = mapped_column(Numeric(6, 5), nullable=False)
    risk_category: Mapped[str] = mapped_column(String(20), nullable=False)
    graph_risk_component: Mapped[Decimal | None] = mapped_column(Numeric(6, 5))
    combined_risk_score: Mapped[Decimal | None] = mapped_column(Numeric(6, 5))
    predicted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

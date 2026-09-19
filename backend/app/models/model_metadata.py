import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ModelMetadata(Base):
    """Mirrors public.model_metadata — see 03_Backend_Schema.md §4.1."""

    __tablename__ = "model_metadata"

    model_version: Mapped[str] = mapped_column(String(40), primary_key=True)
    algorithm: Mapped[str] = mapped_column(String(60), nullable=False)
    trained_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    training_dataset: Mapped[str | None] = mapped_column(String(160))
    precision_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 4))
    recall_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 4))
    f1_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 4))
    pr_auc: Mapped[Decimal | None] = mapped_column(Numeric(5, 4))
    roc_auc: Mapped[Decimal | None] = mapped_column(Numeric(5, 4))
    false_positive_rate: Mapped[Decimal | None] = mapped_column(Numeric(5, 4))
    false_negative_rate: Mapped[Decimal | None] = mapped_column(Numeric(5, 4))
    threshold_low_max: Mapped[Decimal] = mapped_column(
        Numeric(5, 4), nullable=False, default=Decimal("0.30")
    )
    threshold_medium_max: Mapped[Decimal] = mapped_column(
        Numeric(5, 4), nullable=False, default=Decimal("0.70")
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    artifact_path: Mapped[str] = mapped_column(Text, nullable=False)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="SET NULL")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Explanation(Base):
    """Mirrors public.explanations — see 03_Backend_Schema.md §6."""

    __tablename__ = "explanations"
    __table_args__ = (UniqueConstraint("prediction_id", name="uq_explanation_per_prediction"),)

    explanation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    prediction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("predictions.prediction_id", ondelete="CASCADE"),
        nullable=False,
    )
    top_features: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, nullable=False)
    narrative_text: Mapped[str] = mapped_column(Text, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class GraphIndicator(Base):
    """Mirrors public.graph_indicators — see 03_Backend_Schema.md §5."""

    __tablename__ = "graph_indicators"

    indicator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("accounts.account_id", ondelete="CASCADE"),
        nullable=False,
    )
    computed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    window_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    window_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    in_degree: Mapped[int] = mapped_column(Integer, default=0)
    out_degree: Mapped[int] = mapped_column(Integer, default=0)
    txn_velocity: Mapped[Decimal | None] = mapped_column(Numeric(10, 4))
    fan_in_ratio: Mapped[Decimal | None] = mapped_column(Numeric(6, 4))
    fan_out_ratio: Mapped[Decimal | None] = mapped_column(Numeric(6, 4))
    is_in_cycle: Mapped[bool] = mapped_column(Boolean, default=False)
    cycle_length: Mapped[int | None] = mapped_column(Integer)
    neighborhood_risk_score: Mapped[Decimal | None] = mapped_column(Numeric(6, 5))
    graph_snapshot_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))

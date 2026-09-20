import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Transaction(Base):
    """Mirrors public.transactions — see 03_Backend_Schema.md §3.3."""

    __tablename__ = "transactions"
    __table_args__ = (
        UniqueConstraint("external_ref", name="uq_transactions_external_ref"),
        CheckConstraint("amount > 0", name="ck_transactions_amount_positive"),
    )

    transaction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    external_ref: Mapped[str | None] = mapped_column(String(80))
    origin_account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("accounts.account_id"),
        nullable=False,
    )
    destination_account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("accounts.account_id"),
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, server_default="USD")
    transaction_type: Mapped[str | None] = mapped_column(String(40))
    channel: Mapped[str | None] = mapped_column(String(40))
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ingested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    ingestion_batch_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ingestion_batches.batch_id", ondelete="SET NULL"),
    )
    ingestion_status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="accepted"
    )
    ingestion_error: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

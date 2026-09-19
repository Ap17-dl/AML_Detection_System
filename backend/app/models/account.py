import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Account(Base):
    """Mirrors public.accounts — see 03_Backend_Schema.md §3.2."""

    __tablename__ = "accounts"

    account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.customer_id", ondelete="CASCADE"),
        nullable=False,
    )
    account_number: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    account_type: Mapped[str | None] = mapped_column(String(40))
    currency: Mapped[str] = mapped_column(String(10), nullable=False, server_default="USD")
    opened_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

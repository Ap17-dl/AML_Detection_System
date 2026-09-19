import uuid
from datetime import datetime

from sqlalchemy import Date, DateTime, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Customer(Base):
    """Mirrors public.customers — see 03_Backend_Schema.md §3.2."""

    __tablename__ = "customers"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    external_ref: Mapped[str | None] = mapped_column(String(80), unique=True)
    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    date_of_birth: Mapped[datetime | None] = mapped_column(Date)
    country: Mapped[str | None] = mapped_column(String(80))
    occupation: Mapped[str | None] = mapped_column(String(120))
    kyc_level: Mapped[str | None] = mapped_column(String(20))
    onboarded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    current_risk_score: Mapped[float | None] = mapped_column(Numeric(5, 4))
    current_risk_category: Mapped[str | None] = mapped_column(String(20))
    risk_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

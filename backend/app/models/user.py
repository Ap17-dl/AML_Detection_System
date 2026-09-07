import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, SmallInteger, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class User(Base):
    """Mirrors public.users — 1:1 with Supabase auth.users, see 03_Backend_Schema.md §3.1.

    Row lifecycle (insert on signup, email/name sync) is owned by the `handle_new_user()` trigger
    on `auth.users`, not by this application — the backend only ever reads and updates `role_id` /
    `is_active` here.
    """

    __tablename__ = "users"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    email: Mapped[str] = mapped_column(String(160), unique=True, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(120))
    role_id: Mapped[int] = mapped_column(
        SmallInteger, ForeignKey("roles.role_id"), nullable=False, default=2
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

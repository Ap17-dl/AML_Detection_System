from sqlalchemy import SmallInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Role(Base):
    """Mirrors public.roles — see 03_Backend_Schema.md §3.1."""

    __tablename__ = "roles"

    role_id: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    role_name: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)


class RoleName:
    """Role name constants matching the seeded rows in public.roles."""

    ADMINISTRATOR = "administrator"
    AML_ANALYST = "aml_analyst"
    DATA_OPERATOR = "data_operator"

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class OrganizationOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    status: str
    created_at: datetime
    updated_at: datetime
    total_users: int = 0
    admin_count: int = 0
    analyst_count: int = 0
    operator_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class OrganizationRegisterIn(BaseModel):
    name: str = Field(..., min_length=2, max_length=120, description="Organization name")
    slug: str | None = Field(
        None, min_length=2, max_length=120, description="Custom slug or auto-generated"
    )
    admin_email: EmailStr = Field(..., description="Email for the primary administrator")
    admin_name: str = Field(
        ..., min_length=2, max_length=120, description="Full name of primary administrator"
    )
    admin_password: str = Field(..., min_length=6, description="Initial administrator password")


class OrganizationUpdateIn(BaseModel):
    name: str = Field(..., min_length=2, max_length=120, description="Updated organization name")


class OrganizationStatsOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    status: str
    total_users: int
    admin_count: int
    analyst_count: int
    operator_count: int
    recent_activity: list[dict[str, Any]] = []

    model_config = ConfigDict(from_attributes=True)

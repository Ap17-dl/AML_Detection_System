import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CurrentUserOut(BaseModel):
    """Response shape for GET /api/v1/auth/me."""

    user_id: uuid.UUID
    email: str
    full_name: str | None
    role: str
    organization_id: uuid.UUID | None = None
    organization_name: str | None = None
    organization_status: str | None = None

    model_config = ConfigDict(from_attributes=True)


class UserOut(BaseModel):
    user_id: uuid.UUID
    organization_id: uuid.UUID | None = None
    organization_name: str | None = None
    email: str
    full_name: str | None
    role: str
    is_active: bool
    created_at: datetime
    last_login_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class UserListResponse(BaseModel):
    items: list[UserOut]
    total: int
    page: int
    page_size: int


class UserInviteRequest(BaseModel):
    email: EmailStr
    full_name: str | None = None
    role: str = Field(description="One of: administrator, aml_analyst, data_operator")
    password: str | None = Field(
        default=None, min_length=6, description="Optional direct password provision"
    )


class UserRoleUpdateRequest(BaseModel):
    role: str = Field(description="One of: administrator, aml_analyst, data_operator")


class UserStatusUpdateRequest(BaseModel):
    is_active: bool


class UserDetailUpdateRequest(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=120)


class AdminAccessRequestIn(BaseModel):
    reason: str = Field(
        default="", max_length=1000, description="Justification for requesting admin access"
    )


class AdminAccessRequestOut(BaseModel):
    status: str
    message: str
    host_notified: bool
    email_delivery: dict | None = None

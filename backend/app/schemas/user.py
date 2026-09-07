import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class CurrentUserOut(BaseModel):
    """Response shape for GET /api/v1/auth/me."""

    user_id: uuid.UUID
    email: str
    full_name: str | None
    role: str


class UserOut(BaseModel):
    user_id: uuid.UUID
    email: str
    full_name: str | None
    role: str
    is_active: bool
    created_at: datetime
    last_login_at: datetime | None

    model_config = {"from_attributes": True}


class UserInviteRequest(BaseModel):
    email: EmailStr
    role: str = Field(description="One of: administrator, aml_analyst, data_operator")


class UserRoleUpdateRequest(BaseModel):
    role: str = Field(description="One of: administrator, aml_analyst, data_operator")

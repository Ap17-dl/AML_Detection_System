import time
import jwt
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import ApiError
from app.core.security import CurrentUser, get_current_user
from app.db.session import get_db
from app.models.role import Role
from app.models.user import User
from app.schemas.user import CurrentUserOut

router = APIRouter(prefix="/auth", tags=["auth"])


class DevLoginIn(BaseModel):
    email: str


class DevLoginOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: CurrentUserOut


@router.get("/me", response_model=CurrentUserOut)
async def read_current_user(
    current_user: CurrentUser = Depends(get_current_user),
) -> CurrentUserOut:
    """Returns the authenticated user's profile & role, resolved from the verified Supabase JWT."""
    return CurrentUserOut(
        user_id=current_user.user_id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role_name,
    )


@router.post("/dev-login", response_model=DevLoginOut)
async def dev_login(
    payload: DevLoginIn,
    db: AsyncSession = Depends(get_db),
) -> DevLoginOut:
    """Issues a signed JWT for local development/demo personas (Admin, Analyst, Operator)."""
    settings = get_settings()
    result = await db.execute(
        select(User, Role.role_name)
        .join(Role, User.role_id == Role.role_id)
        .where(User.email == payload.email)
    )
    row = result.first()
    if not row:
        raise ApiError(404, "user_not_found", f"User {payload.email} not found in database.")

    user, role_name = row
    now = int(time.time())
    token_payload = {
        "sub": str(user.user_id),
        "email": user.email,
        "aud": "authenticated",
        "role": "authenticated",
        "iat": now,
        "exp": now + (7 * 86400),
    }
    secret = settings.supabase_jwt_secret or "test-only-secret"
    token = jwt.encode(token_payload, secret, algorithm="HS256")

    return DevLoginOut(
        access_token=token,
        user=CurrentUserOut(
            user_id=user.user_id,
            email=user.email,
            full_name=user.full_name,
            role=role_name,
        ),
    )


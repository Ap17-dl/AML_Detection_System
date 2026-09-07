import uuid
from dataclasses import dataclass

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import ApiError
from app.db.session import get_db
from app.models.role import Role
from app.models.user import User

_bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    """The authenticated caller, resolved from a verified Supabase JWT + the local user profile."""

    user_id: uuid.UUID
    email: str
    role_name: str
    full_name: str | None
    is_active: bool


def decode_supabase_jwt(token: str) -> dict:
    """Verifies a Supabase-issued access token's signature, audience, and expiry.

    Per TRD §4.1/§6.3: FastAPI never issues tokens, it only verifies the ones Supabase Auth
    issued to the client. Signature is checked against SUPABASE_JWT_SECRET (HS256), matching the
    secret configured in the Supabase project's API settings.
    """
    settings = get_settings()
    try:
        return jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.PyJWTError as exc:
        raise ApiError(401, "invalid_token", f"Could not validate credentials: {exc}") from None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> CurrentUser:
    if credentials is None:
        raise ApiError(401, "missing_token", "Authorization bearer token is required.")

    claims = decode_supabase_jwt(credentials.credentials)
    user_id = uuid.UUID(claims["sub"])

    result = await db.execute(
        select(User, Role.role_name)
        .join(Role, User.role_id == Role.role_id)
        .where(User.user_id == user_id)
    )
    row = result.first()
    if row is None:
        raise ApiError(
            401, "unknown_user", "Token is valid but no matching user profile was found."
        )

    user, role_name = row
    if not user.is_active:
        raise ApiError(403, "inactive_user", "This account has been deactivated.")

    return CurrentUser(
        user_id=user.user_id,
        email=user.email,
        role_name=role_name,
        full_name=user.full_name,
        is_active=user.is_active,
    )


def require_role(*allowed_roles: str):
    """FastAPI dependency factory enforcing least-privilege RBAC (TRD §4.1, §6.3).

    Usage: `Depends(require_role(RoleName.ADMINISTRATOR))`.
    """

    async def _dependency(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.role_name not in allowed_roles:
            raise ApiError(
                403,
                "forbidden",
                f"Role '{current_user.role_name}' is not permitted to perform this action.",
            )
        return current_user

    return _dependency

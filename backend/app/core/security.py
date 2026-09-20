import ssl
import uuid
from dataclasses import dataclass
from functools import lru_cache

import certifi
import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
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


@lru_cache(maxsize=1)
def _get_jwks_client(supabase_url: str) -> PyJWKClient:
    ctx = ssl.create_default_context(cafile=certifi.where())
    return PyJWKClient(f"{supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json", ssl_context=ctx)


def decode_supabase_jwt(token: str) -> dict:
    """Verifies a Supabase-issued access token's signature, audience, and expiry.

    Per TRD §4.1/§6.3: FastAPI never issues tokens, it only verifies the ones Supabase Auth
    issued to the client. Supports modern Supabase ES256 tokens via JWKS as well as legacy/test
    HS256 tokens via SUPABASE_JWT_SECRET.
    """
    settings = get_settings()
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")
        if alg == "ES256":
            jwks_client = _get_jwks_client(settings.supabase_url)
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            return jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256"],
                audience="authenticated",
            )
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
        # User authenticated via Supabase Auth but profile not yet synced to local database.
        # Auto-provision user in auth.users and public.users.
        email = claims.get("email") or ""
        metadata = claims.get("user_metadata") or {}
        full_name = metadata.get("full_name") or (email.split("@")[0] if email else "User")
        try:
            role_id = int(metadata.get("role_id") or 2)
        except (ValueError, TypeError):
            role_id = 2
        # Disallow role 1 (administrator) via signup; only analyst (2) or operator (3) allowed.
        if role_id not in (2, 3):
            role_id = 2

        try:
            from sqlalchemy import text

            await db.execute(
                text(
                    """
                    INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
                    VALUES (:uid, :email, json_build_object('full_name', cast(:full_name as text))::jsonb, json_build_object('role_id', cast(:role_id as int))::jsonb)
                    ON CONFLICT (id) DO NOTHING
                """
                ),
                {"uid": user_id, "email": email, "full_name": full_name, "role_id": role_id},
            )
            await db.execute(
                text(
                    """
                    INSERT INTO public.users (user_id, email, full_name, role_id)
                    VALUES (:uid, :email, :full_name, :role_id)
                    ON CONFLICT (user_id) DO UPDATE SET
                        email = EXCLUDED.email,
                        full_name = COALESCE(EXCLUDED.full_name, public.users.full_name)
                """
                ),
                {"uid": user_id, "email": email, "full_name": full_name, "role_id": role_id},
            )
            await db.commit()

            result = await db.execute(
                select(User, Role.role_name)
                .join(Role, User.role_id == Role.role_id)
                .where(User.user_id == user_id)
            )
            row = result.first()
        except Exception:
            await db.rollback()
            row = None

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

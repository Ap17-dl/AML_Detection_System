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
from app.models.organization import Organization
from app.models.role import Role
from app.models.user import User

_bearer_scheme = HTTPBearer(auto_error=False)

DEFAULT_ORG_ID = uuid.UUID("a0000000-0000-0000-0000-000000000001")


def is_demo_user(email: str | None) -> bool:
    """Returns True if the email belongs to a seeded demo persona or test runner."""
    if not email:
        return False
    lower = email.lower()
    return lower.endswith("@aml.local") or lower.endswith("@example.com")


@dataclass(frozen=True)
class CurrentUser:
    """The authenticated caller, resolved from a verified Supabase JWT + the local user profile."""

    user_id: uuid.UUID
    email: str
    role_name: str
    full_name: str | None
    is_active: bool
    organization_id: uuid.UUID = DEFAULT_ORG_ID
    organization_name: str = "Apex Global Bank"
    organization_status: str = "active"

    @property
    def is_demo(self) -> bool:
        return is_demo_user(self.email)


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
    email = claims.get("email") or ""

    result = await db.execute(
        select(User, Role.role_name, Organization.name, Organization.status)
        .join(Role, User.role_id == Role.role_id)
        .outerjoin(Organization, User.organization_id == Organization.id)
        .where(User.user_id == user_id)
    )
    row = result.first()
    if row is None and email:
        result = await db.execute(
            select(User, Role.role_name, Organization.name, Organization.status)
            .join(Role, User.role_id == Role.role_id)
            .outerjoin(Organization, User.organization_id == Organization.id)
            .where(User.email == email)
        )
        row = result.first()

    if row is None:
        # User authenticated via Supabase Auth but profile not yet synced to local database.
        # Auto-provision user in auth.users and public.users.
        metadata = claims.get("user_metadata") or {}
        full_name = metadata.get("full_name") or (email.split("@")[0] if email else "User")
        try:
            role_id = int(metadata.get("role_id") or 2)
        except (ValueError, TypeError):
            role_id = 2
        # Disallow role 1 (administrator) via signup; only analyst (2) or operator (3) allowed.
        if role_id not in (2, 3):
            role_id = 2

        # Organization scoping on auto-provision
        org_id_str = metadata.get("organization_id")
        target_org_id = DEFAULT_ORG_ID
        if org_id_str:
            try:
                candidate_org_id = uuid.UUID(org_id_str)
                org_check = await db.get(Organization, candidate_org_id)
                if org_check and org_check.status == "active":
                    target_org_id = candidate_org_id
            except (ValueError, TypeError):
                pass

        try:
            from sqlalchemy import text

            # Check if user already exists in auth.users by email
            existing_auth = (
                await db.execute(
                    text("SELECT id FROM auth.users WHERE email = :email"),
                    {"email": email},
                )
            ).first()

            actual_uid = existing_auth[0] if existing_auth else user_id

            if not existing_auth:
                await db.execute(
                    text(
                        """
                        INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
                        VALUES (:uid, :email, json_build_object('full_name', cast(:full_name as text))::jsonb, json_build_object('role_id', cast(:role_id as int))::jsonb)
                        ON CONFLICT (id) DO NOTHING
                    """
                    ),
                    {"uid": actual_uid, "email": email, "full_name": full_name, "role_id": role_id},
                )

            await db.execute(
                text(
                    """
                    INSERT INTO public.users (user_id, email, full_name, role_id, organization_id)
                    VALUES (:uid, :email, :full_name, :role_id, :org_id)
                    ON CONFLICT (user_id) DO UPDATE SET
                        email = EXCLUDED.email,
                        full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
                        organization_id = COALESCE(public.users.organization_id, EXCLUDED.organization_id)
                """
                ),
                {
                    "uid": actual_uid,
                    "email": email,
                    "full_name": full_name,
                    "role_id": role_id,
                    "org_id": target_org_id,
                },
            )
            await db.commit()

            result = await db.execute(
                select(User, Role.role_name, Organization.name, Organization.status)
                .join(Role, User.role_id == Role.role_id)
                .outerjoin(Organization, User.organization_id == Organization.id)
                .where((User.user_id == actual_uid) | (User.email == email))
            )
            row = result.first()
        except Exception:
            await db.rollback()
            row = None

        if row is None:
            raise ApiError(
                401, "unknown_user", "Token is valid but no matching user profile was found."
            )

    user, role_name, org_name, org_status = row
    if not user.is_active:
        raise ApiError(403, "inactive_user", "This account has been deactivated.")

    org_status = org_status or "active"
    if org_status != "active":
        raise ApiError(
            403,
            "suspended_organization",
            f"Organization '{org_name or 'Current'}' is suspended or inactive.",
        )

    return CurrentUser(
        user_id=user.user_id,
        email=user.email,
        role_name=role_name,
        full_name=user.full_name,
        is_active=user.is_active,
        organization_id=user.organization_id,
        organization_name=org_name or "Apex Global Bank",
        organization_status=org_status,
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

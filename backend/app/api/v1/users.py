import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import resolve_role_id
from app.core.audit import record_audit_log
from app.core.errors import ApiError
from app.core.security import CurrentUser, require_role
from app.core.supabase_admin import SupabaseAdminClient, get_supabase_admin_client
from app.db.session import get_db
from app.models.role import Role, RoleName
from app.models.user import User
from app.schemas.user import UserInviteRequest, UserOut, UserRoleUpdateRequest

router = APIRouter(prefix="/users", tags=["users"])

_ADMIN_ONLY = require_role(RoleName.ADMINISTRATOR)


@router.get("", response_model=list[UserOut])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: CurrentUser = Depends(_ADMIN_ONLY),
) -> list[UserOut]:
    """Lists all application users with their roles. Administrator only (AML-FR-03)."""
    result = await db.execute(
        select(User, Role.role_name)
        .join(Role, User.role_id == Role.role_id)
        .order_by(User.created_at)
    )
    return [
        UserOut(
            user_id=user.user_id,
            email=user.email,
            full_name=user.full_name,
            role=role_name,
            is_active=user.is_active,
            created_at=user.created_at,
            last_login_at=user.last_login_at,
        )
        for user, role_name in result.all()
    ]


@router.post("/invite", status_code=201)
async def invite_user(
    payload: UserInviteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(_ADMIN_ONLY),
    admin_client: SupabaseAdminClient = Depends(get_supabase_admin_client),
) -> dict:
    """Invites a new user via the Supabase Auth Admin API with an initial role (AML-FR-03).

    The `public.users` row is created by the database trigger once the invite is accepted and
    `auth.users` receives the new row — this endpoint does not write to `public.users` directly.
    """
    role_id = await resolve_role_id(db, payload.role)
    result = await admin_client.invite_user_by_email(payload.email, role_id)

    await record_audit_log(
        db,
        actor_user_id=current_user.user_id,
        action="user_invite",
        entity_type="user",
        entity_id=uuid.UUID(result["id"]) if result.get("id") else current_user.user_id,
        details={"invited_email": payload.email, "role": payload.role},
    )
    await db.commit()
    return {"invited_email": payload.email, "role": payload.role}


@router.patch("/{user_id}/role", response_model=UserOut)
async def update_user_role(
    user_id: uuid.UUID,
    payload: UserRoleUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(_ADMIN_ONLY),
) -> UserOut:
    """Changes a user's role. Administrator only — role changes are always audit-logged (AML-FR-03)."""
    target = await db.get(User, user_id)
    if target is None:
        raise ApiError(404, "user_not_found", f"No user with id {user_id}.")

    new_role_id = await resolve_role_id(db, payload.role)
    previous_role_id = target.role_id
    target.role_id = new_role_id

    await record_audit_log(
        db,
        actor_user_id=current_user.user_id,
        action="role_change",
        entity_type="user",
        entity_id=target.user_id,
        details={"previous_role_id": previous_role_id, "new_role_id": new_role_id},
    )
    await db.commit()
    await db.refresh(target)

    return UserOut(
        user_id=target.user_id,
        email=target.email,
        full_name=target.full_name,
        role=payload.role,
        is_active=target.is_active,
        created_at=target.created_at,
        last_login_at=target.last_login_at,
    )

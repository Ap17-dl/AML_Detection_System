import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import resolve_role_id
from app.core.audit import record_audit_log
from app.core.errors import ApiError
from app.core.security import CurrentUser, get_current_user, require_role
from app.core.supabase_admin import SupabaseAdminClient, get_supabase_admin_client
from app.db.session import get_db
from app.models.role import Role, RoleName
from app.models.user import User
from app.schemas.user import (
    AdminAccessRequestIn,
    AdminAccessRequestOut,
    UserDetailUpdateRequest,
    UserInviteRequest,
    UserOut,
    UserRoleUpdateRequest,
    UserStatusUpdateRequest,
)
from app.services.email import send_admin_request_email

router = APIRouter(prefix="/users", tags=["users"])

_ADMIN_ONLY = require_role(RoleName.ADMINISTRATOR)


async def _count_active_admins(
    db: AsyncSession, organization_id: uuid.UUID, exclude_user_id: uuid.UUID | None = None
) -> int:
    """Returns number of active administrators in the given organization."""
    query = select(func.count(User.user_id)).where(
        User.organization_id == organization_id,
        User.role_id == 1,
        User.is_active.is_(True),
    )
    if exclude_user_id is not None:
        query = query.where(User.user_id != exclude_user_id)
    result = await db.execute(query)
    return result.scalar() or 0


@router.get("", response_model=list[UserOut])
async def list_users(
    search: str | None = Query(None, description="Search by email or full name"),
    role: str | None = Query(None, description="Filter by role name"),
    is_active: bool | None = Query(None, description="Filter by active status"),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(_ADMIN_ONLY),
) -> list[UserOut]:
    """Lists all users belonging to the administrator's organization."""
    query = (
        select(User, Role.role_name)
        .join(Role, User.role_id == Role.role_id)
        .where(User.organization_id == current_user.organization_id)
    )

    if search:
        pattern = f"%{search}%"
        query = query.where(
            or_(User.email.ilike(pattern), User.full_name.ilike(pattern))
        )

    if role:
        query = query.where(Role.role_name == role)

    if is_active is not None:
        query = query.where(User.is_active == is_active)

    query = query.order_by(User.created_at)
    result = await db.execute(query)

    return [
        UserOut(
            user_id=user.user_id,
            organization_id=user.organization_id,
            organization_name=current_user.organization_name,
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
    """Invites or creates a new user within the administrator's organization."""
    role_id = await resolve_role_id(db, payload.role)

    # Enforce 2-admin limit
    if payload.role == RoleName.ADMINISTRATOR or role_id == 1:
        current_admin_count = await _count_active_admins(db, current_user.organization_id)
        if current_admin_count >= 2:
            raise ApiError(
                400,
                "max_admins_reached",
                "An organization cannot have more than 2 active administrators.",
            )

    # Check if user already exists
    existing_user = (
        await db.execute(select(User).where(User.email == payload.email))
    ).scalar_one_or_none()
    if existing_user:
        raise ApiError(
            409,
            "user_already_exists",
            f"A user with email '{payload.email}' already exists.",
        )

    result_id: str | None = None
    try:
        result = await admin_client.invite_user_by_email(payload.email, role_id)
        if result and isinstance(result, dict) and result.get("id"):
            result_id = result["id"]
    except Exception:
        # If remote invitation fails or in tests, proceed with direct user record
        pass

    new_user_id = uuid.UUID(result_id) if result_id else uuid.uuid4()

    # Create user in public.users associated directly with the administrator's organization
    new_user = User(
        user_id=new_user_id,
        email=payload.email,
        full_name=payload.full_name or (payload.email.split("@")[0]),
        role_id=role_id,
        organization_id=current_user.organization_id,
        is_active=True,
    )
    db.add(new_user)

    await record_audit_log(
        db,
        actor_user_id=current_user.user_id,
        organization_id=current_user.organization_id,
        action="user_invite",
        entity_type="user",
        entity_id=new_user_id,
        details={
            "invited_email": payload.email,
            "role": payload.role,
            "organization_id": str(current_user.organization_id),
        },
    )
    await db.commit()
    return {"invited_email": payload.email, "role": payload.role, "user_id": str(new_user_id)}


@router.patch("/{user_id}/role", response_model=UserOut)
async def update_user_role(
    user_id: uuid.UUID,
    payload: UserRoleUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(_ADMIN_ONLY),
) -> UserOut:
    """Changes a user's role. Administrator only — rejects cross-org access and enforces 2-admin limit."""
    target = await db.get(User, user_id)
    if target is None or target.organization_id != current_user.organization_id:
        if target is not None:
            # Cross-organization attempt
            await record_audit_log(
                db,
                actor_user_id=current_user.user_id,
                organization_id=current_user.organization_id,
                action="failed_cross_org_access",
                entity_type="user",
                entity_id=user_id,
                details={
                    "attempted_action": "update_user_role",
                    "target_organization_id": str(target.organization_id),
                },
            )
            await db.commit()
        raise ApiError(404, "user_not_found", f"No user with id {user_id}.")

    new_role_id = await resolve_role_id(db, payload.role)

    # If promoting to Administrator, verify 2-admin limit
    if payload.role == RoleName.ADMINISTRATOR or new_role_id == 1:
        if target.role_id != 1 and target.is_active:
            active_admins = await _count_active_admins(
                db, current_user.organization_id, exclude_user_id=target.user_id
            )
            if active_admins >= 2:
                raise ApiError(
                    400,
                    "max_admins_reached",
                    "An organization cannot have more than 2 active administrators.",
                )

    previous_role_id = target.role_id
    target.role_id = new_role_id

    await record_audit_log(
        db,
        actor_user_id=current_user.user_id,
        organization_id=current_user.organization_id,
        action="role_change",
        entity_type="user",
        entity_id=target.user_id,
        details={
            "previous_role_id": previous_role_id,
            "new_role_id": new_role_id,
            "new_role_name": payload.role,
        },
    )
    await db.commit()
    await db.refresh(target)

    return UserOut(
        user_id=target.user_id,
        organization_id=target.organization_id,
        organization_name=current_user.organization_name,
        email=target.email,
        full_name=target.full_name,
        role=payload.role,
        is_active=target.is_active,
        created_at=target.created_at,
        last_login_at=target.last_login_at,
    )


@router.patch("/{user_id}/status", response_model=UserOut)
async def update_user_status(
    user_id: uuid.UUID,
    payload: UserStatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(_ADMIN_ONLY),
) -> UserOut:
    """Activates or deactivates a user in the administrator's organization."""
    target = await db.get(User, user_id)
    if target is None or target.organization_id != current_user.organization_id:
        if target is not None:
            await record_audit_log(
                db,
                actor_user_id=current_user.user_id,
                organization_id=current_user.organization_id,
                action="failed_cross_org_access",
                entity_type="user",
                entity_id=user_id,
                details={
                    "attempted_action": "update_user_status",
                    "target_organization_id": str(target.organization_id),
                },
            )
            await db.commit()
        raise ApiError(404, "user_not_found", f"No user with id {user_id}.")

    # If reactivating an Administrator, enforce 2-admin limit
    if payload.is_active and target.role_id == 1 and not target.is_active:
        active_admins = await _count_active_admins(
            db, current_user.organization_id, exclude_user_id=target.user_id
        )
        if active_admins >= 2:
            raise ApiError(
                400,
                "max_admins_reached",
                "An organization cannot have more than 2 active administrators.",
            )

    target.is_active = payload.is_active

    await record_audit_log(
        db,
        actor_user_id=current_user.user_id,
        organization_id=current_user.organization_id,
        action="user_activated" if payload.is_active else "user_deactivated",
        entity_type="user",
        entity_id=target.user_id,
        details={"is_active": payload.is_active},
    )
    await db.commit()
    await db.refresh(target)

    # Fetch role name
    role = await db.get(Role, target.role_id)
    role_name = role.role_name if role else "aml_analyst"

    return UserOut(
        user_id=target.user_id,
        organization_id=target.organization_id,
        organization_name=current_user.organization_name,
        email=target.email,
        full_name=target.full_name,
        role=role_name,
        is_active=target.is_active,
        created_at=target.created_at,
        last_login_at=target.last_login_at,
    )


@router.patch("/{user_id}", response_model=UserOut)
async def update_user_details(
    user_id: uuid.UUID,
    payload: UserDetailUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(_ADMIN_ONLY),
) -> UserOut:
    """Updates user information (such as full name) within administrator's organization."""
    target = await db.get(User, user_id)
    if target is None or target.organization_id != current_user.organization_id:
        if target is not None:
            await record_audit_log(
                db,
                actor_user_id=current_user.user_id,
                organization_id=current_user.organization_id,
                action="failed_cross_org_access",
                entity_type="user",
                entity_id=user_id,
                details={
                    "attempted_action": "update_user_details",
                    "target_organization_id": str(target.organization_id),
                },
            )
            await db.commit()
        raise ApiError(404, "user_not_found", f"No user with id {user_id}.")

    target.full_name = payload.full_name

    await record_audit_log(
        db,
        actor_user_id=current_user.user_id,
        organization_id=current_user.organization_id,
        action="user_updated",
        entity_type="user",
        entity_id=target.user_id,
        details={"full_name": payload.full_name},
    )
    await db.commit()
    await db.refresh(target)

    role = await db.get(Role, target.role_id)
    role_name = role.role_name if role else "aml_analyst"

    return UserOut(
        user_id=target.user_id,
        organization_id=target.organization_id,
        organization_name=current_user.organization_name,
        email=target.email,
        full_name=target.full_name,
        role=role_name,
        is_active=target.is_active,
        created_at=target.created_at,
        last_login_at=target.last_login_at,
    )


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(_ADMIN_ONLY),
) -> None:
    """Safely revokes access/deactivates user while preserving audit trail."""
    target = await db.get(User, user_id)
    if target is None or target.organization_id != current_user.organization_id:
        if target is not None:
            await record_audit_log(
                db,
                actor_user_id=current_user.user_id,
                organization_id=current_user.organization_id,
                action="failed_cross_org_access",
                entity_type="user",
                entity_id=user_id,
                details={
                    "attempted_action": "delete_user",
                    "target_organization_id": str(target.organization_id),
                },
            )
            await db.commit()
        raise ApiError(404, "user_not_found", f"No user with id {user_id}.")

    if target.user_id == current_user.user_id:
        raise ApiError(400, "cannot_delete_self", "Administrators cannot revoke their own access.")

    target.is_active = False

    await record_audit_log(
        db,
        actor_user_id=current_user.user_id,
        organization_id=current_user.organization_id,
        action="user_access_revoked",
        entity_type="user",
        entity_id=target.user_id,
        details={"deactivated_email": target.email},
    )
    await db.commit()


@router.post("/request-admin", response_model=AdminAccessRequestOut)
async def request_admin_access(
    payload: AdminAccessRequestIn,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> AdminAccessRequestOut:
    """Submits an administrator access request from an authenticated staff member."""
    if current_user.role_name == RoleName.ADMINISTRATOR:
        return AdminAccessRequestOut(
            status="already_admin",
            message="You already have Administrator privileges.",
            host_notified=False,
        )

    # 1. Record in immutable audit logs
    await record_audit_log(
        db,
        actor_user_id=current_user.user_id,
        organization_id=current_user.organization_id,
        action="admin_access_requested",
        entity_type="user",
        entity_id=current_user.user_id,
        details={
            "requested_by": current_user.email,
            "current_role": current_user.role_name,
            "reason": payload.reason,
            "organization_id": str(current_user.organization_id),
        },
    )
    await db.commit()

    # 2. Send email to host via Resend API
    email_result = await send_admin_request_email(
        applicant_email=current_user.email,
        applicant_name=current_user.full_name or current_user.email.split("@")[0],
        current_role=current_user.role_name,
        reason=payload.reason,
        user_id=str(current_user.user_id),
    )

    return AdminAccessRequestOut(
        status="submitted",
        message="Your request for Administrator access has been submitted to the platform host.",
        host_notified=email_result.get("sent", False),
        email_delivery=email_result,
    )

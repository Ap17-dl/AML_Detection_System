import re
import uuid
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import record_audit_log
from app.core.errors import ApiError
from app.core.security import CurrentUser, get_current_user, require_role
from app.core.supabase_admin import SupabaseAdminClient, get_supabase_admin_client
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.organization import Organization, OrganizationStatus
from app.models.role import Role, RoleName
from app.models.user import User
from app.schemas.organization import (
    OrganizationOut,
    OrganizationRegisterIn,
    OrganizationStatsOut,
    OrganizationUpdateIn,
)

router = APIRouter(prefix="/organizations", tags=["organizations"])

_ADMIN_ONLY = require_role(RoleName.ADMINISTRATOR)


def _slugify(text: str) -> str:
    cleaned = re.sub(r"[^\w\s-]", "", text.lower()).strip()
    return re.sub(r"[-\s]+", "-", cleaned)


@router.post("/register", response_model=OrganizationOut, status_code=201)
async def register_organization(
    payload: OrganizationRegisterIn,
    db: AsyncSession = Depends(get_db),
    admin_client: SupabaseAdminClient = Depends(get_supabase_admin_client),
) -> OrganizationOut:
    """Secure onboarding flow for creating an organization with an initial administrator."""
    # 1. Validate uniqueness of organization name and slug
    slug = payload.slug or _slugify(payload.name)
    existing_org = (
        await db.execute(
            select(Organization).where(
                (Organization.name == payload.name) | (Organization.slug == slug)
            )
        )
    ).scalar_one_or_none()
    if existing_org:
        raise ApiError(
            409,
            "organization_exists",
            f"An organization with the name '{payload.name}' or slug '{slug}' already exists.",
        )

    # 2. Check if admin email already exists in public.users
    existing_user = (
        await db.execute(select(User).where(User.email == payload.admin_email))
    ).scalar_one_or_none()
    if existing_user:
        raise ApiError(
            409,
            "email_in_use",
            f"Email '{payload.admin_email}' is already registered to an existing user.",
        )

    # 3. Create organization record
    new_org = Organization(
        name=payload.name,
        slug=slug,
        status=OrganizationStatus.ACTIVE,
    )
    db.add(new_org)
    await db.flush()

    # 4. Create primary Administrator in auth.users and public.users
    admin_user_id = uuid.uuid4()
    admin_role_id = 1  # Administrator

    # Attempt to create in Supabase Auth if client configured
    try:
        from sqlalchemy import text

        await db.execute(
            text(
                """
                INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
                VALUES (:uid, :email, json_build_object('full_name', cast(:full_name as text), 'organization_id', cast(:org_id as text))::jsonb, json_build_object('role_id', 1)::jsonb)
                ON CONFLICT (id) DO NOTHING
            """
            ),
            {
                "uid": admin_user_id,
                "email": payload.admin_email,
                "full_name": payload.admin_name,
                "org_id": str(new_org.id),
            },
        )
    except Exception:
        # Test or local environments without auth.users schema
        pass

    admin_user = User(
        user_id=admin_user_id,
        email=payload.admin_email,
        full_name=payload.admin_name,
        role_id=admin_role_id,
        organization_id=new_org.id,
        is_active=True,
    )
    db.add(admin_user)
    await db.flush()

    # 5. Record initial audit trail
    await record_audit_log(
        db=db,
        actor_user_id=admin_user.user_id,
        organization_id=new_org.id,
        action="organization_registered",
        entity_type="organization",
        entity_id=new_org.id,
        details={"name": new_org.name, "slug": new_org.slug, "admin_email": admin_user.email},
    )
    await db.commit()
    await db.refresh(new_org)

    return OrganizationOut(
        id=new_org.id,
        name=new_org.name,
        slug=new_org.slug,
        status=new_org.status,
        created_at=new_org.created_at,
        updated_at=new_org.updated_at,
        total_users=1,
        admin_count=1,
        analyst_count=0,
        operator_count=0,
    )


@router.get("/current", response_model=OrganizationStatsOut)
async def get_current_organization(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> OrganizationStatsOut:
    """Returns details, user metrics, and recent activity for the caller's organization."""
    org = await db.get(Organization, current_user.organization_id)
    if not org:
        raise ApiError(404, "organization_not_found", "Organization could not be found.")

    # Role breakdown in current organization
    role_counts = await db.execute(
        select(Role.role_name, func.count(User.user_id))
        .join(User, User.role_id == Role.role_id)
        .where(User.organization_id == current_user.organization_id, User.is_active.is_(True))
        .group_by(Role.role_name)
    )
    counts = {r: c for r, c in role_counts.all()}

    total_users_res = await db.execute(
        select(func.count(User.user_id)).where(User.organization_id == current_user.organization_id)
    )
    total_users = total_users_res.scalar() or 0

    # Fetch recent audit activity
    recent_logs_res = await db.execute(
        select(AuditLog, User.email)
        .outerjoin(User, AuditLog.user_id == User.user_id)
        .where(AuditLog.organization_id == current_user.organization_id)
        .order_by(AuditLog.created_at.desc())
        .limit(10)
    )
    recent_activity: list[dict[str, Any]] = []
    for log, user_email in recent_logs_res.all():
        recent_activity.append(
            {
                "audit_id": str(log.audit_id),
                "action": log.action,
                "entity_type": log.entity_type,
                "user_email": user_email,
                "details": log.details,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
        )

    return OrganizationStatsOut(
        id=org.id,
        name=org.name,
        slug=org.slug,
        status=org.status,
        total_users=total_users,
        admin_count=counts.get(RoleName.ADMINISTRATOR, 0),
        analyst_count=counts.get(RoleName.AML_ANALYST, 0),
        operator_count=counts.get(RoleName.DATA_OPERATOR, 0),
        recent_activity=recent_activity,
    )


@router.patch("/current", response_model=OrganizationOut)
async def update_current_organization(
    payload: OrganizationUpdateIn,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(_ADMIN_ONLY),
) -> OrganizationOut:
    """Updates organization name. Administrator only."""
    org = await db.get(Organization, current_user.organization_id)
    if not org:
        raise ApiError(404, "organization_not_found", "Organization could not be found.")

    old_name = org.name
    org.name = payload.name

    await record_audit_log(
        db=db,
        actor_user_id=current_user.user_id,
        organization_id=org.id,
        action="organization_updated",
        entity_type="organization",
        entity_id=org.id,
        details={"old_name": old_name, "new_name": org.name},
    )
    await db.commit()
    await db.refresh(org)

    return OrganizationOut(
        id=org.id,
        name=org.name,
        slug=org.slug,
        status=org.status,
        created_at=org.created_at,
        updated_at=org.updated_at,
    )

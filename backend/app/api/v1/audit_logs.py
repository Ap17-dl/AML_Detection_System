"""Audit log querying endpoints (AML-FR-25)."""

from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import CurrentUser, require_role
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.role import RoleName
from app.models.user import User

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])

_ADMIN_ONLY = require_role(RoleName.ADMINISTRATOR)


class AuditLogOut(BaseModel):
    audit_id: Any
    user_id: Any | None = None
    user_email: str | None = None
    action: str
    entity_type: str | None = None
    entity_id: Any | None = None
    details: dict[str, Any] | None = None
    created_at: Any

    model_config = ConfigDict(from_attributes=True)


class AuditLogListOut(BaseModel):
    items: list[AuditLogOut]
    total: int
    page: int
    page_size: int


@router.get("", response_model=AuditLogListOut)
async def list_audit_logs(
    action: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(_ADMIN_ONLY),
) -> AuditLogListOut:
    query = select(AuditLog)
    count_query = select(func.count(AuditLog.audit_id))

    if action:
        query = query.where(AuditLog.action == action)
        count_query = count_query.where(AuditLog.action == action)

    query = query.order_by(AuditLog.created_at.desc())
    total = (await db.execute(count_query)).scalar() or 0

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    logs = (await db.execute(query)).scalars().all()

    items = []
    for log_entry in logs:
        user_email = None
        if log_entry.user_id:
            u = await db.get(User, log_entry.user_id)
            user_email = u.email if u else None

        items.append(
            AuditLogOut(
                audit_id=log_entry.audit_id,
                user_id=log_entry.user_id,
                user_email=user_email,
                action=log_entry.action,
                entity_type=log_entry.entity_type,
                entity_id=log_entry.entity_id,
                details=log_entry.details,
                created_at=log_entry.created_at,
            )
        )

    return AuditLogListOut(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )

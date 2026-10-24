import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


async def record_audit_log(
    db: AsyncSession,
    *,
    actor_user_id: uuid.UUID | None = None,
    user_id: uuid.UUID | None = None,
    action: str,
    entity_type: str,
    entity_id: uuid.UUID | None = None,
    details: dict | None = None,
    organization_id: uuid.UUID | None = None,
) -> None:
    """Writes one immutable audit trail row. Callers commit as part of their own transaction.

    Every material action (role changes, invites, org setup, status changes, cross-org access attempts)
    must be traceable, per PRD §9 Business Rules and TRD §6.3.
    """
    effective_user_id = actor_user_id if actor_user_id is not None else user_id
    if organization_id is None and effective_user_id is not None:
        from app.models.user import User

        actor = await db.get(User, effective_user_id)
        if actor:
            organization_id = actor.organization_id

    db.add(
        AuditLog(
            user_id=effective_user_id,
            organization_id=organization_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
        )
    )

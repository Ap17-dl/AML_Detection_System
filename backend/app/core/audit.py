import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


async def record_audit_log(
    db: AsyncSession,
    *,
    actor_user_id: uuid.UUID,
    action: str,
    entity_type: str,
    entity_id: uuid.UUID,
    details: dict | None = None,
) -> None:
    """Writes one immutable audit trail row. Callers commit as part of their own transaction.

    Every material action (role changes, invites — more added as later sprints introduce them)
    must be traceable, per PRD §9 Business Rules and TRD §6.3.
    """
    db.add(
        AuditLog(
            user_id=actor_user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
        )
    )

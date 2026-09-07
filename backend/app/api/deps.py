from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ApiError
from app.models.role import Role


async def resolve_role_id(db: AsyncSession, role_name: str) -> int:
    result = await db.execute(select(Role.role_id).where(Role.role_name == role_name))
    role_id = result.scalar_one_or_none()
    if role_id is None:
        raise ApiError(422, "unknown_role", f"'{role_name}' is not a recognized role.")
    return role_id

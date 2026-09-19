"""Graph analysis endpoints (AML-FR-10, AML-FR-11, AML-FR-12)."""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import CurrentUser, require_role
from app.db.session import get_db
from app.models.role import RoleName
from app.schemas.graph import NetworkSubGraphOut
from app.services.graph_engine import build_account_subgraph

router = APIRouter(prefix="/graph", tags=["graph"])

_ANALYST_OR_ADMIN = require_role(RoleName.AML_ANALYST, RoleName.ADMINISTRATOR)


@router.get("/accounts/{account_id}", response_model=NetworkSubGraphOut)
async def get_account_subgraph(
    account_id: uuid.UUID,
    k_hops: int = Query(2, ge=1, le=3, description="Neighborhood hop distance"),
    max_transactions: int = Query(200, ge=10, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(_ANALYST_OR_ADMIN),
) -> NetworkSubGraphOut:
    """Builds and returns the transactional network subgraph and topology indicators
    (fan-in, fan-out, cycle detection, neighborhood risk) for the specified account.
    """
    subgraph = await build_account_subgraph(
        db=db,
        account_id=account_id,
        k_hops=k_hops,
        max_transactions=max_transactions,
    )
    await db.commit()
    return subgraph

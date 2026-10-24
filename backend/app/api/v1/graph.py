"""Graph analysis endpoints (AML-FR-10, AML-FR-11, AML-FR-12) — strictly organization-scoped."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import record_audit_log
from app.core.security import CurrentUser, require_role
from app.db.session import get_db
from app.models.account import Account
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
    for the specified account within caller's organization.
    """
    account = await db.get(Account, account_id)
    if not account or account.organization_id != current_user.organization_id:
        if account is not None:
            await record_audit_log(
                db,
                actor_user_id=current_user.user_id,
                organization_id=current_user.organization_id,
                action="failed_cross_org_access",
                entity_type="account",
                entity_id=account_id,
                details={"target_organization_id": str(account.organization_id)},
            )
            await db.commit()
        raise HTTPException(status_code=404, detail=f"Account {account_id} not found")

    subgraph = await build_account_subgraph(
        db=db,
        account_id=account_id,
        k_hops=k_hops,
        max_transactions=max_transactions,
    )
    await db.commit()
    return subgraph

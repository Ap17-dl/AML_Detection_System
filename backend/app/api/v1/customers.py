"""Customer endpoints — list, detail, linked accounts."""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ApiError
from app.core.security import CurrentUser, require_role
from app.db.session import get_db
from app.models.account import Account
from app.models.customer import Customer
from app.models.customer_risk_history import CustomerRiskHistory
from app.models.role import RoleName
from app.schemas.customer_risk import CustomerRiskHistoryOut, CustomerRiskProfileOut
from app.schemas.transaction import AccountOut, CustomerListOut, CustomerOut

router = APIRouter(prefix="/customers", tags=["customers"])

_READ_ROLES = require_role(RoleName.AML_ANALYST, RoleName.ADMINISTRATOR)


@router.get("", response_model=CustomerListOut)
async def list_customers(
    db: AsyncSession = Depends(get_db),
    _: CurrentUser = Depends(_READ_ROLES),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: str | None = Query(None, description="Search by name, external_ref, or country"),
    risk_category: str | None = Query(None, description="Filter by current_risk_category"),
    sort: str = Query("created_at", description="Sort column"),
    order: str = Query("desc", description="Sort order: asc or desc"),
) -> CustomerListOut:
    """Lists customers with search, filter, and pagination."""
    query = select(Customer)
    count_query = select(func.count(Customer.customer_id))

    if search:
        pattern = f"%{search}%"
        from sqlalchemy import or_

        filter_cond = or_(
            Customer.full_name.ilike(pattern),
            Customer.external_ref.ilike(pattern),
            Customer.country.ilike(pattern),
        )
        query = query.where(filter_cond)
        count_query = count_query.where(filter_cond)

    if risk_category:
        query = query.where(Customer.current_risk_category == risk_category)
        count_query = count_query.where(Customer.current_risk_category == risk_category)

    sort_col = getattr(Customer, sort, Customer.created_at)
    if order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    customers = result.scalars().all()

    return CustomerListOut(
        items=[CustomerOut.model_validate(c) for c in customers],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{customer_id}", response_model=CustomerOut)
async def get_customer(
    customer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: CurrentUser = Depends(_READ_ROLES),
) -> CustomerOut:
    """Returns a single customer profile."""
    customer = await db.get(Customer, customer_id)
    if customer is None:
        raise ApiError(404, "customer_not_found", f"No customer with id {customer_id}.")
    return CustomerOut.model_validate(customer)


@router.get("/{customer_id}/accounts", response_model=list[AccountOut])
async def list_customer_accounts(
    customer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: CurrentUser = Depends(_READ_ROLES),
) -> list[AccountOut]:
    """Returns all accounts belonging to a customer."""
    customer = await db.get(Customer, customer_id)
    if customer is None:
        raise ApiError(404, "customer_not_found", f"No customer with id {customer_id}.")

    result = await db.execute(
        select(Account).where(Account.customer_id == customer_id).order_by(Account.created_at)
    )
    accounts = result.scalars().all()
    return [AccountOut.model_validate(a) for a in accounts]


@router.get("/{customer_id}/risk-profile", response_model=CustomerRiskProfileOut)
async def get_customer_risk_profile(
    customer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: CurrentUser = Depends(_READ_ROLES),
) -> CustomerRiskProfileOut:
    """Returns dynamic risk score, category, and historical risk timeline for a customer."""
    customer = await db.get(Customer, customer_id)
    if customer is None:
        raise ApiError(404, "customer_not_found", f"No customer with id {customer_id}.")

    # Fetch risk history
    hist_res = await db.execute(
        select(CustomerRiskHistory)
        .where(CustomerRiskHistory.customer_id == customer_id)
        .order_by(CustomerRiskHistory.recorded_at.desc())
    )
    history_items = hist_res.scalars().all()

    return CustomerRiskProfileOut(
        customer_id=customer.customer_id,
        full_name=customer.full_name,
        current_risk_score=(
            float(customer.current_risk_score) if customer.current_risk_score is not None else None
        ),
        current_risk_category=customer.current_risk_category,
        risk_updated_at=customer.risk_updated_at,
        history=[
            CustomerRiskHistoryOut(
                history_id=h.history_id,
                customer_id=h.customer_id,
                risk_score=float(h.risk_score),
                risk_category=h.risk_category,
                reason=h.reason,
                recorded_at=h.recorded_at,
            )
            for h in history_items
        ],
    )


@router.post("/{customer_id}/recalculate-risk", response_model=CustomerRiskProfileOut)
async def trigger_recalculate_risk(
    customer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: CurrentUser = Depends(_READ_ROLES),
) -> CustomerRiskProfileOut:
    """Triggers on-demand customer risk recomputation across all linked accounts and transactions."""
    from app.services.risk_profile import recalculate_customer_risk

    await recalculate_customer_risk(db=db, customer_id=customer_id, reason="manual_request")
    await db.commit()

    return await get_customer_risk_profile(customer_id=customer_id, db=db, _=_)

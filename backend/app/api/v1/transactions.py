"""Transaction endpoints — AML-FR-04 (CSV import), AML-FR-05 (validation), AML-FR-06 (search/filter/paginate)."""

import uuid

from typing import Any

from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import record_audit_log
from app.core.errors import ApiError
from app.core.security import CurrentUser, require_role
from app.db.session import get_db
from app.models.account import Account
from app.models.prediction import Prediction
from app.models.role import RoleName
from app.models.transaction import Transaction
from app.schemas.transaction import (
    IngestionReportOut,
    TransactionDetailOut,
    TransactionListOut,
    TransactionOut,
)
from app.services.ingestion import ingest_csv

router = APIRouter(prefix="/transactions", tags=["transactions"])

_IMPORT_ROLES = require_role(RoleName.DATA_OPERATOR, RoleName.ADMINISTRATOR)
_READ_ROLES = require_role(RoleName.AML_ANALYST, RoleName.DATA_OPERATOR, RoleName.ADMINISTRATOR)


@router.post("/import", response_model=IngestionReportOut, status_code=201)
async def import_csv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(_IMPORT_ROLES),
) -> IngestionReportOut:
    """Imports a CSV file of transactions with row-level validation (AML-FR-04/05/06).

    Returns an ingestion report with accepted/rejected counts and per-row errors.
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise ApiError(
            422,
            "invalid_file_type",
            "Only .csv files are accepted.",
        )

    csv_bytes = await file.read()
    if len(csv_bytes) == 0:
        raise ApiError(422, "empty_file", "The uploaded file is empty.")

    batch, errors = await ingest_csv(
        db,
        csv_bytes=csv_bytes,
        filename=file.filename,
        uploaded_by=current_user.user_id,
    )

    await record_audit_log(
        db,
        actor_user_id=current_user.user_id,
        action="csv_import",
        entity_type="ingestion_batch",
        entity_id=batch.batch_id,
        details={
            "filename": file.filename,
            "total_rows": batch.total_rows,
            "accepted_rows": batch.accepted_rows,
            "rejected_rows": batch.rejected_rows,
        },
    )
    await db.commit()

    return IngestionReportOut(
        batch_id=batch.batch_id,
        filename=batch.filename,
        total_rows=batch.total_rows,
        accepted_rows=batch.accepted_rows,
        rejected_rows=batch.rejected_rows,
        status=batch.status,
        errors=errors,
    )


@router.get("", response_model=TransactionListOut)
async def list_transactions(
    db: AsyncSession = Depends(get_db),
    _: CurrentUser = Depends(_READ_ROLES),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: str | None = Query(None, description="Search by external_ref or account number"),
    date_from: str | None = Query(None, description="Filter: occurred_at >= (ISO date)"),
    date_to: str | None = Query(None, description="Filter: occurred_at <= (ISO date)"),
    channel: str | None = Query(None, description="Filter by channel"),
    transaction_type: str | None = Query(None, description="Filter by transaction_type"),
    sort: str = Query("occurred_at", description="Sort column"),
    order: str = Query("desc", description="Sort order: asc or desc"),
) -> TransactionListOut:
    """Lists transactions with search, sort, filter, and pagination (AML-FR-06)."""
    query = select(Transaction)
    count_query = select(func.count(Transaction.transaction_id))

    # --- filters ---
    if search:
        # Search by external_ref or join to accounts for account_number
        search_pattern = f"%{search}%"
        origin_acct = select(Account.account_id).where(
            Account.account_number.ilike(search_pattern)
        ).scalar_subquery()
        query = query.where(
            or_(
                Transaction.external_ref.ilike(search_pattern),
                Transaction.origin_account_id.in_(
                    select(Account.account_id).where(Account.account_number.ilike(search_pattern))
                ),
                Transaction.destination_account_id.in_(
                    select(Account.account_id).where(Account.account_number.ilike(search_pattern))
                ),
            )
        )
        count_query = count_query.where(
            or_(
                Transaction.external_ref.ilike(search_pattern),
                Transaction.origin_account_id.in_(
                    select(Account.account_id).where(Account.account_number.ilike(search_pattern))
                ),
                Transaction.destination_account_id.in_(
                    select(Account.account_id).where(Account.account_number.ilike(search_pattern))
                ),
            )
        )

    if date_from:
        query = query.where(Transaction.occurred_at >= date_from)
        count_query = count_query.where(Transaction.occurred_at >= date_from)

    if date_to:
        query = query.where(Transaction.occurred_at <= date_to)
        count_query = count_query.where(Transaction.occurred_at <= date_to)

    if channel:
        query = query.where(Transaction.channel == channel)
        count_query = count_query.where(Transaction.channel == channel)

    if transaction_type:
        query = query.where(Transaction.transaction_type == transaction_type)
        count_query = count_query.where(Transaction.transaction_type == transaction_type)

    # Only show accepted transactions
    query = query.where(Transaction.ingestion_status == "accepted")
    count_query = count_query.where(Transaction.ingestion_status == "accepted")

    # --- sort ---
    sort_col = getattr(Transaction, sort, Transaction.occurred_at)
    if order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    # --- count ---
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # --- paginate ---
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    transactions = result.scalars().all()

    # Attach prediction data if available
    preds_by_txn: dict[uuid.UUID, Any] = {}
    if transactions:
        txn_ids = [t.transaction_id for t in transactions]
        pred_res = await db.execute(
            select(Prediction).where(Prediction.transaction_id.in_(txn_ids))
        )
        for p in pred_res.scalars().all():
            preds_by_txn[p.transaction_id] = p

    return TransactionListOut(
        items=[
            TransactionOut(
                transaction_id=t.transaction_id,
                external_ref=t.external_ref,
                origin_account_id=t.origin_account_id,
                destination_account_id=t.destination_account_id,
                amount=t.amount,
                currency=t.currency,
                transaction_type=t.transaction_type,
                channel=t.channel,
                occurred_at=t.occurred_at,
                ingested_at=t.ingested_at,
                ingestion_status=t.ingestion_status,
                ingestion_error=t.ingestion_error,
                created_at=t.created_at,
                risk_category=preds_by_txn[t.transaction_id].risk_category if t.transaction_id in preds_by_txn else None,
                risk_probability=float(preds_by_txn[t.transaction_id].risk_probability) if t.transaction_id in preds_by_txn else None,
                model_version=preds_by_txn[t.transaction_id].model_version if t.transaction_id in preds_by_txn else None,
            )
            for t in transactions
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{transaction_id}", response_model=TransactionDetailOut)
async def get_transaction(
    transaction_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: CurrentUser = Depends(_READ_ROLES),
) -> TransactionDetailOut:
    """Returns a single transaction with linked account numbers."""
    result = await db.execute(
        select(Transaction).where(Transaction.transaction_id == transaction_id)
    )
    txn = result.scalar_one_or_none()
    if txn is None:
        raise ApiError(404, "transaction_not_found", f"No transaction with id {transaction_id}.")

    # Fetch account numbers
    origin_acct = await db.get(Account, txn.origin_account_id)
    dest_acct = await db.get(Account, txn.destination_account_id)

    # Fetch prediction if available
    pred_res = await db.execute(
        select(Prediction)
        .where(Prediction.transaction_id == transaction_id)
        .order_by(Prediction.predicted_at.desc())
    )
    pred = pred_res.scalars().first()

    return TransactionDetailOut(
        transaction_id=txn.transaction_id,
        external_ref=txn.external_ref,
        origin_account_id=txn.origin_account_id,
        destination_account_id=txn.destination_account_id,
        amount=txn.amount,
        currency=txn.currency,
        transaction_type=txn.transaction_type,
        channel=txn.channel,
        occurred_at=txn.occurred_at,
        ingested_at=txn.ingested_at,
        ingestion_status=txn.ingestion_status,
        ingestion_error=txn.ingestion_error,
        created_at=txn.created_at,
        origin_account_number=origin_acct.account_number if origin_acct else None,
        destination_account_number=dest_acct.account_number if dest_acct else None,
        risk_category=pred.risk_category if pred else None,
        risk_probability=float(pred.risk_probability) if pred else None,
        model_version=pred.model_version if pred else None,
    )

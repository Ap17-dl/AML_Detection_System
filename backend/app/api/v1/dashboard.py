"""Dashboard aggregate statistics endpoint (AML-FR-23)."""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import CurrentUser, require_role
from app.db.session import get_db
from app.models.account import Account
from app.models.alert import Alert
from app.models.customer import Customer
from app.models.prediction import Prediction
from app.models.role import RoleName
from app.models.transaction import Transaction
from app.schemas.alert import AlertOut, DashboardSummaryOut

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

_ALL_STAFF = require_role(RoleName.AML_ANALYST, RoleName.ADMINISTRATOR, RoleName.DATA_OPERATOR)


@router.get("/summary", response_model=DashboardSummaryOut)
async def get_dashboard_summary(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(_ALL_STAFF),
) -> DashboardSummaryOut:
    # If this is a new profile (non-demo user), check if they have uploaded any batches
    if not current_user.is_demo:
        from app.models.ingestion_batch import IngestionBatch

        batch_res = await db.execute(
            select(IngestionBatch.batch_id).where(
                IngestionBatch.uploaded_by == current_user.user_id
            )
        )
        user_batch_ids = batch_res.scalars().all()
        if not user_batch_ids:
            return DashboardSummaryOut(
                open_alerts_count=0,
                high_risk_txns_count=0,
                total_transactions_count=0,
                customers_monitored_count=0,
                false_positive_rate=0.0,
                alerts_by_risk={"high": 0, "medium": 0, "low": 0},
                alerts_by_status={"open": 0, "in_progress": 0, "closed": 0},
                recent_alerts=[],
                has_uploaded_batches=False,
                is_demo_user=False,
            )

        # For user with uploaded batches, compute metrics over their transactions
        user_txn_subq = select(Transaction.transaction_id).where(
            Transaction.ingestion_batch_id.in_(user_batch_ids)
        )
        user_txns_res = await db.execute(user_txn_subq)
        user_txn_ids = user_txns_res.scalars().all()
        total_txns = len(user_txn_ids)

        if total_txns == 0:
            return DashboardSummaryOut(
                open_alerts_count=0,
                high_risk_txns_count=0,
                total_transactions_count=0,
                customers_monitored_count=0,
                false_positive_rate=0.0,
                alerts_by_risk={"high": 0, "medium": 0, "low": 0},
                alerts_by_status={"open": 0, "in_progress": 0, "closed": 0},
                recent_alerts=[],
                has_uploaded_batches=True,
                is_demo_user=False,
            )

        high_risk_res = await db.execute(
            select(func.count(Prediction.prediction_id)).where(
                Prediction.transaction_id.in_(user_txn_ids),
                Prediction.risk_category == "high",
            )
        )
        high_risk = high_risk_res.scalar() or 0

        open_alerts_res = await db.execute(
            select(func.count(Alert.alert_id)).where(
                Alert.triggering_transaction_id.in_(user_txn_ids),
                Alert.status == "open",
            )
        )
        open_alerts = open_alerts_res.scalar() or 0

        acct_ids_res = await db.execute(
            select(Transaction.origin_account_id, Transaction.destination_account_id).where(
                Transaction.transaction_id.in_(user_txn_ids)
            )
        )
        acct_ids = set()
        for orig, dest in acct_ids_res.all():
            if orig:
                acct_ids.add(orig)
            if dest:
                acct_ids.add(dest)

        cust_count = 0
        if acct_ids:
            cust_res = await db.execute(
                select(func.count(func.distinct(Account.customer_id))).where(
                    Account.account_id.in_(acct_ids)
                )
            )
            cust_count = cust_res.scalar() or 0

        closed_res = await db.execute(
            select(func.count(Alert.alert_id)).where(
                Alert.triggering_transaction_id.in_(user_txn_ids),
                Alert.status == "closed",
            )
        )
        closed_count = closed_res.scalar() or 0

        fp_res = await db.execute(
            select(func.count(Alert.alert_id)).where(
                Alert.triggering_transaction_id.in_(user_txn_ids),
                Alert.outcome == "false_positive",
            )
        )
        fp_count = fp_res.scalar() or 0
        fpr = float(fp_count / closed_count) if closed_count > 0 else 0.0

        risk_counts: dict[str, int] = {"high": 0, "medium": 0, "low": 0}
        risk_res = await db.execute(
            select(Alert.risk_category, func.count(Alert.alert_id))
            .where(Alert.triggering_transaction_id.in_(user_txn_ids))
            .group_by(Alert.risk_category)
        )
        for cat, count in risk_res.all():
            if cat in risk_counts:
                risk_counts[cat] = count

        status_counts: dict[str, int] = {"open": 0, "in_progress": 0, "closed": 0}
        stat_res = await db.execute(
            select(Alert.status, func.count(Alert.alert_id))
            .where(Alert.triggering_transaction_id.in_(user_txn_ids))
            .group_by(Alert.status)
        )
        for st, count in stat_res.all():
            if st in status_counts:
                status_counts[st] = count

        recent_res = await db.execute(
            select(Alert)
            .where(Alert.triggering_transaction_id.in_(user_txn_ids))
            .order_by(Alert.created_at.desc())
            .limit(5)
        )
        recent = recent_res.scalars().all()
        recent_outs = []
        for a in recent:
            cust_name = None
            if a.customer_id:
                cust = await db.get(Customer, a.customer_id)
                cust_name = cust.full_name if cust else None

            recent_outs.append(
                AlertOut(
                    alert_id=a.alert_id,
                    customer_id=a.customer_id,
                    customer_name=cust_name,
                    triggering_transaction_id=a.triggering_transaction_id,
                    prediction_id=a.prediction_id,
                    risk_category=a.risk_category,
                    status=a.status,
                    assigned_to=a.assigned_to,
                    outcome=a.outcome,
                    threshold_config_used=a.threshold_config_used,
                    created_at=a.created_at,
                    closed_at=a.closed_at,
                )
            )

        return DashboardSummaryOut(
            open_alerts_count=open_alerts,
            high_risk_txns_count=high_risk,
            total_transactions_count=total_txns,
            customers_monitored_count=cust_count,
            false_positive_rate=round(fpr, 4),
            alerts_by_risk=risk_counts,
            alerts_by_status=status_counts,
            recent_alerts=recent_outs,
            has_uploaded_batches=True,
            is_demo_user=False,
        )

    # Demo users (and test runners): return pre-loaded seeded database structure
    # 1. Open alerts
    open_alerts_res = await db.execute(
        select(func.count(Alert.alert_id)).where(Alert.status == "open")
    )
    open_alerts = open_alerts_res.scalar() or 0

    # 2. Total transactions
    total_txns_res = await db.execute(select(func.count(Transaction.transaction_id)))
    total_txns = total_txns_res.scalar() or 0

    # 3. High-risk transactions
    high_risk_res = await db.execute(
        select(func.count(Prediction.prediction_id)).where(Prediction.risk_category == "high")
    )
    high_risk = high_risk_res.scalar() or 0

    # 4. Monitored customers
    cust_res = await db.execute(select(func.count(Customer.customer_id)))
    cust_count = cust_res.scalar() or 0

    # 5. False positive rate
    closed_res = await db.execute(
        select(func.count(Alert.alert_id)).where(Alert.status == "closed")
    )
    closed_count = closed_res.scalar() or 0

    fp_res = await db.execute(
        select(func.count(Alert.alert_id)).where(Alert.outcome == "false_positive")
    )
    fp_count = fp_res.scalar() or 0
    fpr = float(fp_count / closed_count) if closed_count > 0 else 0.0

    # 6. Alerts by risk
    risk_counts = {"high": 0, "medium": 0, "low": 0}
    risk_res = await db.execute(
        select(Alert.risk_category, func.count(Alert.alert_id)).group_by(Alert.risk_category)
    )
    for cat, count in risk_res.all():
        if cat in risk_counts:
            risk_counts[cat] = count

    # 7. Alerts by status
    status_counts = {"open": 0, "in_progress": 0, "closed": 0}
    stat_res = await db.execute(
        select(Alert.status, func.count(Alert.alert_id)).group_by(Alert.status)
    )
    for st, count in stat_res.all():
        if st in status_counts:
            status_counts[st] = count

    # 8. Recent 5 alerts
    recent_res = await db.execute(select(Alert).order_by(Alert.created_at.desc()).limit(5))
    recent = recent_res.scalars().all()
    recent_outs = []
    for a in recent:
        cust_name = None
        if a.customer_id:
            cust = await db.get(Customer, a.customer_id)
            cust_name = cust.full_name if cust else None

        recent_outs.append(
            AlertOut(
                alert_id=a.alert_id,
                customer_id=a.customer_id,
                customer_name=cust_name,
                triggering_transaction_id=a.triggering_transaction_id,
                prediction_id=a.prediction_id,
                risk_category=a.risk_category,
                status=a.status,
                assigned_to=a.assigned_to,
                outcome=a.outcome,
                threshold_config_used=a.threshold_config_used,
                created_at=a.created_at,
                closed_at=a.closed_at,
            )
        )

    return DashboardSummaryOut(
        open_alerts_count=open_alerts,
        high_risk_txns_count=high_risk,
        total_transactions_count=total_txns,
        customers_monitored_count=cust_count,
        false_positive_rate=round(fpr, 4),
        alerts_by_risk=risk_counts,
        alerts_by_status=status_counts,
        recent_alerts=recent_outs,
        has_uploaded_batches=True,
        is_demo_user=True,
    )

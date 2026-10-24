"""Dashboard aggregate statistics endpoint (AML-FR-23) — strictly organization-scoped."""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import CurrentUser, require_role
from app.db.session import get_db
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
    """Computes and returns dashboard statistics strictly scoped to the caller's organization."""
    org_id = current_user.organization_id

    # 1. Open alerts
    open_alerts_res = await db.execute(
        select(func.count(Alert.alert_id)).where(
            Alert.organization_id == org_id,
            Alert.status == "open",
        )
    )
    open_alerts = open_alerts_res.scalar() or 0

    # 2. Total transactions
    total_txns_res = await db.execute(
        select(func.count(Transaction.transaction_id)).where(Transaction.organization_id == org_id)
    )
    total_txns = total_txns_res.scalar() or 0

    # 3. High-risk transactions
    high_risk_res = await db.execute(
        select(func.count(Prediction.prediction_id)).where(
            Prediction.organization_id == org_id,
            Prediction.risk_category == "high",
        )
    )
    high_risk = high_risk_res.scalar() or 0

    # 4. Monitored customers
    cust_res = await db.execute(
        select(func.count(Customer.customer_id)).where(Customer.organization_id == org_id)
    )
    cust_count = cust_res.scalar() or 0

    # 5. False positive rate
    closed_res = await db.execute(
        select(func.count(Alert.alert_id)).where(
            Alert.organization_id == org_id,
            Alert.status == "closed",
        )
    )
    closed_count = closed_res.scalar() or 0

    fp_res = await db.execute(
        select(func.count(Alert.alert_id)).where(
            Alert.organization_id == org_id,
            Alert.outcome == "false_positive",
        )
    )
    fp_count = fp_res.scalar() or 0
    fpr = float(fp_count / closed_count) if closed_count > 0 else 0.0

    # 6. Alerts by risk
    risk_counts = {"high": 0, "medium": 0, "low": 0}
    risk_res = await db.execute(
        select(Alert.risk_category, func.count(Alert.alert_id))
        .where(Alert.organization_id == org_id)
        .group_by(Alert.risk_category)
    )
    for cat, count in risk_res.all():
        if cat in risk_counts:
            risk_counts[cat] = count

    # 7. Alerts by status
    status_counts = {"open": 0, "in_progress": 0, "closed": 0}
    stat_res = await db.execute(
        select(Alert.status, func.count(Alert.alert_id))
        .where(Alert.organization_id == org_id)
        .group_by(Alert.status)
    )
    for st, count in stat_res.all():
        if st in status_counts:
            status_counts[st] = count

    # 8. Recent 5 alerts
    recent_res = await db.execute(
        select(Alert, Customer.full_name)
        .outerjoin(Customer, Alert.customer_id == Customer.customer_id)
        .where(Alert.organization_id == org_id)
        .order_by(Alert.created_at.desc())
        .limit(5)
    )
    recent_outs = []
    for item in recent_res.all():
        if isinstance(item, Alert):
            a, cust_name = item, None
        elif isinstance(item, tuple) and len(item) == 2:
            a, cust_name = item
        else:
            a, cust_name = getattr(item, "_mapping", {}).get("Alert", item[0]), getattr(
                item, "_mapping", {}
            ).get("full_name", None)

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

    has_uploaded = total_txns > 0
    return DashboardSummaryOut(
        open_alerts_count=open_alerts,
        high_risk_txns_count=high_risk,
        total_transactions_count=total_txns,
        customers_monitored_count=cust_count,
        false_positive_rate=round(fpr, 4),
        alerts_by_risk=risk_counts,
        alerts_by_status=status_counts,
        recent_alerts=recent_outs,
        has_uploaded_batches=has_uploaded,
        is_demo_user=current_user.is_demo,
    )

"""Compliance reporting and audit export endpoints (AML-FR-24)."""

import csv
import io

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import record_audit_log
from app.core.security import CurrentUser, require_role
from app.db.session import get_db
from app.models.alert import Alert
from app.models.role import RoleName
from app.models.transaction import Transaction

router = APIRouter(prefix="/reports", tags=["reports"])

_ANALYST_OR_ADMIN = require_role(RoleName.AML_ANALYST, RoleName.ADMINISTRATOR)


@router.get("/summary")
async def get_compliance_summary(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(_ANALYST_OR_ADMIN),
):
    """Returns aggregated AML compliance metrics."""
    total_alerts = (await db.execute(select(func.count(Alert.alert_id)))).scalar() or 0
    closed_alerts = (
        await db.execute(select(func.count(Alert.alert_id)).where(Alert.status == "closed"))
    ).scalar() or 0
    confirmed = (
        await db.execute(
            select(func.count(Alert.alert_id)).where(Alert.outcome == "confirmed_suspicious")
        )
    ).scalar() or 0
    false_positives = (
        await db.execute(
            select(func.count(Alert.alert_id)).where(Alert.outcome == "false_positive")
        )
    ).scalar() or 0

    return {
        "total_alerts": total_alerts,
        "closed_alerts": closed_alerts,
        "confirmed_suspicious": confirmed,
        "false_positives": false_positives,
        "resolution_rate": round(closed_alerts / total_alerts, 4) if total_alerts > 0 else 1.0,
        "sar_filing_eligibility_count": confirmed,
    }


@router.get("/export")
async def export_alerts_csv(
    report_type: str = Query("alerts", pattern="^(alerts|transactions)$"),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(_ANALYST_OR_ADMIN),
):
    """Exports alerts or flagged transactions as a CSV spreadsheet."""
    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "alerts":
        writer.writerow(
            ["alert_id", "risk_category", "status", "outcome", "created_at", "closed_at"]
        )
        res = await db.execute(select(Alert).order_by(Alert.created_at.desc()))
        for a in res.scalars().all():
            writer.writerow(
                [
                    str(a.alert_id),
                    a.risk_category,
                    a.status,
                    a.outcome or "",
                    a.created_at.isoformat(),
                    a.closed_at.isoformat() if a.closed_at else "",
                ]
            )
        filename = "aml_alerts_report.csv"
    else:
        writer.writerow(["transaction_id", "amount", "currency", "channel", "occurred_at"])
        res = await db.execute(
            select(Transaction).order_by(Transaction.occurred_at.desc()).limit(1000)
        )
        for t in res.scalars().all():
            writer.writerow(
                [
                    str(t.transaction_id),
                    str(t.amount),
                    t.currency,
                    t.channel or "",
                    t.occurred_at.isoformat(),
                ]
            )
        filename = "aml_transactions_report.csv"

    await record_audit_log(
        db=db,
        actor_user_id=current_user.user_id,
        action="export_report",
        entity_type="report",
        details={"report_type": report_type, "filename": filename},
    )
    await db.commit()

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

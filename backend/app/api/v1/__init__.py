from fastapi import APIRouter

from app.api.v1.alerts import router as alerts_router
from app.api.v1.audit_logs import router as audit_logs_router
from app.api.v1.auth import router as auth_router
from app.api.v1.customers import router as customers_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.explanations import router as explanations_router
from app.api.v1.graph import router as graph_router
from app.api.v1.predictions import router as predictions_router
from app.api.v1.reports import router as reports_router
from app.api.v1.transactions import router as transactions_router
from app.api.v1.users import router as users_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(auth_router)
api_v1_router.include_router(users_router)
api_v1_router.include_router(transactions_router)
api_v1_router.include_router(customers_router)
api_v1_router.include_router(predictions_router)
api_v1_router.include_router(explanations_router)
api_v1_router.include_router(graph_router)
api_v1_router.include_router(alerts_router)
api_v1_router.include_router(dashboard_router)
api_v1_router.include_router(reports_router)
api_v1_router.include_router(audit_logs_router)

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CustomerRiskHistoryOut(BaseModel):
    history_id: uuid.UUID
    customer_id: uuid.UUID
    risk_score: float
    risk_category: str
    reason: str | None = None
    recorded_at: datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


class CustomerRiskProfileOut(BaseModel):
    customer_id: uuid.UUID
    full_name: str
    current_risk_score: float | None = None
    current_risk_category: str | None = None
    risk_updated_at: datetime | None = None
    history: list[CustomerRiskHistoryOut] = []

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

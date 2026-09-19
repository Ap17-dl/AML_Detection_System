import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class FeatureContribution(BaseModel):
    feature: str
    shap_value: float
    direction: str  # 'increases_risk' | 'decreases_risk'
    description: str


class ExplanationOut(BaseModel):
    explanation_id: uuid.UUID
    prediction_id: uuid.UUID
    top_features: list[FeatureContribution]
    narrative_text: str
    generated_at: datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

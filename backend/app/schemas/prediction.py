import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PredictionOut(BaseModel):
    prediction_id: uuid.UUID
    transaction_id: uuid.UUID
    model_version: str
    risk_probability: float
    risk_category: str
    graph_risk_component: float | None = None
    combined_risk_score: float | None = None
    predicted_at: datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


class ModelMetadataOut(BaseModel):
    model_version: str
    algorithm: str
    trained_at: datetime
    training_dataset: str | None = None
    precision_score: float | None = None
    recall_score: float | None = None
    f1_score: float | None = None
    pr_auc: float | None = None
    roc_auc: float | None = None
    false_positive_rate: float | None = None
    false_negative_rate: float | None = None
    threshold_low_max: float
    threshold_medium_max: float
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

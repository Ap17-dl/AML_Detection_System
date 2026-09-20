import uuid

from pydantic import BaseModel, ConfigDict


class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # 'account' | 'customer'
    risk_score: float | None = None
    risk_category: str | None = None
    in_degree: int = 0
    out_degree: int = 0


class GraphEdge(BaseModel):
    source: str
    target: str
    amount: float
    transaction_count: int
    currency: str = "USD"
    risk_category: str | None = None


class GraphIndicatorsOut(BaseModel):
    account_id: uuid.UUID
    in_degree: int
    out_degree: int
    fan_in_ratio: float | None = None
    fan_out_ratio: float | None = None
    is_in_cycle: bool = False
    cycle_length: int | None = None
    neighborhood_risk_score: float | None = None

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


class NetworkSubGraphOut(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    indicators: GraphIndicatorsOut | None = None

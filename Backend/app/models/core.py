from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum
from .base import BaseDBModel, PyObjectId

# Orders Model
class OrderPriority(str, Enum):
    ROUTINE = "routine"
    URGENT = "urgent"
    STAT = "stat"

class OrderStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Orders(BaseDBModel):
    case_id: PyObjectId
    test_name: str
    category: str
    cost: Optional[float] = None
    turnaround_time: Optional[str] = None
    invasiveness: Optional[str] = None
    information_gain: Optional[str] = None
    confidence: Optional[float] = Field(None, ge=0, le=1)
    rationale: Optional[str] = None
    clinical_utility: Optional[str] = None
    priority: OrderPriority = OrderPriority.ROUTINE
    ai_recommendation: bool = False
    status: OrderStatus = OrderStatus.PENDING
    ordered_by: str
    order_time: datetime = Field(default_factory=datetime.utcnow)
    results: Optional[str] = None

# Audit Logs Model
class AuditSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AuditLogs(BaseDBModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    user_id: str
    user_name: str
    action: str
    resource: str
    details: str
    ip_address: str
    user_agent: str
    severity: AuditSeverity
    compliance: Optional[str] = None

# System Events Model
class SystemEventStatus(str, Enum):
    SUCCESS = "success"
    FAILURE = "failure"
    WARNING = "warning"
    INFO = "info"

class SystemEvents(BaseDBModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    event: str
    status: SystemEventStatus
    details: str
    duration: Optional[str] = None

# Agents Model
class AgentStatus(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"

class RecentCase(BaseModel):
    id: str
    diagnosis: str
    confidence: int = Field(..., ge=0, le=100)

class Agents(BaseDBModel):
    name: str
    icon: Optional[str] = None
    status: AgentStatus = AgentStatus.ONLINE
    confidence: int = Field(..., ge=0, le=100)
    active_cases: int = 0
    avg_response_time: Optional[str] = None
    accuracy: Optional[str] = None
    recent_cases: List[RecentCase] = []
    capabilities: List[str] = []
    last_update: Optional[str] = None
    model_version: Optional[str] = None

# Specialist Results Model
class SpecialistResultStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    REVIEWED = "reviewed"

class SpecialistResults(BaseDBModel):
    case_id: PyObjectId
    specialty: str
    confidence: int = Field(..., ge=0, le=100)
    top_dx: str
    second_dx: Optional[str] = None
    rationale: str
    status: SpecialistResultStatus = SpecialistResultStatus.PENDING

# Integrated Results Model
class IntegratedResults(BaseDBModel):
    case_id: PyObjectId
    rank: int
    diagnosis: str
    probability: float = Field(..., ge=0, le=1)
    delta: Optional[str] = None
    next_test: Optional[str] = None
    cost: Optional[str] = None
    time_to_result: Optional[str] = None
    info_gain: Optional[str] = None
    evidence_count: int = 0

# Feedback Model
class FeedbackPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class Feedback(BaseDBModel):
    case_id: str
    clinician: str
    timestamp: str
    model_prediction: str
    clinician_dx: str
    feedback: str
    priority: FeedbackPriority
    processed: bool = False

# Create/Update/Response schemas for Orders
class OrdersCreate(BaseModel):
    test_name: str
    category: str
    cost: Optional[float] = 0
    turnaround_time: Optional[str] = None
    invasiveness: Optional[str] = None
    information_gain: Optional[str] = None
    confidence: Optional[int] = 0
    rationale: Optional[str] = None
    clinical_utility: Optional[str] = None
    priority: Optional[str] = "routine"
    ai_recommendation: Optional[bool] = False
    ordered_by: Optional[str] = None
    results: Optional[str] = None
    status: Optional[str] = "pending"

class OrdersUpdate(BaseModel):
    test_name: Optional[str] = None
    category: Optional[str] = None
    cost: Optional[float] = None
    turnaround_time: Optional[str] = None
    invasiveness: Optional[str] = None
    information_gain: Optional[str] = None
    confidence: Optional[int] = None
    rationale: Optional[str] = None
    clinical_utility: Optional[str] = None
    priority: Optional[str] = None
    ai_recommendation: Optional[bool] = None
    ordered_by: Optional[str] = None
    results: Optional[str] = None
    status: Optional[str] = None

class OrdersResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    id: str = Field(..., alias="_id")
    case_id: str
    test_name: str
    category: str
    cost: Optional[float] = 0
    turnaround_time: Optional[str] = None
    invasiveness: Optional[str] = None
    information_gain: Optional[str] = None
    confidence: Optional[int] = 0
    rationale: Optional[str] = None
    clinical_utility: Optional[str] = None
    priority: Optional[str] = "routine"
    ai_recommendation: Optional[bool] = False
    status: Optional[str] = "pending"
    ordered_by: Optional[str] = None
    order_time: Optional[str] = None
    results: Optional[str] = None
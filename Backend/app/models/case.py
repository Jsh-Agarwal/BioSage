from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum
from .base import BaseDBModel, PyObjectId

class CaseStatus(str, Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    PENDING = "pending"
    DISCHARGED = "discharged"

class CaseUrgency(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Case(BaseDBModel):
    case_id: str = Field(..., unique=True)  # e.g., "BSG-2024-001"
    patient_id: PyObjectId
    chief_complaint: str
    admission_date: str
    status: CaseStatus = CaseStatus.ACTIVE
    current_dx: Optional[str] = None
    assigned_team: List[str] = []  # list of user names/emails
    last_update: datetime = Field(default_factory=datetime.utcnow)
    diagnosed: bool = Field(default=False)

class CaseCreate(BaseModel):
    case_id: str
    patient_id: str  # Will be converted to ObjectId
    chief_complaint: str
    admission_date: str
    status: CaseStatus = CaseStatus.ACTIVE
    current_dx: Optional[str] = None
    assigned_team: List[str] = []
    diagnosed: bool = Field(default=False)

class CaseUpdate(BaseModel):
    chief_complaint: Optional[str] = None
    status: Optional[CaseStatus] = None
    current_dx: Optional[str] = None
    assigned_team: Optional[List[str]] = None
    diagnosed: Optional[bool] = None

class CaseResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    id: str = Field(..., alias="_id")
    case_id: str
    patient_id: str
    chief_complaint: str
    admission_date: str
    status: CaseStatus
    current_dx: Optional[str] = None
    assigned_team: List[str]
    last_update: str
    diagnosed: bool
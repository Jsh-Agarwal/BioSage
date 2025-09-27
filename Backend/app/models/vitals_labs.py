from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum
from .base import BaseDBModel, PyObjectId

class LabStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Vitals(BaseDBModel):
    case_id: PyObjectId
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    temperature: Optional[str] = None  # e.g., "98.6°F" or "37°C"
    bp: Optional[str] = None  # Blood pressure e.g., "120/80"
    hr: Optional[str] = None  # Heart rate e.g., "72 bpm"
    rr: Optional[str] = None  # Respiratory rate e.g., "16/min"
    o2sat: Optional[str] = None  # Oxygen saturation e.g., "98%"
    weight: Optional[str] = None  # e.g., "70 kg" or "154 lbs"

class VitalsCreate(BaseModel):
    temperature: Optional[str] = None
    bp: Optional[str] = None
    hr: Optional[str] = None
    rr: Optional[str] = None
    o2sat: Optional[str] = None
    weight: Optional[str] = None

class VitalsUpdate(BaseModel):
    temperature: Optional[str] = None
    bp: Optional[str] = None
    hr: Optional[str] = None
    rr: Optional[str] = None
    o2sat: Optional[str] = None
    weight: Optional[str] = None

class VitalsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    id: str = Field(..., alias="_id")
    case_id: str
    timestamp: str
    temperature: Optional[str] = None
    bp: Optional[str] = None
    hr: Optional[str] = None
    rr: Optional[str] = None
    o2sat: Optional[str] = None
    weight: Optional[str] = None

# Individual Lab Test Model
class LabTest(BaseModel):
    test: str  # Test name
    value: str  # Test result value
    reference: Optional[str] = None  # Reference range
    status: LabStatus = LabStatus.PENDING
    date: str  # Test date

class Labs(BaseDBModel):
    case_id: PyObjectId
    test: str  # Test name
    value: str  # Test result value
    reference: Optional[str] = None  # Reference range
    status: LabStatus = LabStatus.PENDING
    date: str  # Test date

class LabsCreate(BaseModel):
    test: str
    value: str
    reference: Optional[str] = None
    status: LabStatus = LabStatus.PENDING
    date: str

class LabsUpdate(BaseModel):
    test: Optional[str] = None
    value: Optional[str] = None
    reference: Optional[str] = None
    status: Optional[LabStatus] = None
    date: Optional[str] = None

class LabsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    id: str = Field(..., alias="_id")
    case_id: str
    test: str
    value: str
    reference: Optional[str] = None
    status: LabStatus
    date: str
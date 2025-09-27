from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum
from .base import BaseDBModel, TimestampMixin

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    UNKNOWN = "unknown"

class Patient(BaseDBModel, TimestampMixin):
    name: str
    dob: str  # Date of birth as string (YYYY-MM-DD format)
    gender: Gender
    mrn: str = Field(..., unique=True)  # Medical Record Number
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    emergency_contact: Optional[str] = None
    insurance: Optional[str] = None
    primary_care: Optional[str] = None

class PatientCreate(BaseModel):
    name: str
    dob: str
    gender: Gender
    mrn: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    emergency_contact: Optional[str] = None
    insurance: Optional[str] = None
    primary_care: Optional[str] = None

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[Gender] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    emergency_contact: Optional[str] = None
    insurance: Optional[str] = None
    primary_care: Optional[str] = None

class PatientResponse(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
        json_encoders={datetime: lambda v: v.isoformat() if v else None}
    )
    
    id: str = Field(..., alias="_id")
    name: str
    dob: str
    gender: Gender
    mrn: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    emergency_contact: Optional[str] = None
    insurance: Optional[str] = None
    primary_care: Optional[str] = None
    created_at: str
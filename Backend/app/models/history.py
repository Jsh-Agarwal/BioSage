from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from enum import Enum
from .base import BaseDBModel, PyObjectId

class AllergySeverity(str, Enum):
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"
    LIFE_THREATENING = "life_threatening"

class MedicationStatus(str, Enum):
    ACTIVE = "active"
    DISCONTINUED = "discontinued"
    COMPLETED = "completed"

class ConditionStatus(str, Enum):
    ACTIVE = "active"
    RESOLVED = "resolved"
    CHRONIC = "chronic"
    REMISSION = "remission"

class Allergy(BaseModel):
    allergen: str
    reaction: str
    severity: AllergySeverity

class Medication(BaseModel):
    name: str
    dose: str
    indication: str
    started: str  # Date started
    status: MedicationStatus = MedicationStatus.ACTIVE

class Condition(BaseModel):
    condition: str
    diagnosed: str  # Date diagnosed
    status: ConditionStatus

class Surgery(BaseModel):
    procedure: str
    date: str
    complications: Optional[str] = None

class MedicalHistory(BaseDBModel):
    patient_id: PyObjectId
    allergies: Optional[List[str]] = None
    medications: Optional[List[str]] = None
    conditions: Optional[List[str]] = None
    surgeries: Optional[List[str]] = None

class MedicalHistoryCreate(BaseModel):
    allergies: Optional[List[str]] = None
    medications: Optional[List[str]] = None
    conditions: Optional[List[str]] = None
    surgeries: Optional[List[str]] = None

class MedicalHistoryUpdate(BaseModel):
    allergies: Optional[List[str]] = None
    medications: Optional[List[str]] = None
    conditions: Optional[List[str]] = None
    surgeries: Optional[List[str]] = None

class MedicalHistoryResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    id: str = Field(..., alias="_id")
    patient_id: str
    allergies: Optional[List[str]] = None
    medications: Optional[List[str]] = None
    conditions: Optional[List[str]] = None
    surgeries: Optional[List[str]] = None

class SocialHistory(BaseDBModel):
    patient_id: PyObjectId
    smoking_status: Optional[str] = None
    alcohol_use: Optional[str] = None
    drug_use: Optional[str] = None
    occupation: Optional[str] = None
    marital_status: Optional[str] = None

class SocialHistoryCreate(BaseModel):
    smoking_status: Optional[str] = None
    alcohol_use: Optional[str] = None
    drug_use: Optional[str] = None
    occupation: Optional[str] = None
    marital_status: Optional[str] = None

class SocialHistoryUpdate(BaseModel):
    smoking_status: Optional[str] = None
    alcohol_use: Optional[str] = None
    drug_use: Optional[str] = None
    occupation: Optional[str] = None
    marital_status: Optional[str] = None

class SocialHistoryResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    id: str = Field(..., alias="_id")
    patient_id: str
    smoking_status: Optional[str] = None
    alcohol_use: Optional[str] = None
    drug_use: Optional[str] = None
    occupation: Optional[str] = None
    marital_status: Optional[str] = None
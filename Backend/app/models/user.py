from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum
from .base import BaseDBModel, TimestampMixin

class UserRole(str, Enum):
    CLINICIAN = "clinician"
    ADMIN = "admin"
    SYSTEM = "system"

class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

class User(BaseDBModel, TimestampMixin):
    name: str
    email: EmailStr = Field(..., unique=True)
    role: UserRole
    password_hash: str
    status: UserStatus = UserStatus.ACTIVE
    last_login: Optional[datetime] = None

class UserCreate(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        str_strip_whitespace=True,
    )
    
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    role: UserRole
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        str_strip_whitespace=True,
    )
    
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None

class UserResponse(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
        json_encoders={datetime: lambda v: v.isoformat() if v else None}
    )
    
    id: str = Field(..., alias="_id")
    name: str
    email: EmailStr
    role: UserRole
    status: UserStatus
    created_at: str
    last_login: Optional[str] = None
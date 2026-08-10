from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleOut(RoleBase):
    id: int

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    preferred_language: str = Field(default="en", max_length=10)
    time_zone: str = Field(default="UTC", max_length=50)
    mental_wellness_goal: Optional[str] = None
    emergency_contact: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)
    role_name: str = Field(default="User") # "User", "Counselor", "Admin"

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    preferred_language: Optional[str] = Field(None, max_length=10)
    time_zone: Optional[str] = Field(None, max_length=50)
    mental_wellness_goal: Optional[str] = None
    emergency_contact: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6, max_length=100)

class UserOut(UserBase):
    id: int
    role_id: int
    created_at: datetime
    updated_at: datetime
    role: Optional[RoleOut] = None

    class Config:
        from_attributes = True

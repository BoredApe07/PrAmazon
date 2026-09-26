from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


# 1. Base schema with shared user properties
class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None


# 2. Registration schema: Client sends plain password when creating an account
class UserCreate(UserBase):
    password: str


# 3. Login schema: Client sends credentials to receive a JWT token
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# 4. Response schema: What FastAPI sends back to React over the network
# Notice: 'password' and 'hashed_password' are NOT here! They are never exposed.
class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime

    # ConfigDict(from_attributes=True) allows Pydantic to read directly from SQLAlchemy models
    model_config = ConfigDict(from_attributes=True)


# 5. Token response schema: Sent back after a successful login
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

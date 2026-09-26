from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.core.database import Base


class User(Base):
    """
    SQLAlchemy Model representing the 'users' table.
    Stores account credentials, profile data, and access roles (RBAC).
    """
    __tablename__ = "users"

    # 1. Primary Key: Unique ID for each registered account
    id = Column(Integer, primary_key=True, index=True)

    # 2. Login & Identity Credentials
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=True)

    # 3. Role-Based Access Control (RBAC): "customer" or "admin"
    role = Column(String, default="customer", nullable=False)

    # 4. Metadata
    created_at = Column(DateTime, default=datetime.utcnow)

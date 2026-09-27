from datetime import datetime
from typing import Optional
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class User(Base):
    """
    SQLAlchemy Model representing the 'users' table.
    Stores account credentials, profile data, and access roles (RBAC).
    Using modern SQLAlchemy 2.0 type-annotated mapped_column.
    """
    __tablename__ = "users"

    # 1. Primary Key: Unique ID for each registered account
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # 2. Login & Identity Credentials
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # 3. Role-Based Access Control (RBAC): "customer" or "admin"
    role: Mapped[str] = mapped_column(String, default="customer", nullable=False)

    # 4. Metadata
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

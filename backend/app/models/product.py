from typing import Optional
from sqlalchemy import String, Float, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Product(Base):
    """
    SQLAlchemy Model representing the 'products' table in the database.
    Using modern SQLAlchemy 2.0 type-annotated mapped_column.
    """
    __tablename__ = "products"

    # 1. Primary Key: Unique ID for each product
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # 2. Product Details
    title: Mapped[str] = mapped_column(String, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False, index=True)
    image_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # 3. Rating & Inventory
    rating: Mapped[float] = mapped_column(Float, default=4.5)
    rating_count: Mapped[int] = mapped_column(default=100)
    stock: Mapped[int] = mapped_column(default=10)

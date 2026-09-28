from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Order(Base):
    """
    SQLAlchemy Model representing the 'orders' table.
    Stores customer checkout details and high-level order metadata.
    Relational: Linked directly to the User account and purchased OrderItems.
    """
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    idempotency_key: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True, nullable=True)
    shipping_address: Mapped[str] = mapped_column(String, nullable=False)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String, default="confirmed")  # confirmed, shipped, delivered, cancelled
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    # Relationships
    user = relationship("app.models.user.User", backref="orders")
    items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    """
    SQLAlchemy Model representing the 'order_items' table.
    Links individual products and quantities to a specific order (One-to-Many).
    """
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(default=1, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)  # Price at time of purchase

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product = relationship("app.models.product.Product")

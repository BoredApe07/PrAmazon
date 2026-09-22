from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Order(Base):
    """
    SQLAlchemy Model representing the 'orders' table.
    Stores customer checkout details and high-level order metadata.
    """
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    shipping_address = Column(String, nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String, default="confirmed")  # confirmed, shipped, delivered, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship to individual purchased items (One Order -> Many OrderItems)
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    """
    SQLAlchemy Model representing the 'order_items' table.
    Links individual products and quantities to a specific order (One-to-Many).
    """
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Float, nullable=False)  # Price at time of purchase

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("app.models.product.Product")

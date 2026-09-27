from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserResponse
from app.schemas.product import ProductResponse


# 1. Order Item Schemas
class OrderItemCreate(BaseModel):
    """
    Schema for an item being ordered by the client.
    Notice: No price here! The backend looks up the real price from the database.
    """
    product_id: int
    quantity: int = Field(default=1, ge=1, description="Quantity must be at least 1")


class OrderItemResponse(BaseModel):
    """
    Schema for an item returned in the order confirmation response.
    Relational: Natively embeds the purchased Product details (which includes product.id).
    """
    id: int
    quantity: int
    unit_price: float
    product: Optional[ProductResponse] = None

    model_config = ConfigDict(from_attributes=True)


# 2. Main Order Schemas
class OrderCreate(BaseModel):
    """
    Schema for incoming checkout request from React frontend.
    Customer identity is derived directly from the authenticated JWT session.
    """
    shipping_address: str = Field(..., min_length=5, description="Full delivery address")
    items: List[OrderItemCreate] = Field(..., min_length=1, description="At least one item is required to place an order")


class OrderStatusUpdate(BaseModel):
    """
    Schema for updating order delivery progress (Administrator only).
    """
    status: str = Field(..., description="confirmed, shipped, out_for_delivery, delivered, cancelled")


class OrderResponse(BaseModel):
    """
    Schema for order confirmation returned to React frontend.
    Relational: Natively embeds the customer User profile (which includes user.id).
    """
    id: int
    shipping_address: str
    total_amount: float
    status: str
    created_at: datetime
    user: Optional[UserResponse] = None
    items: List[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)


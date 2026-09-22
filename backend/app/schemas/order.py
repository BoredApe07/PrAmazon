from datetime import datetime
from typing import List
from pydantic import BaseModel, ConfigDict, Field


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
    """
    id: int
    product_id: int
    quantity: int
    unit_price: float

    model_config = ConfigDict(from_attributes=True)


# 2. Main Order Schemas
class OrderCreate(BaseModel):
    """
    Schema for incoming checkout request from React frontend.
    """
    customer_name: str = Field(..., min_length=2, description="Customer full name")
    customer_email: str = Field(..., description="Customer contact email")
    shipping_address: str = Field(..., min_length=5, description="Full delivery address")
    items: List[OrderItemCreate] = Field(..., min_length=1, description="At least one item is required to place an order")


class OrderResponse(BaseModel):
    """
    Schema for order confirmation returned to React frontend.
    """
    id: int
    customer_name: str
    customer_email: str
    shipping_address: str
    total_amount: float
    status: str
    created_at: datetime
    items: List[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)

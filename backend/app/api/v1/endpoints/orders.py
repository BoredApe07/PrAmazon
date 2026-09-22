from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Product, Order, OrderItem
from app.schemas import OrderCreate, OrderResponse

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    """
    Place a new customer order.
    
    1. Validates that every requested product exists in the database.
    2. Validates that sufficient inventory stock is available.
    3. Deducts the purchased quantity from product stock.
    4. Computes the authentic subtotal using verified database prices.
    5. Creates the Order and OrderItem records in SQLite.
    """
    total_amount = 0.0
    order_items_to_create = []

    # 1. Process each item in the order
    for item in order_in.items:
        # Fetch the product from SQLite
        product = db.query(Product).filter(Product.id == item.product_id).first()
        
        # Guard: Check if product exists
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item.product_id} does not exist."
            )
        
        # Guard: Check inventory stock
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for '{product.title}'. Requested: {item.quantity}, Available: {product.stock}"
            )
        
        # Deduct inventory stock
        product.stock -= item.quantity

        # Calculate line item price
        item_total = product.price * item.quantity
        total_amount += item_total

        # Prepare OrderItem record
        order_item = OrderItem(
            product_id=product.id,
            quantity=item.quantity,
            unit_price=product.price,
        )
        order_items_to_create.append(order_item)

    # 2. Create the main Order record
    db_order = Order(
        customer_name=order_in.customer_name,
        customer_email=order_in.customer_email,
        shipping_address=order_in.shipping_address,
        total_amount=round(total_amount, 2),
        status="confirmed",
        items=order_items_to_create,
    )

    # 3. Save to database
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    return db_order


@router.get("/{order_id}", response_model=OrderResponse)
def get_order_by_id(order_id: int, db: Session = Depends(get_db)):
    """
    Fetch an order receipt by its unique ID.
    Returns HTTP 404 if the order does not exist.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} was not found."
        )
    return order

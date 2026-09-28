from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.models import Product, Order, OrderItem, User
from app.schemas import OrderCreate, OrderResponse, OrderStatusUpdate
from app.api.deps import get_current_user, get_current_admin

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("/", response_model=List[OrderResponse])
def list_orders(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List orders securely for authenticated users:
    - Customers can ONLY view their own orders (strict isolation).
    - Administrators can view all orders across the store.
    """
    query = db.query(Order)
    if current_user.role != "admin":
        query = query.filter(Order.user_id == current_user.id)

    return query.order_by(Order.created_at.desc()).limit(limit).all()


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_in: OrderCreate,
    current_user: User = Depends(get_current_user),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db)
):
    """
    Place a new customer order for the authenticated user.
    Uses ATOMIC inventory decrements with concurrency control to prevent overselling.
    Supports idempotent checkouts via Idempotency-Key header to prevent duplicate orders.
    """
    # 1. Idempotency Check: Did we already process this exact checkout attempt?
    if idempotency_key:
        existing_order = (
            db.query(Order)
            .filter(Order.idempotency_key == idempotency_key, Order.user_id == current_user.id)
            .first()
        )
        if existing_order:
            # Return already created order without touching stock or charging again
            return existing_order

    total_amount = 0.0
    order_items_to_create = []

    try:
        # 2. Process each item in the order with atomic concurrency controls
        for item in order_in.items:
            # Fetch product to verify existence, retrieve current title & official price
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if not product:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {item.product_id} does not exist."
                )

            # Concurrency Control: Atomic Conditional Update
            # Decrements stock IF AND ONLY IF current stock >= requested quantity
            stmt = (
                update(Product)
                .where(Product.id == item.product_id, Product.stock >= item.quantity)
                .values(stock=Product.stock - item.quantity)
            )
            result = db.execute(stmt)

            # If 0 rows were updated, stock was insufficient at the exact moment of execution
            if result.rowcount == 0: # type: ignore
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for '{product.title}'. Requested: {item.quantity}, Available: {product.stock}"
                )

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

        # 3. Create the main Order record with idempotency key attached
        db_order = Order(
            user_id=current_user.id,
            idempotency_key=idempotency_key,
            shipping_address=order_in.shipping_address,
            total_amount=round(total_amount, 2),
            status="confirmed",
            items=order_items_to_create,
        )

        # 4. Commit the entire transaction atomically
        db.add(db_order)
        db.commit()
        db.refresh(db_order)

        return db_order

    except IntegrityError:
        # Concurrent duplicate request with same key committed simultaneously
        db.rollback()
        if idempotency_key:
            existing = (
                db.query(Order)
                .filter(Order.idempotency_key == idempotency_key, Order.user_id == current_user.id)
                .first()
            )
            if existing:
                return existing
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A conflicting transaction occurred. Please retry your request."
        )
    except HTTPException:
        # Re-raise explicit HTTP exceptions (rollback already handled)
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process order: {str(e)}"
        )


@router.get("/{order_id}", response_model=OrderResponse)
def get_order_by_id(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch an order receipt by its unique ID.
    Only the customer who placed the order (or an Administrator) can view it.
    """
    query = db.query(Order).filter(Order.id == order_id)
    if current_user.role != "admin":
        query = query.filter(Order.user_id == current_user.id)

    order = query.first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order #{order_id} was not found."
        )

    return order


@router.put("/{order_id}/cancel", response_model=OrderResponse)
def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel an existing order and replenish product inventory stock.
    Only the customer who placed the order (or an Administrator) can cancel it.
    """
    query = db.query(Order).filter(Order.id == order_id)
    if current_user.role != "admin":
        query = query.filter(Order.user_id == current_user.id)

    order = query.first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order #{order_id} was not found."
        )

    if order.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order #{order_id} is already cancelled."
        )

    if order.status == "delivered":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Delivered orders cannot be cancelled. Please initiate a return instead."
        )

    # 1. Replenish inventory stock for each purchased product
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock += item.quantity

    # 2. Update order status
    order.status = "cancelled"
    db.commit()
    db.refresh(order)

    return order


VALID_ORDER_STATUSES = {"confirmed", "shipped", "out_for_delivery", "delivered"}


@router.put("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update the fulfillment and delivery status of an order (Administrator only).
    """
    new_status = status_update.status.strip().lower()
    if new_status not in VALID_ORDER_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{status_update.status}'. Allowed statuses: {', '.join(sorted(VALID_ORDER_STATUSES))}."
        )

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order #{order_id} was not found."
        )

    if order.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order #{order_id} is cancelled and cannot have its status updated."
        )

    order.status = new_status
    db.commit()
    db.refresh(order)

    return order



from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductResponse

# Create the dedicated router for products
router = APIRouter(prefix="/products", tags=["Products"])


@router.get("/", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    """
    Fetch all products from the SQLite database.
    """
    products = db.query(Product).all()
    return products


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    """
    Create a new product in the SQLite database.
    """
    # 1. Convert Pydantic data into a SQLAlchemy Model instance
    new_product = Product(
        title=product_in.title,
        description=product_in.description,
        price=product_in.price,
        category=product_in.category,
        image_url=product_in.image_url,
        rating=product_in.rating,
        stock=product_in.stock,
    )

    # 2. Add and commit to the database
    db.add(new_product)
    db.commit()

    # 3. Refresh loads the auto-generated 'id' back from SQLite
    db.refresh(new_product)

    return new_product

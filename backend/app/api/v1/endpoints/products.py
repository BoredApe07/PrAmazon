from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductResponse

# Create the dedicated router for products
router = APIRouter(prefix="/products", tags=["Products"])


@router.get("/", response_model=List[ProductResponse])
def get_products(
    category: Optional[str] = Query(None, description="Filter products by category (e.g. Electronics, Books)"),
    search: Optional[str] = Query(None, description="Search products by title or description keyword"),
    db: Session = Depends(get_db)
):
    """
    Fetch all products, with optional search keyword and category filtering.
    """
    query = db.query(Product)

    # 1. Category Filter (Case-insensitive)
    if category:
        query = query.filter(Product.category.ilike(f"%{category}%"))

    # 2. Keyword Search across Title OR Description
    if search:
        query = query.filter(
            (Product.title.ilike(f"%{search}%")) | 
            (Product.description.ilike(f"%{search}%"))
        )

    return query.all()


@router.get("/categories", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    """
    Fetch all unique product categories available in the store.
    Example: ["Electronics", "Home & Kitchen", "Fashion", "Books"]
    """
    # Query distinct categories from SQLite
    results = db.query(Product.category).distinct().all()
    # Extract strings from SQL tuples: [('Electronics',), ...] -> ['Electronics', ...]
    return [c[0] for c in results]


@router.get("/{product_id}", response_model=ProductResponse)
def get_product_by_id(product_id: int, db: Session = Depends(get_db)):
    """
    Fetch a single product by its unique database ID.
    Returns HTTP 404 if the product does not exist.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} was not found."
        )
    return product


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

import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.redis import get_cache, set_cache, invalidate_cache_pattern
from app.models.product import Product
from app.models.user import User
from app.schemas.product import ProductCreate, ProductResponse, PaginatedProductResponse
from app.api.deps import get_current_admin

# Create the dedicated router for products
router = APIRouter(prefix="/products", tags=["Products"])


@router.get("/", response_model=PaginatedProductResponse)
def get_products(
    category: Optional[str] = Query(None, description="Filter products by category (e.g. Electronics, Books)"),
    search: Optional[str] = Query(None, description="Search products by title or description keyword"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    db: Session = Depends(get_db)
):
    """
    Fetch paginated products, with optional search keyword and category filtering.
    Checks Redis cache first (Cache-Aside pattern). On miss, queries PostgreSQL
    and caches the response for 60 seconds.
    """
    # 1. Construct deterministic cache key
    norm_cat = category.strip().lower() if category else "all"
    norm_search = search.strip().lower() if search else "none"
    cache_key = f"products:cat={norm_cat}:q={norm_search}:p={page}:l={limit}"

    # 2. Check Redis Cache (Hit returns in ~2ms!)
    cached_payload = get_cache(cache_key)
    if cached_payload is not None:
        return cached_payload

    # 3. Cache Miss: Query PostgreSQL
    query = db.query(Product)

    # Category Filter (Case-insensitive)
    if category:
        query = query.filter(Product.category.ilike(f"%{category}%"))

    # Keyword Search across Title OR Description
    if search:
        query = query.filter(
            (Product.title.ilike(f"%{search}%")) | 
            (Product.description.ilike(f"%{search}%"))
        )

    # Count total matching products
    total = query.count()
    total_pages = math.ceil(total / limit) if total > 0 else 1

    # Deterministic slice via offset and limit
    skip = (page - 1) * limit
    items = query.order_by(Product.id.asc()).offset(skip).limit(limit).all()

    response_payload = {
        "items": jsonable_encoder(items),
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }

    # 4. Save into Redis (TTL = 60s)
    set_cache(cache_key, response_payload, ttl_seconds=60)

    return response_payload


@router.get("/categories", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    """
    Fetch all unique product categories available in the store.
    Cached in Redis for 300 seconds (5 minutes).
    """
    cache_key = "products:categories"
    cached = get_cache(cache_key)
    if cached is not None:
        return cached

    # Query distinct categories from PostgreSQL
    results = db.query(Product.category).distinct().all()
    categories = [c[0] for c in results]

    set_cache(cache_key, categories, ttl_seconds=300)
    return categories


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
def create_product(
    product_in: ProductCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new product in the SQLite database (Administrator only).
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

    # 3. Refresh loads the auto-generated 'id' back from PostgreSQL
    db.refresh(new_product)

    # 4. Invalidate stale product caches so new product is immediately visible
    invalidate_cache_pattern("products:*")

    return new_product

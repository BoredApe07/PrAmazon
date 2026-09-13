from pydantic import BaseModel, ConfigDict
from typing import Optional


# 1. Base Schema: Shared attributes
class ProductBase(BaseModel):
    title: str
    description: Optional[str] = None
    price: float
    category: str
    image_url: Optional[str] = None
    rating: Optional[float] = 4.5
    stock: Optional[int] = 10


# 2. Create Schema: What the client sends when adding a new product
# (Notice: No 'id' here, because the database assigns the ID automatically!)
class ProductCreate(ProductBase):
    pass


# 3. Response Schema: What FastAPI sends back to React over the network
# (Notice: Includes 'id' so React can display it and use it as key={product.id})
class ProductResponse(ProductBase):
    id: int

    # ConfigDict(from_attributes=True) tells Pydantic:
    # "You are allowed to read data directly from a SQLAlchemy database object!"
    model_config = ConfigDict(from_attributes=True)

from sqlalchemy import Column, Integer, String, Float, Text
from app.core.database import Base


class Product(Base):
    """
    SQLAlchemy Model representing the 'products' table in the database.
    """
    __tablename__ = "products"

    # 1. Primary Key: Unique ID for each product
    id = Column(Integer, primary_key=True, index=True)

    # 2. Product Details
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    category = Column(String, nullable=False, index=True)
    image_url = Column(String, nullable=True)
    
    # 3. Rating & Inventory
    rating = Column(Float, default=4.5)
    stock = Column(Integer, default=10)

"""
Database Seed Script:
Populates the SQLite database with realistic Amazon products.
Run with: python seed.py
"""

from app.core.database import SessionLocal, engine, Base
from app.models.product import Product

# Ensure all tables exist
Base.metadata.create_all(bind=engine)

SAMPLE_PRODUCTS = [
    {
        "title": "Sony WH-1000XM4 Wireless Noise-Canceling Headphones",
        "description": "Industry-leading noise canceling with Dual Noise Sensor technology. Up to 30-hour battery life with quick charging.",
        "price": 24990.00,
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
        "rating": 4.8,
        "stock": 25,
    },
    {
        "title": "Apple MacBook Air 13.6-Inch (M2 Chip)",
        "description": "Strikingly thin design with 8-core CPU, 8GB unified memory, and 256GB SSD storage. Up to 18 hours of battery life.",
        "price": 99900.00,
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",
        "rating": 4.9,
        "stock": 14,
    },
    {
        "title": "Nespresso VertuoPlus Coffee and Espresso Machine",
        "description": "Single-serve coffee maker with Centrifusion technology. Brews 4 cup sizes at the touch of a button.",
        "price": 14999.00,
        "category": "Home & Kitchen",
        "image_url": "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600&q=80",
        "rating": 4.6,
        "stock": 18,
    },
    {
        "title": "Nike Air Zoom Pegasus 40 Running Shoes",
        "description": "Responsive cushioning and neutral support engineered for daily runs. Breathable engineered mesh upper.",
        "price": 9995.00,
        "category": "Fashion",
        "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
        "rating": 4.7,
        "stock": 30,
    },
    {
        "title": "Osprey Daylite Everyday Commuter Backpack",
        "description": "Lightweight, versatile daypack with dual side mesh pockets and interior sleeve for tablet or hydration pack.",
        "price": 4499.00,
        "category": "Fashion",
        "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
        "rating": 4.5,
        "stock": 40,
    },
    {
        "title": "The Pragmatic Programmer (20th Anniversary Edition)",
        "description": "Your journey to mastery. One of the most influential software development books ever written.",
        "price": 1850.00,
        "category": "Books",
        "image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80",
        "rating": 4.9,
        "stock": 50,
    },
]


def seed_database():
    db = SessionLocal()
    try:
        # Check existing count so we don't duplicate on re-runs
        existing_count = db.query(Product).count()
        if existing_count > 0:
            print(f"Database already contains {existing_count} products. Clearing old data for clean seed...")
            db.query(Product).delete()
            db.commit()

        print(f"Planting {len(SAMPLE_PRODUCTS)} sample products into pramazon.db...")
        for item_data in SAMPLE_PRODUCTS:
            product = Product(**item_data)
            db.add(product)

        db.commit()
        total_now = db.query(Product).count()
        print(f"Successfully seeded database! Total products now: {total_now}")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

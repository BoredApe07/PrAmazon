from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

# 1. Database Connection URL
# Connects to Neon Serverless PostgreSQL via PgBouncer pooled URL for high concurrency
DATABASE_URL = settings.DATABASE_URL_POOLED or settings.DATABASE_URL
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 2. Database Engine
# pool_pre_ping=True: Tests connection health before using it, preventing stale connection errors
# pool_recycle=300: Recycles connections every 5 minutes to maintain reliability with cloud firewalls
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
)

# 3. SessionLocal Factory
# Gives every request a fresh, isolated conversation with PostgreSQL
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Declarative Base
# All database models (Product, User, Order, OrderItem) inherit from this Base
Base = declarative_base()


# 5. The FastAPI Database Dependency
def get_db():
    """
    FastAPI Dependency:
    1. Opens a new database session for an incoming request.
    2. 'yields' it to the API endpoint to run queries.
    3. Guarantees the session is closed when the request finishes,
       even if an error occurs!
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

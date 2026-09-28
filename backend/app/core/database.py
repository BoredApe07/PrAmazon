import sqlite3
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker

# 1. Database Connection URL
# For SQLite, it connects to a local file called 'pramazon.db' in the backend folder.
# In Phase 7, upgrading to PostgreSQL is as simple as changing this one line:
# SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost:5432/pramazon"
SQLALCHEMY_DATABASE_URL = "sqlite:///./pramazon.db"

# 2. Database Engine
# Manages the actual low-level connection to the 'pramazon.db' file.
# 'check_same_thread=False' is needed ONLY for SQLite because FastAPI handles
# multiple web requests across different threads.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)


# SQLite PRAGMA Listener:
# Enforces Foreign Key constraints for every SQLite database connection.
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=30000")
        cursor.close()

# 3. SessionLocal Factory
# Every time we call SessionLocal(), it gives us a brand new conversation with the DB.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Declarative Base
# All our database models (Product, User, Order) will inherit from this Base class.
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

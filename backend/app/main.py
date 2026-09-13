from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base
from app.models import Product  # Ensure models are imported so Base registers them
from app.api.v1.api import api_router

# 1. Create database tables on startup if they don't exist yet
Base.metadata.create_all(bind=engine)

# 2. Initialize the FastAPI app with metadata
app = FastAPI(
    title="PrAmazon API",
    description="Backend REST API for PrAmazon e-commerce platform",
    version="0.1.0"
)

# 3. Configure CORS (Cross-Origin Resource Sharing)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Mount the Version 1 API Router
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def read_root():
    """Root endpoint: Welcomes visitors to the API."""
    return {
        "message": "Welcome to PrAmazon API!",
        "docs_url": "/docs",
        "health_check": "/api/health"
    }


@app.get("/api/health")
def health_check():
    """Health check endpoint: Allows frontend to verify backend connectivity."""
    return {
        "status": "online",
        "service": "PrAmazon Backend",
        "version": "0.1.0"
    }

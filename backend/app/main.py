from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Initialize the FastAPI app with metadata
app = FastAPI(
    title="PrAmazon API",
    description="Backend REST API for PrAmazon e-commerce platform",
    version="0.1.0"
)

# Configure CORS (Cross-Origin Resource Sharing)
# This allows our React frontend (running on a different port like 5173) to send requests to this API
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

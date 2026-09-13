from fastapi import APIRouter
from app.api.v1.endpoints import products

# Master router for API version 1
api_router = APIRouter()

# Register endpoint modules
api_router.include_router(products.router)
# In future phases, we will simply add:
# api_router.include_router(users.router)
# api_router.include_router(orders.router)

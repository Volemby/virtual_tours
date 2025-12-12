from fastapi import APIRouter
from app.api.v1.endpoints import tours

api_router = APIRouter()
api_router.include_router(tours.router, prefix="/tours", tags=["tours"])

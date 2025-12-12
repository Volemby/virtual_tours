from fastapi import APIRouter
from app.api.v1.endpoints import tours

from app.api.v1.endpoints import auth

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(tours.router, prefix="/tours", tags=["tours"])

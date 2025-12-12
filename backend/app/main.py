from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.api.v1.api import api_router

app = FastAPI(title=settings.PROJECT_NAME)

# CORS Config
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Static Mounts
# These serve the actual tour files and covers directly from disk
app.mount("/tours", StaticFiles(directory=settings.TOURS_DIR), name="tours")
app.mount("/covers", StaticFiles(directory=settings.COVERS_DIR), name="covers")

# Router
@app.get("/")
def root():
    return {"message": "Virtual Tours API is running"}

app.include_router(api_router, prefix=settings.API_V1_STR)

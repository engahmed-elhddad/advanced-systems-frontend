"""Advanced Systems – FastAPI Backend Entry Point"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.core.db import Base, engine
from app.api.v1 import products, search, brands, categories, rfq, suppliers, admin

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Advanced Systems API",
    description="Industrial automation marketplace API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
os.makedirs(settings.UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOADS_DIR), name="uploads")

# Routers
app.include_router(products.router, prefix="/api/v1", tags=["products"])
app.include_router(search.router, prefix="/api/v1", tags=["search"])
app.include_router(brands.router, prefix="/api/v1", tags=["brands"])
app.include_router(categories.router, prefix="/api/v1", tags=["categories"])
app.include_router(rfq.router, prefix="/api/v1", tags=["rfq"])
app.include_router(suppliers.router, prefix="/api/v1", tags=["suppliers"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "Advanced Systems API"}

"""Pydantic schemas for API request/response validation."""
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


# ── Common ────────────────────────────────────────────────────────────────────

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    per_page: int
    total_pages: int


# ── Brand ─────────────────────────────────────────────────────────────────────

class BrandCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None


class BrandRead(BrandCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Category ──────────────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None


class CategoryRead(CategoryCreate):
    id: int

    class Config:
        from_attributes = True


# ── Product ───────────────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    part_number: str
    brand_id: Optional[int] = None
    category_id: Optional[int] = None
    series: Optional[str] = None
    description: Optional[str] = None
    specifications: Optional[Dict[str, Any]] = {}
    condition: Optional[str] = "New"
    quantity: Optional[int] = 0
    availability: Optional[str] = "On Request"
    lead_time: Optional[str] = None


class ProductUpdate(BaseModel):
    brand_id: Optional[int] = None
    category_id: Optional[int] = None
    series: Optional[str] = None
    description: Optional[str] = None
    specifications: Optional[Dict[str, Any]] = None
    condition: Optional[str] = None
    quantity: Optional[int] = None
    availability: Optional[str] = None
    lead_time: Optional[str] = None


class ProductImageRead(BaseModel):
    id: int
    url: str
    is_primary: bool
    sort_order: int

    class Config:
        from_attributes = True


class DatasheetRead(BaseModel):
    id: int
    filename: str
    url: str

    class Config:
        from_attributes = True


class ProductRead(BaseModel):
    id: int
    part_number: str
    series: Optional[str] = None
    description: Optional[str] = None
    specifications: Optional[Dict[str, Any]] = {}
    condition: Optional[str] = None
    quantity: int
    availability: str
    lead_time: Optional[str] = None
    brand: Optional[BrandRead] = None
    category: Optional[CategoryRead] = None
    images: List[ProductImageRead] = []
    datasheets: List[DatasheetRead] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── RFQ ───────────────────────────────────────────────────────────────────────

class RFQCreate(BaseModel):
    part_number: str
    quantity: int = 1
    company: Optional[str] = None
    email: EmailStr
    country: Optional[str] = None
    message: Optional[str] = None


class RFQUpdate(BaseModel):
    status: Optional[str] = None
    response_price: Optional[str] = None
    response_lead_time: Optional[str] = None


class RFQRead(BaseModel):
    id: int
    part_number: str
    quantity: int
    company: Optional[str] = None
    email: str
    country: Optional[str] = None
    message: Optional[str] = None
    status: str
    response_price: Optional[str] = None
    response_lead_time: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Supplier ──────────────────────────────────────────────────────────────────

class SupplierCreate(BaseModel):
    name: str
    country: Optional[str] = None
    email: EmailStr
    website: Optional[str] = None
    notes: Optional[str] = None


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None
    email: Optional[EmailStr] = None
    website: Optional[str] = None
    notes: Optional[str] = None


class SupplierRead(BaseModel):
    id: int
    name: str
    country: Optional[str] = None
    email: str
    website: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

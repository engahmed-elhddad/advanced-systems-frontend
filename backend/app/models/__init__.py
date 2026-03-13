"""SQLAlchemy models for all database tables."""
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, JSON, Table
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.db import Base

# Association table: product ↔ supplier
product_supplier = Table(
    "product_supplier",
    Base.metadata,
    Column("product_id", Integer, ForeignKey("products.id", ondelete="CASCADE"), primary_key=True),
    Column("supplier_id", Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), primary_key=True),
)


class Brand(Base):
    __tablename__ = "brands"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    slug = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text)
    logo_url = Column(String(500))
    website = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    products = relationship("Product", back_populates="brand_rel", lazy="dynamic")


class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    slug = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text)
    icon = Column(String(10))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    products = relationship("Product", back_populates="category_rel", lazy="dynamic")


class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    country = Column(String(100))
    email = Column(String(200))
    website = Column(String(500))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    products = relationship("Product", secondary=product_supplier, back_populates="suppliers")


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True)
    part_number = Column(String(200), nullable=False, unique=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    series = Column(String(200))
    description = Column(Text)
    specifications = Column(JSON, default=dict)
    condition = Column(String(50), default="New")
    quantity = Column(Integer, default=0)
    availability = Column(String(100), default="On Request")
    lead_time = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    brand_rel = relationship("Brand", back_populates="products")
    category_rel = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    datasheets = relationship("Datasheet", back_populates="product", cascade="all, delete-orphan")
    suppliers = relationship("Supplier", secondary=product_supplier, back_populates="products")


class ProductImage(Base):
    __tablename__ = "product_images"
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    url = Column(String(500), nullable=False)
    is_primary = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    product = relationship("Product", back_populates="images")


class Datasheet(Base):
    __tablename__ = "datasheets"
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(300), nullable=False)
    url = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    product = relationship("Product", back_populates="datasheets")


class RFQ(Base):
    __tablename__ = "rfqs"
    id = Column(Integer, primary_key=True)
    part_number = Column(String(200), nullable=False)
    quantity = Column(Integer, default=1)
    company = Column(String(200))
    email = Column(String(200), nullable=False)
    country = Column(String(100))
    message = Column(Text)
    status = Column(String(50), default="pending", index=True)
    response_price = Column(String(200))
    response_lead_time = Column(String(200))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String(100), nullable=False, unique=True)
    email = Column(String(200), nullable=False, unique=True)
    hashed_password = Column(String(200), nullable=False)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

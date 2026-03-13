import axios from "axios";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Products
export const getProducts = (params: Record<string, unknown> = {}) =>
  api.get("/api/v1/products/", { params }).then((r) => r.data);

export const getFeaturedProducts = (limit = 8) =>
  api.get(`/api/v1/products/featured`, { params: { limit } }).then((r) => r.data);

export const getProductByPartNumber = (partNumber: string) =>
  api.get(`/api/v1/products/part/${encodeURIComponent(partNumber)}`).then((r) => r.data);

export const getProductBySlug = (slug: string) =>
  api.get(`/api/v1/products/slug/${encodeURIComponent(slug)}`).then((r) => r.data);

export const getProductById = (id: number) =>
  api.get(`/api/v1/products/${id}`).then((r) => r.data);

export const getRelatedProducts = (productId: number) =>
  api.get(`/api/v1/products/${productId}/related`).then((r) => r.data);

// Search
export const searchProducts = (params: { q: string; page?: number; size?: number; brand_id?: number; category_id?: number; availability?: string }) =>
  api.get("/api/v1/search/", { params }).then((r) => r.data);

export const suggestProducts = (q: string, limit = 8) =>
  api.get("/api/v1/search/autocomplete", { params: { q, limit } }).then((r) => r.data);

// Brands & Categories
export const getBrands = () => api.get("/api/v1/brands/").then((r) => r.data);
export const getBrand = (slug: string) =>
  api.get(`/api/v1/brands/${encodeURIComponent(slug)}`).then((r) => r.data);

export const getCategories = () => api.get("/api/v1/categories/").then((r) => r.data);
export const getCategory = (slug: string) =>
  api.get(`/api/v1/categories/${encodeURIComponent(slug)}`).then((r) => r.data);

// Suppliers
export const getSuppliers = () => api.get("/api/v1/suppliers/").then((r) => r.data);

// RFQ
export const submitRFQ = (data: Record<string, unknown>) =>
  api.post("/api/v1/rfq/", data).then((r) => r.data);

// Currency
export const getExchangeRate = () =>
  api.get("/api/currency/rate").then((r) => r.data);

export const convertCurrency = (amount: number, to = "EGP") =>
  api.get("/api/currency/convert", { params: { amount, to } }).then((r) => r.data);

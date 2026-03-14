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

/** Fetch product by part number, or generate SEO page if not in DB */
export const getProductOrGenerate = (partNumber: string) =>
  api.get(`/api/v1/products/part/${encodeURIComponent(partNumber)}/or-generate`).then((r) => r.data);

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

/** Instant RFQ – part_number, quantity, email, optional company, message */
export const submitInstantRFQ = (data: {
  part_number: string;
  quantity?: number;
  email: string;
  company?: string;
  message?: string;
}) =>
  api.post("/api/rfq/instant", {
    part_number: data.part_number,
    quantity: data.quantity ?? 1,
    email: data.email,
    company: data.company || undefined,
    message: data.message || undefined,
  }).then((r) => r.data);

/** List RFQs by email for dashboard */
export const getMyRfqs = (email: string) =>
  api.get("/api/rfq/my", { params: { email } }).then((r) => r.data);

// Currency
export const getExchangeRate = () =>
  api.get("/api/currency/rate").then((r) => r.data);

export const convertCurrency = (amount: number, to = "EGP") =>
  api.get("/api/currency/convert", { params: { amount, to } }).then((r) => r.data);

// Knowledge Graph
export const getKnowledgeGraph = (partNumber: string, limit = 12) =>
  api
    .get(`/product/${encodeURIComponent(partNumber)}/knowledge-graph`, { params: { limit } })
    .then((r) => r.data);

export const getProductsBySpecification = (
  specKey: string,
  specValue?: string,
  limit = 50
) =>
  api
    .get("/api/knowledge-graph/products-by-spec", {
      params: { spec_key: specKey, spec_value: specValue, limit },
    })
    .then((r) => r.data);

/** Vision AI: detect part number from product image */
export const detectProductFromImage = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/api/product-detect", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 30000,
  }).then((r) => r.data);
};

// BOM Analyzer
export const analyzeBom = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/api/bom/analyze", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 180000, // 3 min for large BOMs
  }).then((r) => r.data);
};

/** Request RFQ for entire BOM – items: [{part_number, quantity}], email, company? */
export const submitBomRfq = (data: {
  items: Array<{ part_number: string; quantity?: number }>;
  email: string;
  company?: string;
  contact_name?: string;
  country?: string;
  message?: string;
}) =>
  api.post("/api/bom/rfq", data).then((r) => r.data);

// Panel Builder
export const generatePanelBom = (params: {
  application?: string;
  motor_power_kw?: number;
  voltage?: string;
  control_type?: string;
}) =>
  api.post("/api/panel-builder/generate", {
    application: params.application ?? "motor_control",
    motor_power_kw: params.motor_power_kw ?? 5.5,
    voltage: params.voltage ?? "400V AC",
    control_type: params.control_type ?? "direct_on_line",
  }).then((r) => r.data);

export const getPanelBuilderOptions = () =>
  api.get("/api/panel-builder/options").then((r) => r.data);

// Programmatic SEO
export const getSeoUrls = (type: "products" | "brands" | "categories", page = 1, size = 5000) =>
  api.get("/api/seo/urls", { params: { type, page, size } }).then((r) => r.data);

import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Products
export const productsApi = {
  list: (params?: Record<string, any>) => api.get("/api/v1/products/", { params }),
  featured: (limit = 8) => api.get("/api/v1/products/featured", { params: { limit } }),
  bySlug: (slug: string) => api.get(`/api/v1/products/slug/${slug}`),
  byPartNumber: (pn: string) => api.get(`/api/v1/products/part/${encodeURIComponent(pn)}`),
  related: (id: number) => api.get(`/api/v1/products/${id}/related`),
};

// Backwards-compatible helpers used by app routes/pages
export const getProducts = (params?: Record<string, any>) =>
  productsApi.list(params).then((r) => r.data);

export const getFeaturedProducts = (limit = 8) =>
  productsApi.featured(limit).then((r) => r.data);

export const getProductByPartNumber = (partNumber: string) =>
  productsApi.byPartNumber(partNumber).then((r) => r.data);

export const getProductBySlug = (slug: string) =>
  productsApi.bySlug(slug).then((r) => r.data);

/** Fetch product by part number, or generate SEO page if not in DB */
export const getProductOrGenerate = (partNumber: string) =>
  api.get(`/api/v1/products/part/${encodeURIComponent(partNumber)}/or-generate`).then((r) => r.data);

// Search
export const searchApi = {
  search: (q: string, params?: Record<string, any>) =>
    api.get("/api/v1/search/", { params: { q, ...params } }),
  autocomplete: (q: string) => api.get("/api/v1/search/autocomplete", { params: { q } }),
};

export const suggestProducts = (q: string, limit = 8) =>
  searchApi.autocomplete(q).then((r) => r.data);

// Brands
export const brandsApi = {
  list: () => api.get("/api/v1/brands/"),
  bySlug: (slug: string) => api.get(`/api/v1/brands/${slug}`),
};

export const getBrands = () =>
  brandsApi.list().then((r) => r.data);

// Categories
export const categoriesApi = {
  list: () => api.get("/api/v1/categories/"),
  bySlug: (slug: string) => api.get(`/api/v1/categories/${slug}`),
};

// Backwards-compatible helpers used by app routes/pages
export const getCategories = () =>
  categoriesApi.list().then((r) => r.data);

// RFQ
export const rfqApi = {
  submit: (data: any) => api.post("/api/v1/rfq/", data),
  getByRef: (ref: string) => api.get(`/api/v1/rfq/${ref}`),
};

export const submitRFQ = (data: any) =>
  rfqApi.submit(data).then((r) => r.data);

// BOM Analyzer
export const analyzeBom = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return api
    .post("/api/bom/analyze", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    })
    .then((r) => r.data);
};

// Currency
export const currencyApi = {
  detect: () => api.get("/api/currency/detect"),
  convert: (amount: number, to: string) =>
    api.get("/api/currency/convert", { params: { amount, to } }),
  rate: () => api.get("/api/currency/rate"),
};

// Admin
export const adminApi = {
  login: (email: string, password: string) => {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    return api.post("/api/v1/admin/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  },
  dashboard: () => api.get("/api/v1/admin/dashboard"),
  setup: () => api.post("/api/v1/admin/setup"),
  products: {
    create: (data: any) => api.post("/api/v1/admin/products", data),
    update: (id: number, data: any) => api.put(`/api/v1/admin/products/${id}`, data),
    delete: (id: number) => api.delete(`/api/v1/admin/products/${id}`),
    uploadImage: (id: number, file: File, isPrimary = false) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("is_primary", String(isPrimary));
      return api.post(`/api/v1/admin/products/${id}/images`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    uploadDatasheet: (id: number, file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return api.post(`/api/v1/admin/products/${id}/datasheets`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
  },
  rfqs: {
    list: (params?: any) => api.get("/api/v1/admin/rfqs", { params }),
    update: (id: number, data: any) => api.put(`/api/v1/admin/rfqs/${id}`, data),
  },
  brands: {
    create: (data: any) => api.post("/api/v1/admin/brands", data),
    update: (id: number, data: any) => api.put(`/api/v1/admin/brands/${id}`, data),
    delete: (id: number) => api.delete(`/api/v1/admin/brands/${id}`),
  },
  categories: {
    create: (data: any) => api.post("/api/v1/admin/categories", data),
    update: (id: number, data: any) => api.put(`/api/v1/admin/categories/${id}`, data),
  },
  suppliers: {
    create: (data: any) => api.post("/api/v1/admin/suppliers", data),
    update: (id: number, data: any) => api.put(`/api/v1/admin/suppliers/${id}`, data),
    delete: (id: number) => api.delete(`/api/v1/admin/suppliers/${id}`),
    linkProduct: (supplierId: number, productId: number) =>
      api.post(`/api/v1/admin/suppliers/${supplierId}/products/${productId}`),
  },
  reindex: () => api.post("/api/v1/admin/search/reindex"),
};

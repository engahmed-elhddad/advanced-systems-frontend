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

// Search
export const searchApi = {
  search: (q: string, params?: Record<string, any>) =>
    api.get("/api/v1/search/", { params: { q, ...params } }),
  autocomplete: (q: string) => api.get("/api/v1/search/autocomplete", { params: { q } }),
};

// Brands
export const brandsApi = {
  list: () => api.get("/api/v1/brands/"),
  bySlug: (slug: string) => api.get(`/api/v1/brands/${slug}`),
};

// Categories
export const categoriesApi = {
  list: () => api.get("/api/v1/categories/"),
  bySlug: (slug: string) => api.get(`/api/v1/categories/${slug}`),
};

// RFQ
export const rfqApi = {
  submit: (data: any) => api.post("/api/v1/rfq/", data),
  getByRef: (ref: string) => api.get(`/api/v1/rfq/${ref}`),
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

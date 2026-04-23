import axios from "axios";
import type { RFQCreateInput, RFQResponse } from "@/types/rfq";
import { submitPublicRFQ } from "@/lib/rfqSubmit";
import { API_BASE_URL, normalizeHttpUrlForFetch, PRODUCTION_API_HOST } from "@/lib/constants";

// Single normalized origin from env (non-local hosts are forced to https in constants).
const API_BASE = API_BASE_URL;

/** Must match backend `require_tenant_id` default; production refuses missing header. */
const DEFAULT_TENANT_ID = "default";
const TENANT_ID = (process.env.NEXT_PUBLIC_TENANT_ID || DEFAULT_TENANT_ID).trim() || DEFAULT_TENANT_ID;
if (process.env.NODE_ENV !== "production" && TENANT_ID === DEFAULT_TENANT_ID) {
  console.warn(
    '[api] NEXT_PUBLIC_TENANT_ID is not set — using "default". Set it in .env.local for tenant-accurate requests.',
  );
}

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  // Belt-and-suspenders: never send http:// to the production API host from the browser.
  if (config.baseURL?.startsWith(`http://${PRODUCTION_API_HOST}`)) {
    config.baseURL = config.baseURL.replace(
      `http://${PRODUCTION_API_HOST}`,
      `https://${PRODUCTION_API_HOST}`,
    );
  }
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["X-Tenant-Id"] = TENANT_ID;
  // Default Content-Type is application/json; FormData must set multipart boundary automatically.
  if (config.data instanceof FormData) {
    delete (config.headers as Record<string, unknown>)["Content-Type"];
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const reqUrl = String(error.config?.url ?? "");
      if (!reqUrl.includes("/api/v1/admin/login")) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  },
);

/** Native fetch for RSC / routes; supports `next: { revalidate }` and attaches admin token in the browser. */
export function apiFetch(
  input: string | URL | globalThis.Request,
  init?: RequestInit
): Promise<Response> {
  let resolved: string | URL | globalThis.Request = input;
  if (typeof input === "string") {
    resolved = normalizeHttpUrlForFetch(input);
  } else if (input instanceof URL) {
    resolved = new URL(normalizeHttpUrlForFetch(input.toString()));
  }
  const headers = new Headers(init?.headers ?? undefined);
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  headers.set("X-Tenant-Id", TENANT_ID);
  return fetch(resolved, { ...init, headers });
}

/** Prefer FastAPI `detail` / `detail.message` over Axios's generic "Request failed with status code …". */
function messageFromAxiosResponseData(data: Record<string, unknown> | string | undefined): string | null {
  if (typeof data === "string" && data.trim()) return data;
  if (!data || typeof data !== "object") return null;
  const detail = (data as Record<string, unknown>).detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail) && detail.length) return String(detail[0]);
  if (detail && typeof detail === "object" && !Array.isArray(detail)) {
    const m = (detail as Record<string, unknown>).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return null;
}

/** True when backend returned 409 with duplicate `products.part_number` (see admin product create). */
export function isDuplicatePartNumberConflict(error: unknown): boolean {
  const e = error as { response?: { status?: number; data?: Record<string, unknown> } } | null;
  if (e?.response?.status !== 409) return false;
  const detail = e.response?.data?.detail;
  if (detail && typeof detail === "object" && !Array.isArray(detail)) {
    return (detail as Record<string, unknown>).constraint === "products.part_number";
  }
  return false;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error == null) return fallback;
  if (typeof error === "string" && error.trim()) return error;
  const e = error as Record<string, unknown>;
  const response = e.response as Record<string, unknown> | undefined;
  const data = response?.data as Record<string, unknown> | string | undefined;
  const fromBody = messageFromAxiosResponseData(
    typeof data === "object" && data !== null ? (data as Record<string, unknown>) : data
  );
  if (fromBody) return fromBody;

  const msg = e.message;
  if (typeof msg === "string" && msg.trim()) {
    const genericAxios = /^Request failed with status code \d+$/.test(msg);
    if (!genericAxios) return msg;
  }
  return fallback;
}

// Products
export const productsApi = {
  list: (params?: Record<string, any>) => api.get("/api/v1/products/", { params }),
  featured: (limit = 12) => api.get("/api/v1/products/featured", { params: { limit } }),
  bySlug: (slug: string) => api.get(`/api/v1/products/slug/${encodeURIComponent(slug)}`),
  byPartNumber: (pn: string) => api.get(`/api/v1/products/part/${encodeURIComponent(pn)}`),
  related: (id: number) => api.get(`/api/v1/products/${id}/related`),
};

// Backwards-compatible helpers used by app routes/pages
export const getProducts = (params?: Record<string, any>) =>
  productsApi.list(params).then((r) => r.data);

/** Featured products: v1 first, legacy monolith only as fallback */
export const getFeaturedProducts = async (limit = 12) => {
  try {
    const r = await productsApi.featured(limit)
    const data = r.data
    const products = data?.products ?? data?.items ?? (Array.isArray(data) ? data : [])
    return Array.isArray(products) ? products : []
  } catch {
    try {
      const r = await api.get("/api/v1/products/", { params: { page: 1, size: limit, is_featured: true } })
      const d = r.data
      const items = d?.items ?? []
      return Array.isArray(items) ? items : []
    } catch {
      const r = await api.get("/api/products", { params: { limit, page: 1 } })
      const d = r.data
      return d?.products ?? d?.items ?? []
    }
  }
}

export const getProductByPartNumber = (partNumber: string) =>
  productsApi.byPartNumber(partNumber).then((r) => r.data);

export const getProductBySlug = (slug: string) =>
  productsApi.bySlug(slug).then((r) => r.data);

/** Fetch product by part number, or generate SEO page if not in DB */
export const getProductOrGenerate = (partNumber: string) =>
  api.get(`/api/v1/products/part/${encodeURIComponent(partNumber)}/or-generate`).then((r) => r.data);

/** RSC helper: DB product first, then or-generate fallback. */
export async function getProduct(partNumber: string): Promise<Record<string, unknown> | null> {
  const pn = partNumber.trim();
  if (!pn) return null;
  try {
    const p = await getProductByPartNumber(pn);
    if (p && typeof p === "object" && ("part_number" in p || "partNumber" in p)) {
      return p as Record<string, unknown>;
    }
  } catch {
    /* try generate */
  }
  try {
    const g = await getProductOrGenerate(pn);
    if (g && typeof g === "object" && ("part_number" in g || "partNumber" in g)) {
      return g as Record<string, unknown>;
    }
  } catch {
    /* */
  }
  return null;
}

// Search
export const searchApi = {
  search: (q: string, params?: Record<string, any>) =>
    api.get("/api/v1/search/", { params: { q, ...params } }),
  autocomplete: (q: string) => api.get("/api/v1/search/autocomplete", { params: { q } }),
};

export const suggestProducts = (q: string, limit = 8) =>
  searchApi.autocomplete(q).then((r) => r.data);

/** Client search helper: returns Meilisearch-shaped payload (`hits` / `products` / `items`). */
export async function searchProductsSimple(
  q: string,
  size: number,
  page: number
): Promise<unknown> {
  const { data } = await searchApi.search(q, { page, size });
  return data;
}

// Brands
export const brandsApi = {
  list: () => api.get("/api/v1/brands/"),
  bySlug: (slug: string) => api.get(`/api/v1/brands/${encodeURIComponent(slug)}`),
  categoriesForSlug: (slug: string) =>
    api.get(`/api/v1/brands/${encodeURIComponent(slug)}/categories`),
};

export const getBrands = () =>
  brandsApi.list().then((r) => r.data);

export const getBrandBySlug = (slug: string) =>
  brandsApi.bySlug(slug).then((r) => r.data);

export const getBrandCategories = (slug: string) =>
  brandsApi.categoriesForSlug(slug).then((r) => r.data);

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

export const submitRFQ = (data: RFQCreateInput): Promise<RFQResponse> =>
  submitPublicRFQ(data);

/** Instant RFQ */
export const submitInstantRFQ = async (data: {
  part_number: string
  quantity?: number
  email: string
  company?: string
  message?: string
}) => {
  const body = {
    part_number: data.part_number,
    quantity: data.quantity ?? 1,
    email: data.email,
    company: data.company || undefined,
    message: data.message || undefined,
  }
  try {
    const r = await api.post("/api/v1/rfq/instant", body)
    return r.data
  } catch {
    const r = await api.post("/api/rfq/instant", body)
    return r.data
  }
}

export const getMyRfqs = async (email: string) => {
  try {
    const r = await api.get("/api/v1/rfq/instant/by-email", { params: { email } })
    return r.data
  } catch {
    const r = await api.get("/api/rfq/my", { params: { email } })
    return r.data
  }
}

/** Vision AI: detect part number from image */
export const detectProductFromImage = async (file: File) => {
  const fd = new FormData()
  fd.append("file", file)
  try {
    const r = await api.post("/api/v1/product-detect", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 30000,
    })
    return r.data
  } catch {
    const r = await api.post("/api/product-detect", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 30000,
    })
    return r.data
  }
}

/** BOM RFQ */
export const submitBomRfq = (data: {
  items: Array<{ part_number: string; quantity?: number }>
  email: string
  company?: string
  contact_name?: string
  country?: string
  message?: string
}) => {
  const tryV1 = () =>
    api.post("/api/v1/bom/rfq", {
      items: data.items.map((i) => ({
        part_number: i.part_number,
        quantity: i.quantity ?? 1,
      })),
      email: data.email,
      company: data.company,
      contact_name: data.contact_name,
      country: data.country,
      message: data.message,
    })
  return tryV1()
    .then((r) => r.data)
    .catch(() => api.post("/api/bom/rfq", data).then((r) => r.data))
}

/** Panel Builder */
export const generatePanelBom = (params: {
  application?: string
  motor_power_kw?: number
  voltage?: string
  control_type?: string
}) => {
  const body = {
    application: params.application ?? "motor_control",
    motor_power_kw: params.motor_power_kw ?? 5.5,
    voltage: params.voltage ?? "400V AC",
    control_type: params.control_type ?? "direct_on_line",
  }
  return api
    .post("/api/v1/panel-builder/generate", body)
    .then((r) => r.data)
    .catch(() => api.post("/api/panel-builder/generate", body).then((r) => r.data))
}

export const getPanelBuilderOptions = () =>
  api
    .get("/api/v1/panel-builder/options")
    .then((r) => r.data)
    .catch(() => api.get("/api/panel-builder/options").then((r) => r.data))

// BOM Analyzer
export const analyzeBom = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return api
    .post("/api/v1/bom/analyze", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    })
    .then((r) => r.data)
    .catch(() =>
      api
        .post("/api/bom/analyze", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 120000,
        })
        .then((r) => r.data)
    );
};

// Currency
export const currencyApi = {
  detect: () =>
    api.get("/api/v1/currency/detect").catch(() => api.get("/api/currency/detect")),
  convert: (amount: number, to: string) =>
    api
      .get("/api/v1/currency/convert", { params: { amount, to } })
      .catch(() => api.get("/api/currency/convert", { params: { amount, to } })),
  rate: () =>
    api.get("/api/v1/currency/rate").catch(() => api.get("/api/currency/rate")),
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
    delete: (id: number, headers?: { "If-Match"?: string }) =>
      api.delete(`/api/v1/admin/products/${id}`, { headers: headers ?? {} }),
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

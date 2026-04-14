"use client";

import { apiFetch } from "@/lib/api";
import { getAuthHeaders } from "@/lib/admin-auth";

const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

type ApiResult<T> = { ok: true; data: T } | { ok: false; message: string; status: number };

async function parseJsonSafe(res: { json: () => Promise<any> }) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function backendErrorMessage(payload: Record<string, unknown>): string {
  const d = payload?.detail;
  if (typeof d === "string" && d.trim()) return d;
  if (Array.isArray(d) && d.length > 0) {
    const first = d[0] as Record<string, unknown> | string;
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && typeof first.msg === "string") return first.msg;
  }
  const m = payload?.message;
  if (typeof m === "string" && m.trim()) return m;
  return "Request failed";
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { ...getAuthHeaders(), ...(init?.headers as Record<string, string> | undefined) };
  const res = await apiFetch(`${API}${path}`, { ...init, headers });
  const payload = await parseJsonSafe(res);
  if (!res.ok) {
    const message = backendErrorMessage(payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {});
    return { ok: false, message, status: res.status };
  }
  return { ok: true, data: payload as T };
}

export type AdminProductListItem = {
  id?: number;
  part_number: string;
  name?: string;
  brand?: string;
};

export type AdminProductImage = {
  id: string;
  url: string;
  thumbnail_url?: string | null;
  medium_url?: string | null;
  is_primary: boolean;
  sort_order?: number | null;
};

export type AdminProductDetail = {
  id?: number;
  part_number: string;
  name?: string;
  brand?: string;
  description?: string | null;
  series?: string | null;
  image_url?: string | null;
  images?: AdminProductImage[];
  specs?: Record<string, string | null>;
  specs_meta?: Record<string, { value: string | null; confidence: string; source: string; verified?: boolean }>;
};

export async function fetchAdminProducts(params: { page: number; size: number; search?: string }) {
  const q = new URLSearchParams({
    page: String(params.page),
    size: String(params.size),
    ...(params.search ? { search: params.search } : {}),
  });
  return request<{ items: AdminProductListItem[]; total: number; page: number; size: number; pages: number }>(
    `/api/v1/products/?${q.toString()}`
  );
}

export async function fetchAdminDashboardSummary() {
  const productsRes = await fetchAdminProducts({ page: 1, size: 1 });
  if (!productsRes.ok) return productsRes;
  const recentRes = await fetchAdminProducts({ page: 1, size: 5 });
  if (!recentRes.ok) return recentRes;
  return {
    ok: true as const,
    data: {
      total_products: productsRes.data.total || 0,
      recent_uploads: recentRes.data.items || [],
      status: "healthy",
    },
  };
}

export async function fetchAdminProductDetail(partNumber: string) {
  const detailRes = await request<AdminProductDetail>(`/api/v1/products/${encodeURIComponent(partNumber)}`);
  if (!detailRes.ok) return detailRes;
  const listRes = await fetchAdminProducts({ page: 1, size: 10, search: partNumber });
  if (!listRes.ok) return { ok: true as const, data: detailRes.data };
  const match = (listRes.data.items || []).find(
    (item) => (item.part_number || "").trim().toUpperCase() === partNumber.trim().toUpperCase()
  );
  return { ok: true as const, data: { ...detailRes.data, id: match?.id, name: detailRes.data.name || match?.name, brand: detailRes.data.brand || match?.brand } };
}

export async function updateAdminProduct(productId: number, body: Record<string, unknown>) {
  return request(`/api/v1/admin/products/${productId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function uploadAdminProductImages(partNumber: string, files: File[]) {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  const headers = getAuthHeaders();
  delete headers["Content-Type"];
  const res = await apiFetch(`${API}/api/v1/admin/products/${encodeURIComponent(partNumber)}/images`, {
    method: "POST",
    headers,
    body: form,
  });
  const payload = await parseJsonSafe(res);
  return { ok: res.ok, status: res.status, data: payload };
}

export async function reorderAdminProductImages(
  partNumber: string,
  order: Array<{ image_id: string; sort_order: number }>
) {
  return request(`/api/v1/admin/products/${encodeURIComponent(partNumber)}/images/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ order }),
  });
}

export async function setAdminProductPrimaryImage(partNumber: string, imageId: string) {
  return request(`/api/v1/admin/products/${encodeURIComponent(partNumber)}/images/${encodeURIComponent(imageId)}/primary`, {
    method: "PATCH",
  });
}

export async function deleteAdminProductImage(partNumber: string, imageId: string) {
  return request(`/api/v1/admin/products/${encodeURIComponent(partNumber)}/images/${encodeURIComponent(imageId)}`, {
    method: "DELETE",
  });
}

export async function uploadProductsCsv(file: File, strict = false) {
  const form = new FormData();
  form.append("file", file);
  form.append("strict", String(strict));
  const headers = getAuthHeaders();
  delete headers["Content-Type"];
  const res = await apiFetch(`${API}/api/v1/admin/products/import`, {
    method: "POST",
    headers,
    body: form,
  });
  const payload = await parseJsonSafe(res);
  return { ok: res.ok, status: res.status, data: payload };
}

export async function previewAiEnrichment(partNumber: string, forceReenrich = false) {
  return request<{
    part_number: string;
    enriched: boolean;
    updated_fields: string[];
    skipped_fields: Array<{ field: string; reason: string; confidence?: string }>;
    proposed_changes?: {
      description?: { value: string; confidence: string; source: string };
      series?: { value: string; confidence: string; source: string };
      specs?: Record<string, { value: string; confidence: string; source: string; verified?: boolean }>;
    };
  }>(`/api/v1/product/enrich`, {
    method: "POST",
    body: JSON.stringify({
      part_number: partNumber,
      preview_only: true,
      force_reenrich: forceReenrich,
    }),
  });
}

export async function applyAiEnrichment(
  partNumber: string,
  applyFields: string[],
  forceReenrich = false
) {
  return request<{
    part_number: string;
    enriched: boolean;
    updated_fields: string[];
    skipped_fields: Array<{ field: string; reason: string; confidence?: string }>;
  }>(`/api/v1/product/enrich`, {
    method: "POST",
    body: JSON.stringify({
      part_number: partNumber,
      preview_only: false,
      force_reenrich: forceReenrich,
      apply_fields: applyFields,
    }),
  });
}

export type AnalyticsDailyPoint = {
  date: string;
  visits: number;
  leads: number;
  rfqs?: number;
  unique_visitors?: number;
};

export type AnalyticsSummary = {
  total_visits: number;
  product_views: number;
  quote_clicks: number;
  whatsapp_clicks: number;
  rfq_submits: number;
  conversion_rate: number;
  /** Distinct `visitor_id` with `page_view` in period (first-party tracking). */
  unique_visitors: number;
  /** RFQ rows created in period (`rfqs` table). */
  total_rfqs_period: number;
  /** `total_rfqs_period` / `unique_visitors` when visitors > 0. */
  rfq_conversion_rate: number;
  daily: AnalyticsDailyPoint[];
};

export async function fetchAnalyticsSummary(days = 14) {
  return request<AnalyticsSummary>(`/api/v1/analytics/summary?days=${days}`);
}

// —— Brands & categories (admin catalog) ——————————————————————————

export type AdminBrandRow = {
  id: number;
  name: string;
  slug: string;
  logo_url?: string | null;
  description?: string | null;
  website?: string | null;
  country?: string | null;
  product_count?: number;
};

export type AdminCategoryRow = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  image_url?: string | null;
  parent_id?: number | null;
  product_count?: number;
};

export async function fetchAdminBrands() {
  return request<AdminBrandRow[]>(`/api/v1/admin/brands`);
}

export async function createAdminBrand(body: Record<string, unknown>) {
  return request<AdminBrandRow>(`/api/v1/admin/brands`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAdminBrand(id: number, body: Record<string, unknown>) {
  return request<AdminBrandRow>(`/api/v1/admin/brands/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteAdminBrand(id: number) {
  return request<{ message: string }>(`/api/v1/admin/brands/${id}`, { method: "DELETE" });
}

export async function fetchAdminCategories() {
  return request<AdminCategoryRow[]>(`/api/v1/admin/categories`);
}

export async function createAdminCategory(body: Record<string, unknown>) {
  return request<AdminCategoryRow>(`/api/v1/admin/categories`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAdminCategory(id: number, body: Record<string, unknown>) {
  return request<AdminCategoryRow>(`/api/v1/admin/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteAdminCategory(id: number) {
  return request<{ message: string }>(`/api/v1/admin/categories/${id}`, { method: "DELETE" });
}

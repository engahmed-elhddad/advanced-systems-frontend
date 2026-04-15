import axios from 'axios'
import toast from 'react-hot-toast'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useDataTableQuery } from '@/lib/dataTable/useDataTableQuery'
import * as productService from '@/features/products/services'
import type { Product, ProductListParams } from '@/types/product'

export function useProducts(params: ProductListParams) {
  const query = useQuery({
    queryKey: ['products', params],
    queryFn: () => productService.getProducts(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })

  const items = query.data?.items ?? []

  return {
    products: items as Product[],
    total: query.data?.total ?? 0,
    pages: query.data?.pages ?? 1,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}

export type AdminProductStatus = 'Active' | 'Draft'

export type AdminProductSpec = {
  key: string
  value: string
}

export type AdminProduct = {
  id: number
  name: string
  brandId: string
  categoryId: string
  brand: string
  category: string
  description: string
  specs: AdminProductSpec[]
  imageUrl: string
  datasheetUrl: string
  status: AdminProductStatus
  /** Weak ETag from admin list/detail for If-Match deletes */
  _etag?: string
}

export type AdminProductFormInput = {
  name: string
  brandId: string
  categoryId: string
  description: string
  specs: AdminProductSpec[]
  imageUrl: string
  datasheetUrl: string
  status: AdminProductStatus
}

type BrandRow = { id: number; name: string }
type CategoryRow = { id: number; name: string }

async function fetchBrands(): Promise<BrandRow[]> {
  const res = await api.get('/api/v1/brands/')
  const raw = res.data
  if (Array.isArray(raw)) return raw
  return raw?.brands ?? []
}

async function fetchCategories(): Promise<CategoryRow[]> {
  const res = await api.get('/api/v1/categories/')
  const raw = res.data
  if (Array.isArray(raw)) return raw
  return raw?.categories ?? []
}

async function resolveBrandCategoryIds(input: AdminProductFormInput) {
  const selectedBrandId = Number(input.brandId)
  const selectedCategoryId = Number(input.categoryId)
  if (Number.isFinite(selectedBrandId) && Number.isFinite(selectedCategoryId)) {
    return { brandId: selectedBrandId, categoryId: selectedCategoryId }
  }
  const [brands, categories] = await Promise.all([fetchBrands(), fetchCategories()])
  const brandId = brands.find((b) => String(b.id) === input.brandId)?.id
  const categoryId = categories.find((c) => String(c.id) === input.categoryId)?.id
  return { brandId, categoryId }
}

function toApiStatus(status: AdminProductStatus): { is_active: boolean; availability: string } {
  return status === 'Active'
    ? { is_active: true, availability: 'in_stock' }
    : { is_active: false, availability: 'draft' }
}

function fromApiStatus(row: any): AdminProductStatus {
  if (typeof row?.is_active === 'boolean') return row.is_active ? 'Active' : 'Draft'
  const availability = String(row?.availability ?? '').toLowerCase()
  return availability.includes('draft') ? 'Draft' : 'Active'
}

function normalizeProduct(row: any): AdminProduct {
  const specsRaw = row?.specs
  const specs: AdminProductSpec[] = Array.isArray(specsRaw)
    ? specsRaw.map((s: any) => ({
        key: String(s?.key ?? ''),
        value: String(s?.value ?? ''),
      }))
    : specsRaw && typeof specsRaw === 'object'
      ? Object.entries(specsRaw).map(([key, value]) => ({ key, value: String(value ?? '') }))
      : []

  const brandName =
    typeof row?.brand === 'string'
      ? row.brand
      : row?.brand?.name || row?.brand_name || ''

  const categoryName =
    typeof row?.category === 'string'
      ? row.category
      : row?.category?.name || row?.category_name || ''

  return {
    id: Number(row?.id ?? 0),
    name: String(row?.name || row?.part_number || `Product ${row?.id ?? ''}`).trim(),
    brandId: String(
      row?.brand_id ??
        row?.brand?.id ??
        ''
    ),
    categoryId: String(
      row?.category_id ??
        row?.category?.id ??
        ''
    ),
    brand: String(brandName || 'Unknown'),
    category: String(categoryName || 'Uncategorized'),
    description: String(row?.description || ''),
    specs,
    imageUrl: String(row?.image_url || row?.main_image_url || row?.images?.[0]?.url || ''),
    datasheetUrl: String(row?.datasheet_url || ''),
    status: fromApiStatus(row),
    _etag: typeof row?._etag === 'string' && row._etag.trim() ? row._etag : undefined,
  }
}

/** Product ids from bulk-delete 412 `detail.conflicts` if present */
export function conflictProductIdsFromError(err: unknown): number[] {
  if (!axios.isAxiosError(err)) return []
  const d = err.response?.data as { detail?: unknown } | undefined
  const detail = d?.detail
  if (!detail || typeof detail !== 'object' || Array.isArray(detail)) return []
  const conflicts = (detail as { conflicts?: unknown }).conflicts
  if (!Array.isArray(conflicts)) return []
  const ids: number[] = []
  for (const c of conflicts) {
    if (c && typeof c === 'object' && 'id' in c) {
      const n = Number((c as { id: unknown }).id)
      if (Number.isFinite(n)) ids.push(n)
    }
  }
  return ids
}

async function requestFirstSuccess<T>(paths: string[], config?: any): Promise<T> {
  let lastErr: unknown = null
  for (const path of paths) {
    try {
      const res = await api.request<T>({ url: path, ...config })
      return res.data
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr
}

function unwrapAdminEnvelope(raw: unknown): { inner: Record<string, unknown>; meta: Record<string, unknown> } {
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const o = raw as { data: Record<string, unknown>; meta?: Record<string, unknown> }
    return { inner: o.data ?? {}, meta: o.meta ?? {} }
  }
  return { inner: (raw as Record<string, unknown>) ?? {}, meta: {} }
}

async function getAdminProducts(
  params: { page?: number; size?: number; search?: string },
  signal?: AbortSignal,
) {
  const page = params.page ?? 1
  const size = params.size ?? 50
  const search = params.search?.trim() || undefined

  try {
    const res = await api.get('/api/v1/admin/products', {
      params: { page, per_page: size, size, search, sort: 'newest' },
      signal,
    })
    const { inner: data, meta } = unwrapAdminEnvelope(res.data)
    const rows = data?.items ?? data?.products ?? data?.results ?? []
    const items = Array.isArray(rows) ? rows.map(normalizeProduct) : []
    const total = Number(data?.total ?? items.length)
    const dataVersion = typeof meta.data_version === 'string' ? meta.data_version : undefined
    return { items, total, dataVersion }
  } catch (err) {
    const isCanceled =
      signal?.aborted ||
      (typeof err === 'object' &&
        err !== null &&
        (err as { code?: string; name?: string }).code === 'ERR_CANCELED')
    if (isCanceled) throw err
    return requestFirstSuccess<{ items?: unknown[]; products?: unknown[]; results?: unknown[]; total?: number }>(
      ['/api/v1/products/'],
      {
        method: 'GET',
        params: { page, per_page: size, size, search },
        signal,
      },
    ).then((raw) => {
      const { inner: data, meta } = unwrapAdminEnvelope(raw)
      const rows = data?.items ?? data?.products ?? data?.results ?? []
      const items = Array.isArray(rows) ? rows.map(normalizeProduct) : []
      const total = Number(data?.total ?? items.length)
      const dataVersion = typeof meta.data_version === 'string' ? meta.data_version : undefined
      return { items, total, dataVersion }
    })
  }
}

async function getAdminProductById(id: number): Promise<AdminProduct | null> {
  const rows = await getAdminProducts({ page: 1, size: 200 })
  return rows.items.find((p) => p.id === id) ?? null
}

async function createAdminProduct(input: AdminProductFormInput) {
  const { brandId, categoryId } = await resolveBrandCategoryIds(input)
  const statusPayload = toApiStatus(input.status)
  const autoPartNumber = input.name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28)
  const pn = `${autoPartNumber || 'PRODUCT'}-${Date.now().toString().slice(-5)}`
  const payload = {
    part_number: pn,
    name: input.name,
    brand_id: brandId ?? null,
    category_id: categoryId ?? null,
    description: input.description || null,
    image_url: input.imageUrl || null,
    stock_quantity: 1,
    specs: input.specs.map((s) => ({ key: s.key, value: s.value })),
    ...statusPayload,
  }
  return requestFirstSuccess<any>(['/api/v1/admin/products', '/api/v1/products'], {
    method: 'POST',
    data: payload,
  })
}

async function updateAdminProduct(id: number, input: AdminProductFormInput) {
  const { brandId, categoryId } = await resolveBrandCategoryIds(input)
  const statusPayload = toApiStatus(input.status)
  const payload = {
    name: input.name,
    brand_id: brandId ?? null,
    category_id: categoryId ?? null,
    description: input.description || null,
    image_url: input.imageUrl || null,
    specs: input.specs.map((s) => ({ key: s.key, value: s.value })),
    ...statusPayload,
  }
  return requestFirstSuccess<any>(
    [`/api/v1/admin/products/${id}`, `/api/v1/products/${id}`],
    { method: 'PUT', data: payload }
  )
}

async function deleteAdminProduct(id: number, etag: string) {
  return requestFirstSuccess<any>(
    [`/api/v1/admin/products/${id}`, `/api/v1/products/${id}`],
    { method: 'DELETE', headers: { 'If-Match': etag } }
  )
}

export function useAdminProducts(params: { page?: number; size?: number; search?: string }) {
  return useDataTableQuery({
    queryKey: ['admin-products', params],
    queryFn: ({ signal }) => getAdminProducts(params, signal),
    gcTime: 5 * 60_000,
  })
}

export function useAdminProduct(productId: number) {
  return useQuery({
    queryKey: ['admin-product', productId],
    queryFn: () => getAdminProductById(productId),
    enabled: Number.isFinite(productId) && productId > 0,
    staleTime: 30_000,
  })
}

export function useCreateAdminProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAdminProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
  })
}

export function useUpdateAdminProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: AdminProductFormInput }) =>
      updateAdminProduct(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['admin-product', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
  })
}

type AdminProductsCache = { items: AdminProduct[]; total: number; dataVersion?: string }

export function useDeleteAdminProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, etag }: { id: number; etag: string }) => deleteAdminProduct(id, etag),
    onMutate: async ({ id: deletedId }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-products'] })
      const snapshots = queryClient.getQueriesData<AdminProductsCache>({ queryKey: ['admin-products'] })
      snapshots.forEach(([key, data]) => {
        if (!data?.items) return
        queryClient.setQueryData<AdminProductsCache>(key, {
          ...data,
          items: data.items.filter((p) => p.id !== deletedId),
          total: Math.max(0, Number(data.total ?? data.items.length) - 1),
          dataVersion: undefined,
        })
      })
      return { snapshots }
    },
    onError: (err, _vars, ctx) => {
      ctx?.snapshots?.forEach(([key, data]) => {
        if (data !== undefined) queryClient.setQueryData(key, data)
      })
      if (axios.isAxiosError(err)) {
        const s = err.response?.status
        if (s === 412 || s === 428) {
          toast.error('This item was modified or deleted. Refresh and try again.')
          void queryClient.invalidateQueries({ queryKey: ['admin-products'] })
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
  })
}

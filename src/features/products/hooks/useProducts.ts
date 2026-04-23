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
    staleTime: 120_000,
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
  /** Create only: optional manual part number; blank uses auto-generated value from name + suffix. */
  partNumber?: string
  brandId: string
  categoryId: string
  description: string
  specs: AdminProductSpec[]
  /** Remote image URL only (https/http). Never data: or blob: — use `imageFile` for uploads. */
  imageUrl: string
  datasheetUrl: string
  status: AdminProductStatus
  /** Pending local file; uploaded via multipart after product save. */
  imageFile?: File | null
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
  const brandTrim = input.brandId?.trim() ?? ''
  const categoryTrim = input.categoryId?.trim() ?? ''
  const selectedBrandId = Number(brandTrim)
  const selectedCategoryId = Number(categoryTrim)
  // ``Number('')`` is ``0``; do not treat empty selection as id 0 (FK violation on create).
  const brandOk =
    brandTrim !== '' && Number.isFinite(selectedBrandId) && selectedBrandId > 0
  const categoryOk =
    categoryTrim !== '' && Number.isFinite(selectedCategoryId) && selectedCategoryId > 0
  if (brandOk && categoryOk) {
    return { brandId: selectedBrandId, categoryId: selectedCategoryId }
  }
  const [brands, categories] = await Promise.all([fetchBrands(), fetchCategories()])
  const brandId = brands.find((b) => String(b.id) === brandTrim)?.id
  const categoryId = categories.find((c) => String(c.id) === categoryTrim)?.id
  if (brandTrim !== '' && brandId === undefined) {
    throw new Error('Could not resolve brand. Refresh the page or pick a brand from the list.')
  }
  if (categoryTrim !== '' && categoryId === undefined) {
    throw new Error('Could not resolve category. Refresh the page or pick a category from the list.')
  }
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
    imageUrl: String(row?.image_url ?? '').trim(),
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
}

/** ISS-07: fetch a single product by id directly — no bulk list load. */
async function getAdminProductById(id: number): Promise<AdminProduct | null> {
  try {
    const res = await api.get<unknown>(`/api/v1/admin/products/${id}`)
    const { inner } = unwrapAdminEnvelope(res.data)
    return normalizeProduct(inner)
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null
    throw err
  }
}

/** Only pass real remote URLs to JSON `image_url` — never data:/blob: strings. */
function normalizeImageUrlForApi(url: string): string | null {
  const t = (url ?? '').trim()
  if (!t) return null
  if (t.startsWith('data:') || t.startsWith('blob:')) return null
  return t
}

function extractProductIdFromResponse(data: unknown): number | undefined {
  if (!data || typeof data !== 'object') return undefined
  const o = data as Record<string, unknown>
  if (typeof o.id === 'number' && Number.isFinite(o.id)) return o.id
  if (typeof o.id === 'string' && /^\d+$/.test(o.id)) return parseInt(o.id, 10)
  const inner = o.data
  if (inner && typeof inner === 'object') {
    const id = (inner as { id?: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
    if (typeof id === 'string' && /^\d+$/.test(id)) return parseInt(id, 10)
  }
  return undefined
}

/** POST /api/v1/admin/products/{product_id}/images — `file` + `is_primary` match FastAPI `File` / `Form`. */
async function uploadProductPrimaryImage(productId: number, file: File) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('is_primary', 'true')
  // Axios rejects non-2xx; no silent failure.
  const res = await api.post<unknown>(`/api/v1/admin/products/${productId}/images`, fd)
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console -- temporary upload verification
    console.info('[admin product image upload]', { productId, status: res.status, data: res.data })
  }
  return res
}

async function createAdminProduct(input: AdminProductFormInput) {
  const { brandId, categoryId } = await resolveBrandCategoryIds(input)
  const wantsActive = input.status === 'Active'
  /** Publish rules require an image when active; create draft first if we must upload a file then activate. */
  const initialStatus =
    input.imageFile && wantsActive ? toApiStatus('Draft') : toApiStatus(input.status)
  const trimmedManualPn = input.partNumber?.trim()
  const autoPartNumber = input.name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28)
  const pn =
    trimmedManualPn ||
    `${autoPartNumber || 'PRODUCT'}-${Date.now().toString().slice(-5)}`
  const payload = {
    part_number: pn,
    name: input.name,
    brand_id: brandId ?? null,
    category_id: categoryId ?? null,
    description: input.description || null,
    image_url: normalizeImageUrlForApi(input.imageUrl),
    datasheet_url: input.datasheetUrl?.trim() || null,
    stock_quantity: 1,
    specs: input.specs.map((s) => ({ key: s.key, value: s.value })),
    ...initialStatus,
  }
  const res = await api.post<unknown>('/api/v1/admin/products', payload)
  const productId = extractProductIdFromResponse(res.data)

  if (input.imageFile) {
    if (productId == null) {
      throw new Error(
        'Product was created but the response did not include a numeric id; image upload was skipped.',
      )
    }
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console -- temporary upload verification
      console.info('[admin create product] uploading image for product id', productId)
    }
    try {
      await uploadProductPrimaryImage(productId, input.imageFile)
    } catch (uploadErr) {
      let rolledBack = false
      try {
        await api.delete(`/api/v1/admin/products/${productId}`)
        rolledBack = true
      } catch (rollbackErr) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console -- orphan cleanup failure
          console.error('[admin create product] rollback delete failed', rollbackErr)
        }
      }
      const msg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr)
      if (rolledBack) {
        throw new Error(
          `Product was not saved — image upload failed: ${msg}. The draft product was removed.`,
        )
      }
      throw new Error(
        `Product was not saved — image upload failed: ${msg}. A draft may still exist (id ${productId}); delete it from the admin list if you see a partial product.`,
      )
    }
    if (wantsActive) {
      try {
        await api.put(`/api/v1/admin/products/${productId}`, {
          is_active: true,
          availability: 'in_stock',
        })
      } catch {
        throw new Error(
          'Product created but could not be activated. Check the product list and activate manually.',
        )
      }
    }
  }
  return res.data
}

async function updateAdminProduct(id: number, input: AdminProductFormInput) {
  const { brandId, categoryId } = await resolveBrandCategoryIds(input)
  const statusPayload = toApiStatus(input.status)
  const payload = {
    name: input.name,
    brand_id: brandId ?? null,
    category_id: categoryId ?? null,
    description: input.description || null,
    image_url: normalizeImageUrlForApi(input.imageUrl),
    datasheet_url: input.datasheetUrl?.trim() || null,
    specs: input.specs.map((s) => ({ key: s.key, value: s.value })),
    ...statusPayload,
  }
  /** Upload file before PUT so publish-readiness sees the new image when status is Active. */
  if (input.imageFile) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console -- temporary upload verification
      console.info('[admin update product] uploading image for product id', id)
    }
    try {
      await uploadProductPrimaryImage(id, input.imageFile)
    } catch (uploadErr) {
      throw uploadErr instanceof Error
        ? new Error(`Image upload failed for product ${id}: ${uploadErr.message}`)
        : uploadErr
    }
  }
  const res = await api.put<unknown>(`/api/v1/admin/products/${id}`, payload)
  return res.data
}

async function deleteAdminProduct(id: number, etag: string) {
  const res = await api.delete<unknown>(`/api/v1/admin/products/${id}`, {
    headers: { 'If-Match': etag },
  })
  return res.data
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

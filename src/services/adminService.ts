import { api } from '@/lib/api'
import { getAuthHeaders } from '@/lib/admin-auth'
import type { RFQDetail, RFQListResponse, RFQUpdateInput } from '@/types/rfq'

function authConfig() {
  return { headers: getAuthHeaders() }
}

export async function getAdminRFQs(params: {
  status?: string
  size?: number
}): Promise<RFQListResponse> {
  const query: Record<string, string | number> = { size: params.size ?? 100 }
  if (params.status) query.status = params.status
  const res = await api.get<RFQListResponse>('/api/v1/admin/rfq', {
    params: query,
    ...authConfig(),
  })
  return res.data
}

export async function updateAdminRFQ(
  rfqId: number,
  data: RFQUpdateInput,
): Promise<RFQDetail> {
  const res = await api.patch<RFQDetail>(
    `/api/v1/admin/rfq/${rfqId}`,
    data,
    authConfig(),
  )
  return res.data
}

interface RFQStatsResponse {
  total: number
  pending: number
  quoted: number
  closed: number
  cancelled: number
  by_status: Record<string, number>
}

export async function getAdminRFQStats(): Promise<RFQStatsResponse> {
  const res = await api.get<RFQStatsResponse>('/api/v1/admin/rfq/stats', authConfig())
  return res.data
}

interface EnrichStatsResponse {
  total: number
  enriched: number
  unenriched: number
  percent_enriched: number
}

export async function getEnrichStats(): Promise<EnrichStatsResponse> {
  const res = await api.get<EnrichStatsResponse>('/api/v1/admin/enrich/stats', authConfig())
  return res.data
}

interface EnrichProductResponse {
  status: string
  part_number: string
  updated_fields: string[]
  skipped_fields: Array<{ field: string; reason: string }>
}

export async function enrichProduct(productId: number): Promise<EnrichProductResponse> {
  const res = await api.post<EnrichProductResponse>(
    `/api/v1/admin/enrich/${productId}`,
    {},
    authConfig(),
  )
  return res.data
}

interface EnrichBatchResponse {
  status: string
  queued_count: number
  note: string
}

export async function enqueueBatch(params: {
  limit?: number
  force?: boolean
  brand?: string
}): Promise<EnrichBatchResponse> {
  const res = await api.post<EnrichBatchResponse>(
    '/api/v1/admin/enrich/batch',
    params,
    authConfig(),
  )
  return res.data
}

// ── Review Workflow ──────────────────────────────────────────────────────────

export interface CreateProductInput {
  part_number: string
  name: string
  brand_id: number
  category_id: number
  stock_quantity: number
  image_url?: string
  description?: string
  availability?: string
}

export interface CreateProductResponse {
  id: number
  part_number: string
  slug: string
  review_status: string
}

export async function createProduct(data: CreateProductInput): Promise<CreateProductResponse> {
  const res = await api.post<CreateProductResponse>('/api/v1/admin/products', data, authConfig())
  return res.data
}

export interface GenerateAIResponse {
  product_id: number
  part_number: string
  ai_description: string | null
  ai_short_title: string | null
  ai_specs: Record<string, unknown> | null
  status: string
}

export async function generateAIDraft(productId: number): Promise<GenerateAIResponse> {
  const res = await api.post<GenerateAIResponse>(
    `/api/v1/admin/review/${productId}/generate-ai`,
    {},
    authConfig(),
  )
  return res.data
}

export interface ApproveAIResponse {
  product_id: number
  part_number: string
  review_status: string
  fields_copied: string[]
}

export async function approveAIDraft(productId: number): Promise<ApproveAIResponse> {
  const res = await api.post<ApproveAIResponse>(
    `/api/v1/admin/review/${productId}/approve-ai`,
    {},
    authConfig(),
  )
  return res.data
}

export async function rejectAIDraft(productId: number): Promise<{ status: string }> {
  const res = await api.post<{ status: string }>(
    `/api/v1/admin/review/${productId}/reject-ai`,
    {},
    authConfig(),
  )
  return res.data
}

export async function approveManual(productId: number): Promise<{ review_status: string }> {
  const res = await api.post<{ review_status: string }>(
    `/api/v1/admin/review/${productId}/approve-manual`,
    {},
    authConfig(),
  )
  return res.data
}

export async function uploadProductImage(
  productId: number,
  file: File,
): Promise<{ id: number; image_url: string }> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await api.post<{ id: number; image_url: string }>(
    `/api/v1/admin/products/${productId}/images?is_primary=true`,
    fd,
    { headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' } },
  )
  return res.data
}

// ── Bulk Ingestion Pipeline ──────────────────────────────────────────────────

// Populated from validation_complete event metadata after upload
export interface ValidationInsights {
  valid_rows: number
  invalid_rows: number
  duplicate_rows: number
  duplicate_rows_existing: number
  duplicate_rows_within_job: number
  quality_score: number
  field_error_counts: Record<string, number>
  brand_resolution_rate: number
  category_resolution_rate: number
  description_coverage: number
  negative_or_invalid_stock_rows: number
  required_field_missing_counts: Record<string, number>
}

export interface JobDurations {
  parse_seconds: number | null
  validation_seconds: number | null
  review_wait_seconds: number | null
  publish_seconds: number | null
  total_seconds: number | null
}

export interface IngestionJob {
  id: number
  filename: string
  status: string
  total_rows: number
  valid_rows: number
  invalid_rows: number
  processed_rows: number
  failed_rows: number
  quality_score: number | null
  durations: JobDurations | null
  insights: ValidationInsights | null  // populated after validation_complete
  created_at: string | null
}

export interface StagedRow {
  id: number
  row_number: number
  part_number: string | null
  brand_raw: string | null
  brand_id: number | null
  category_raw: string | null
  category_id: number | null
  stock_quantity: number
  description: string | null
  image_url: string | null
  price: number | null
  status: string
  validation_errors: Array<{ field: string; error: string }>
}

export interface UploadResponse {
  job_id: number
  filename: string
  total_rows: number
  valid_rows: number
  invalid_rows: number
  status: string
}

export interface JobDetailResponse {
  job: IngestionJob
  status_counts: Record<string, number>
  rows: StagedRow[]
  total_rows_filtered: number
  page: number
  per_page: number
}

export interface BulkActionResponse {
  action: string
  affected: number
  status_counts: Record<string, number>
  job_status: string
}

export interface PublishResponse {
  published: number
  errors: Array<{ row: number; error: string }>
  job_status: string
}

export async function getIngestionJobs(params?: {
  page?: number
  per_page?: number
  status?: string
}): Promise<{ items: IngestionJob[]; total: number; page: number; per_page: number }> {
  const query: Record<string, string | number> = {}
  if (params?.page) query.page = params.page
  if (params?.per_page) query.per_page = params.per_page
  if (params?.status) query.status = params.status
  const res = await api.get<{ items: IngestionJob[]; total: number; page: number; per_page: number }>(
    '/api/v1/admin/ingestion/jobs',
    { params: query, ...authConfig() },
  )
  return res.data
}

export async function uploadIngestionFile(file: File): Promise<UploadResponse> {
  const fd = new FormData()
  fd.append('file', file)
  const headers = getAuthHeaders()
  delete headers['Content-Type']
  const res = await api.post<UploadResponse>('/api/v1/admin/ingestion/upload', fd, {
    headers: { ...headers },
    timeout: 120000,
  })
  return res.data
}

export async function getIngestionJobDetail(
  jobId: number,
  params?: { page?: number; per_page?: number; row_status?: string; search?: string },
): Promise<JobDetailResponse> {
  const query: Record<string, string | number> = {}
  if (params?.page) query.page = params.page
  if (params?.per_page) query.per_page = params.per_page
  if (params?.row_status) query.row_status = params.row_status
  if (params?.search?.trim()) query.search = params.search.trim()
  const res = await api.get<JobDetailResponse>(
    `/api/v1/admin/ingestion/jobs/${jobId}`,
    { params: query, ...authConfig() },
  )
  return res.data
}

export async function ingestionBulkAction(
  jobId: number,
  action: 'approve_all_valid' | 'approve_selected' | 'reject_selected' | 'delete_job',
  rowIds?: number[],
): Promise<BulkActionResponse> {
  const res = await api.post<BulkActionResponse>(
    `/api/v1/admin/ingestion/jobs/${jobId}/actions`,
    { action, row_ids: rowIds ?? [] },
    authConfig(),
  )
  return res.data
}

export async function editStagedRow(
  rowId: number,
  data: {
    part_number?: string
    brand?: string
    category?: string
    stock_quantity?: number
    description?: string
    image_url?: string
    price?: number
  },
): Promise<StagedRow> {
  const res = await api.patch<StagedRow>(
    `/api/v1/admin/ingestion/rows/${rowId}`,
    data,
    authConfig(),
  )
  return res.data
}

export async function publishIngestionJob(jobId: number): Promise<PublishResponse> {
  const res = await api.post<PublishResponse>(
    `/api/v1/admin/ingestion/jobs/${jobId}/publish`,
    {},
    authConfig(),
  )
  return res.data
}

// ── Ingestion Dashboard (Observability) ──────────────────────────────────────

export interface PerformanceAverages {
  avg_parse_seconds: number | null
  avg_validation_seconds: number | null
  avg_review_wait_seconds: number | null
  avg_publish_seconds: number | null
  avg_total_seconds: number | null
}

export interface IngestionOverview {
  total_jobs: number
  total_rows_processed: number
  total_published_jobs: number
  overall_success_rate: number
  avg_quality_score: number | null
  performance_averages: PerformanceAverages
}

export interface DailyMetric {
  day: string
  total_jobs: number
  total_rows: number
  valid_rows: number
  invalid_rows: number
  success_rate: number
  completed_jobs: number
  failed_jobs: number
  avg_parse_seconds: number | null
  avg_validation_seconds: number | null
  avg_review_wait_seconds: number | null
  avg_publish_seconds: number | null
}

export interface IngestionWarning {
  type: string
  severity: string
  message: string
  details: Array<Record<string, unknown>>
}

export interface IngestionEventItem {
  id: number
  job_id: number | null
  event_type: string
  actor_id: number | null
  metadata: Record<string, unknown>
  created_at: string | null
}

export interface TopValidationError {
  field: string
  error: string
  count: number
}

export interface IngestionDashboardResponse {
  overview: IngestionOverview
  recent_jobs: IngestionJob[]
  daily_metrics: DailyMetric[]
  warnings: IngestionWarning[]
  top_validation_errors: TopValidationError[]
  recent_events: IngestionEventItem[]
}

export async function getIngestionDashboard(): Promise<IngestionDashboardResponse> {
  const res = await api.get<IngestionDashboardResponse>(
    '/api/v1/admin/ingestion/dashboard',
    authConfig(),
  )
  return res.data
}

// ── B2B Dashboard ─────────────────────────────────────────────────────────────

export interface B2BQuotationSummary {
  id: number
  customer_id: number
  customer_name: string
  status: string
  total_amount: number
  created_at: string
}

export interface B2BOrderSummary {
  id: number
  customer_id: number
  customer_name: string
  status: string
  total_amount: number
  created_at: string
}

export interface B2BInvoiceSummary {
  id: number
  order_id: number
  customer_name: string
  invoice_number: string | null
  status: string
  total_amount: number
  created_at: string
}

export interface B2BDashboardResponse {
  kpis: {
    revenue_today: number
    revenue_month: number
    active_orders: number
    unpaid_invoices: number
    low_stock_products: number
  }
  recent_quotations: B2BQuotationSummary[]
  recent_orders: B2BOrderSummary[]
  recent_invoices: B2BInvoiceSummary[]
  alerts: {
    stale_orders: B2BOrderSummary[]
    unpaid_invoice_list: B2BInvoiceSummary[]
    low_stock_items: Array<{ product_id: number; part_number: string; available: number }>
  }
}

export async function getB2BDashboard(): Promise<B2BDashboardResponse> {
  const res = await api.get<B2BDashboardResponse>(
    '/api/v1/admin/b2b/dashboard',
    authConfig(),
  )
  return res.data
}

export async function getB2BKpis(): Promise<B2BDashboardResponse['kpis']> {
  const res = await api.get<B2BDashboardResponse['kpis']>(
    '/api/v1/admin/b2b/dashboard/kpis',
    authConfig(),
  )
  return res.data
}

// ── Orders Management ──────────────────────────────────────────────────────────

export type B2BOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'delivered'
  | 'cancelled'

export interface OrdersListItem {
  id: number
  customer_id: number
  customer_name: string
  customer_email?: string | null
  customer_phone?: string | null
  status: B2BOrderStatus | string
  total_amount: number
  created_at: string
}

export interface OrderDetailItem {
  id: number
  product_id: number | null
  description: string
  quantity: number
  unit_price: number
  line_total: number
}

export interface OrderDetail {
  id: number
  quotation_id: number
  customer_id: number
  customer_name: string
  customer_email?: string | null
  customer_phone?: string | null
  customer_company?: string | null
  status: B2BOrderStatus | string
  total_amount: number
  created_at: string
  updated_at?: string | null
  items: OrderDetailItem[]
}

export interface OrderTimelineEvent {
  id: number
  type: string
  title: string
  message?: string | null
  actor?: string | null
  created_at: string
}

export interface OrderNote {
  id: number
  note: string
  created_by?: string | null
  created_at: string
}

export interface AddOrderNoteInput {
  note: string
}

export async function getOrders(params?: {
  status?: string
  page?: number
  per_page?: number
}): Promise<{ items: OrdersListItem[]; total: number }> {
  const query: Record<string, string | number> = {}
  if (params?.status) query.status = params.status
  if (params?.page) query.page = params.page
  if (params?.per_page) query.per_page = params.per_page

  const res = await api.get<{ items: OrdersListItem[]; total: number }>(
    '/api/v1/admin/b2b/orders',
    { params: query, ...authConfig() },
  )
  return res.data
}

export async function getOrderById(orderId: number): Promise<OrderDetail> {
  const res = await api.get<OrderDetail>(
    `/api/v1/admin/b2b/orders/${orderId}`,
    authConfig(),
  )
  return res.data
}

export async function setOrderStatus(
  orderId: number,
  status: B2BOrderStatus,
): Promise<OrderDetail> {
  const res = await api.patch<OrderDetail>(
    `/api/v1/admin/b2b/orders/${orderId}/status`,
    { status },
    authConfig(),
  )
  return res.data
}

export async function getOrderTimeline(orderId: number): Promise<OrderTimelineEvent[]> {
  const res = await api.get<OrderTimelineEvent[]>(
    `/api/v1/admin/b2b/orders/${orderId}/timeline`,
    authConfig(),
  )
  return res.data
}

export async function getOrderNotes(orderId: number): Promise<OrderNote[]> {
  const res = await api.get<OrderNote[]>(
    `/api/v1/admin/b2b/orders/${orderId}/notes`,
    authConfig(),
  )
  return res.data
}

export async function addOrderNote(
  orderId: number,
  payload: AddOrderNoteInput,
): Promise<OrderNote> {
  const res = await api.post<OrderNote>(
    `/api/v1/admin/b2b/orders/${orderId}/notes`,
    payload,
    authConfig(),
  )
  return res.data
}

// ── Quotations Management ──────────────────────────────────────────────────────

export interface B2BCustomerOption {
  id: number
  name: string
  company_name: string
  email?: string | null
  phone?: string | null
}

export interface QuotationItemInput {
  product_id: number | null
  description: string
  quantity: number
  unit_price: number
}

export interface QuotationItemDetail extends QuotationItemInput {
  id: number
  line_total: number
}

export interface QuotationDetail {
  id: number
  customer_id: number
  customer_name?: string
  status: 'draft' | 'sent' | 'approved' | 'rejected' | string
  total_amount: number
  notes?: string | null
  valid_until?: string | null
  items: QuotationItemDetail[]
  created_at: string
  updated_at?: string | null
}

export interface QuotationListItem {
  id: number
  customer_id: number
  customer_name?: string
  total_amount: number
  status: 'draft' | 'sent' | 'approved' | 'rejected' | string
  created_at: string
}

export interface CreateQuotationPayload {
  customer_id: number
  notes?: string
  valid_until?: string
  items: QuotationItemInput[]
}

export interface UpdateQuotationPayload {
  notes?: string
  valid_until?: string
  items?: QuotationItemInput[]
}

export async function getB2BCustomers(): Promise<B2BCustomerOption[]> {
  const res = await api.get<B2BCustomerOption[]>(
    '/api/v1/admin/b2b/customers',
    authConfig(),
  )
  return res.data
}

export async function getQuotations(params?: {
  status?: string
  page?: number
  per_page?: number
}): Promise<{ items: QuotationListItem[]; total: number }> {
  const query: Record<string, string | number> = {}
  if (params?.status) query.status = params.status
  if (params?.page) query.page = params.page
  if (params?.per_page) query.per_page = params.per_page

  const res = await api.get<QuotationListItem[]>(
    '/api/v1/admin/b2b/quotations',
    {
      params: query,
      ...authConfig(),
    },
  )
  const items = res.data
  return {
    items,
    total: items.length,
  }
}

export async function getQuotationById(quotationId: number): Promise<QuotationDetail> {
  const res = await api.get<QuotationDetail>(
    `/api/v1/admin/b2b/quotations/${quotationId}`,
    authConfig(),
  )
  return res.data
}

export async function createQuotation(
  payload: CreateQuotationPayload,
): Promise<QuotationDetail> {
  const res = await api.post<QuotationDetail>(
    '/api/v1/admin/b2b/quotations',
    payload,
    authConfig(),
  )
  return res.data
}

export async function updateQuotation(
  quotationId: number,
  payload: UpdateQuotationPayload,
): Promise<QuotationDetail> {
  const res = await api.patch<QuotationDetail>(
    `/api/v1/admin/b2b/quotations/${quotationId}`,
    payload,
    authConfig(),
  )
  return res.data
}

export async function sendQuotation(
  quotationId: number,
): Promise<QuotationDetail> {
  const res = await api.post<QuotationDetail>(
    `/api/v1/admin/b2b/quotations/${quotationId}/send`,
    {},
    authConfig(),
  )
  return res.data
}

export async function approveQuotation(
  quotationId: number,
): Promise<QuotationDetail> {
  const res = await api.post<QuotationDetail>(
    `/api/v1/admin/b2b/quotations/${quotationId}/approve`,
    {},
    authConfig(),
  )
  return res.data
}

export async function rejectQuotation(
  quotationId: number,
): Promise<QuotationDetail> {
  const res = await api.post<QuotationDetail>(
    `/api/v1/admin/b2b/quotations/${quotationId}/reject`,
    {},
    authConfig(),
  )
  return res.data
}

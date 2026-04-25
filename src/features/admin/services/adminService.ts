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
  brand_confidence?: number | null
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
  quality_score: number | null
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

// ── Orders Management ──────────────────────────────────────────────────────────

/** Matches DB check constraint on b2b_orders.status (no processing/ready). */
export type B2BOrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled'

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

/** Row shape from GET /api/v1/admin/b2b/orders (list or detail). */
export interface B2BOrderApiRow {
  id: number
  quotation_id: number
  customer_id: number
  status: string
  total_amount: number
  items: OrderDetailItem[]
  created_at: string
  updated_at?: string | null
  customer_name?: string | null
  customer_company?: string | null
  customer_email?: string | null
  customer_phone?: string | null
}

function mapB2BOrderApiToListItem(o: B2BOrderApiRow): OrdersListItem {
  return {
    id: o.id,
    customer_id: o.customer_id,
    customer_name: o.customer_name?.trim() || `Customer #${o.customer_id}`,
    customer_email: o.customer_email,
    customer_phone: o.customer_phone,
    status: o.status,
    total_amount: o.total_amount,
    created_at: o.created_at,
  }
}

function mapB2BOrderApiToDetail(o: B2BOrderApiRow): OrderDetail {
  return {
    id: o.id,
    quotation_id: o.quotation_id,
    customer_id: o.customer_id,
    customer_name: o.customer_name?.trim() || `Customer #${o.customer_id}`,
    customer_company: o.customer_company ?? null,
    customer_email: o.customer_email ?? null,
    customer_phone: o.customer_phone ?? null,
    status: o.status,
    total_amount: o.total_amount,
    created_at: o.created_at,
    updated_at: o.updated_at,
    items: o.items ?? [],
  }
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

  const res = await api.get<B2BOrderApiRow[]>('/api/v1/admin/b2b/orders', {
    params: query,
    ...authConfig(),
  })
  const rows = Array.isArray(res.data) ? res.data : []
  const items = rows.map(mapB2BOrderApiToListItem)
  return { items, total: items.length }
}

export async function getOrderById(orderId: number): Promise<OrderDetail> {
  const res = await api.get<B2BOrderApiRow>(`/api/v1/admin/b2b/orders/${orderId}`, authConfig())
  return mapB2BOrderApiToDetail(res.data)
}

/** Backend: POST …/confirm (pending → confirmed). */
export async function confirmB2BOrder(orderId: number): Promise<OrderDetail> {
  const res = await api.post<B2BOrderApiRow>(
    `/api/v1/admin/b2b/orders/${orderId}/confirm`,
    {},
    authConfig(),
  )
  return mapB2BOrderApiToDetail(res.data)
}

/** Backend: POST …/cancel (pending → cancelled). */
export async function cancelB2BOrder(orderId: number): Promise<OrderDetail> {
  const res = await api.post<B2BOrderApiRow>(
    `/api/v1/admin/b2b/orders/${orderId}/cancel`,
    {},
    authConfig(),
  )
  return mapB2BOrderApiToDetail(res.data)
}

/** Backend: POST …/deliver (confirmed → delivered). */
export async function deliverB2BOrder(orderId: number): Promise<OrderDetail> {
  const res = await api.post<B2BOrderApiRow>(
    `/api/v1/admin/b2b/orders/${orderId}/deliver`,
    {},
    authConfig(),
  )
  return mapB2BOrderApiToDetail(res.data)
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

// ── CRM Leads ───────────────────────────────────────────────────────────────

export type CrmLeadStatus = 'new' | 'contacted' | 'quoted' | 'won' | 'lost'

/** API may still surface legacy values until fully migrated — treat as string when unknown */
export type CrmNextAction = 'call_now' | 'send_whatsapp' | 'send_quote' | 'follow_up_later'

export type CrmUrgency = 'high' | 'medium' | 'low'

/** @deprecated use CrmNextAction */
export type CrmSuggestedAction = CrmNextAction

export type LeadClassification = 'cold' | 'warm' | 'hot'

export interface CrmLead {
  id: number
  name: string
  company: string | null
  role: string | null
  phone: string | null
  email: string | null
  source: string | null
  status: string
  notes: string | null
  rfq_id: number | null
  rfq_reference: string | null
  visitor_id?: string | null
  lead_score?: number | null
  lead_classification?: LeadClassification | string | null
  /** Same as lead_classification — cold | warm | hot */
  lead_priority?: LeadClassification | string | null
  last_activity_at?: string | null
  hours_since_last_activity?: number | null
  needs_follow_up?: boolean
  needs_attention?: boolean
  next_action?: CrmNextAction | string | null
  urgency?: CrmUrgency | string | null
  next_action_reason?: string | null
  /** Same as next_action */
  suggested_action?: CrmNextAction | string | null
  /** Same as next_action_reason */
  suggested_action_reason?: string | null
  /** RFQs matching visitor / email / linked id (same scope as activity API) */
  rfq_count?: number
  created_at: string
  updated_at: string | null
}

export interface LeadActivityEventRow {
  id: number
  type: string
  occurred_at: string
  metadata: Record<string, unknown>
  session_id?: string | null
  country?: string | null
}

export interface LeadActivityRfqRow {
  id: number
  reference: string
  part_number: string
  quantity: number
  status: string
  created_at: string
  email?: string | null
}

export interface LeadActivityResponse {
  lead_id: number
  visitor_id: string | null
  events: LeadActivityEventRow[]
  rfqs: LeadActivityRfqRow[]
}

export interface CrmLeadListResponse {
  items: CrmLead[]
  total: number
  page: number
  size: number
}

export type CrmLeadCreateInput = {
  name: string
  company?: string
  role?: string
  phone?: string
  email?: string
  source?: string
  status?: CrmLeadStatus
  notes?: string
  rfq_id?: number
  rfq_reference?: string
}

export type CrmLeadUpdateInput = Partial<CrmLeadCreateInput> & {
  rfq_reference?: string
  link_latest_rfq_by_email?: boolean
}

export async function getAdminLeadStats(): Promise<{ total: number; by_status: Record<string, number> }> {
  const res = await api.get<{ total: number; by_status: Record<string, number> }>(
    '/api/v1/admin/leads/stats',
    authConfig(),
  )
  return res.data
}

export type AdminLeadSort =
  | 'score_desc'
  | 'created_at_desc'
  | 'last_activity_desc'
  | 'last_activity_asc'

export async function getAdminLeads(params: {
  page?: number
  size?: number
  status?: string
  sort?: AdminLeadSort
  /** Server scans up to CRM_ATTENTION_SCAN_MAX leads, then filters */
  needs_attention?: boolean
}): Promise<CrmLeadListResponse> {
  const sp = new URLSearchParams()
  sp.set('page', String(params.page ?? 1))
  sp.set('size', String(params.size ?? 100))
  if (params.status) sp.set('status', params.status)
  sp.set('sort', params.sort ?? 'score_desc')
  if (params.needs_attention === true) sp.set('needs_attention', 'true')
  const res = await api.get<CrmLeadListResponse>(`/api/v1/admin/leads?${sp.toString()}`, authConfig())
  return res.data
}

export async function getAdminLead(leadId: number): Promise<CrmLead> {
  const res = await api.get<CrmLead>(`/api/v1/admin/leads/${leadId}`, authConfig())
  return res.data
}

export async function createAdminLead(body: CrmLeadCreateInput): Promise<CrmLead> {
  const res = await api.post<CrmLead>('/api/v1/admin/leads', body, authConfig())
  return res.data
}

export async function updateAdminLead(leadId: number, body: CrmLeadUpdateInput): Promise<CrmLead> {
  const res = await api.patch<CrmLead>(`/api/v1/admin/leads/${leadId}`, body, authConfig())
  return res.data
}

export async function deleteAdminLead(leadId: number): Promise<void> {
  await api.delete(`/api/v1/admin/leads/${leadId}`, authConfig())
}

export async function getAdminLeadActivity(leadId: number): Promise<LeadActivityResponse> {
  const res = await api.get<LeadActivityResponse>(
    `/api/v1/admin/leads/${leadId}/activity`,
    authConfig(),
  )
  return res.data
}

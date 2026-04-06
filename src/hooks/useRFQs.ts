import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type RfqUiStatus = 'New' | 'Contacted' | 'Quoted' | 'Closed'

export type RfqTimelineEvent = {
  id: number
  eventType: string
  actor: string
  note: string
  fromStatus: string
  toStatus: string
  createdAt: string
}

export type AdminRfq = {
  id: number
  reference: string
  name: string
  email: string
  phone: string
  product: string
  quantity: number
  message: string
  status: RfqUiStatus
  notes: string
  assignedTo: string
  lastContactedAt: string
  date: string
}

type RfqListResponse = {
  rfqs?: any[]
  items?: any[]
  total?: number
}

function toUiStatus(raw: string): RfqUiStatus {
  const v = (raw || '').toLowerCase()
  if (v === 'quoted') return 'Quoted'
  if (v === 'closed' || v === 'cancelled') return 'Closed'
  if (v === 'in_progress' || v === 'contacted') return 'Contacted'
  return 'New'
}

function toApiStatus(status: RfqUiStatus): string {
  switch (status) {
    case 'Quoted':
      return 'quoted'
    case 'Closed':
      return 'closed'
    case 'Contacted':
      return 'contacted'
    default:
      return 'new'
  }
}

function normalizeRfq(row: any): AdminRfq {
  const created = row?.created_at ? new Date(row.created_at) : null
  return {
    id: Number(row?.id ?? 0),
    reference: String(row?.reference || ''),
    name: String(row?.contact_name || row?.name || row?.email || 'Unknown'),
    email: String(row?.email || ''),
    phone: String(row?.phone || '-'),
    product: String(row?.part_number || row?.product || 'N/A'),
    quantity: Number(row?.quantity ?? 0),
    message: String(row?.message || ''),
    status: toUiStatus(String(row?.status || 'pending')),
    notes: String(row?.notes || row?.admin_notes || ''),
    assignedTo: String(row?.assigned_to || ''),
    lastContactedAt: row?.last_contacted_at ? String(row.last_contacted_at) : '',
    date: created ? created.toLocaleDateString() : '—',
  }
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

async function getRFQs(params: { page?: number; size?: number; status?: string }) {
  const data = await requestFirstSuccess<RfqListResponse>(
    ['/api/v1/admin/rfq', '/api/v1/admin/rfqs', '/api/v1/rfqs'],
    {
      method: 'GET',
      params: { page: params.page ?? 1, size: params.size ?? 50, status: params.status || undefined },
    }
  )
  const rows = data.rfqs ?? data.items ?? []
  const items = Array.isArray(rows) ? rows.map(normalizeRfq) : []
  return { items, total: Number(data.total ?? items.length) }
}

async function getRFQById(id: number): Promise<AdminRfq | null> {
  const data = await requestFirstSuccess<any>(
    [`/api/v1/admin/rfq/${id}`, `/api/v1/admin/rfqs/${id}`, `/api/v1/rfqs/${id}`],
    { method: 'GET' }
  )
  if (!data) return null
  return normalizeRfq(data)
}

async function updateRFQStatus(id: number, status: RfqUiStatus) {
  return requestFirstSuccess<any>(
    [`/api/v1/admin/rfq/${id}`, `/api/v1/admin/rfqs/${id}`, `/api/v1/rfqs/${id}`],
    {
      method: 'PATCH',
      data: { status: toApiStatus(status) },
    }
  )
}

async function updateRFQDetails(input: { id: number; status?: RfqUiStatus; assignedTo?: string }) {
  const payload: Record<string, string> = {}
  if (input.status) payload.status = toApiStatus(input.status)
  if (typeof input.assignedTo !== 'undefined') payload.assigned_to = input.assignedTo
  return requestFirstSuccess<any>(
    [`/api/v1/admin/rfq/${input.id}`, `/api/v1/admin/rfqs/${input.id}`, `/api/v1/rfqs/${input.id}`],
    { method: 'PATCH', data: payload }
  )
}

async function addRFQNote(input: { id: number; note: string }) {
  return requestFirstSuccess<any>(
    [`/api/v1/admin/rfq/${input.id}/note`, `/api/v1/admin/rfqs/${input.id}/note`],
    { method: 'POST', data: { note: input.note } }
  )
}

function normalizeTimelineEvent(row: any): RfqTimelineEvent {
  return {
    id: Number(row?.id ?? 0),
    eventType: String(row?.event_type || row?.eventType || 'event'),
    actor: String(row?.actor || 'system'),
    note: String(row?.note || ''),
    fromStatus: String(row?.from_status || ''),
    toStatus: String(row?.to_status || ''),
    createdAt: String(row?.created_at || row?.createdAt || ''),
  }
}

async function getRFQTimeline(id: number): Promise<RfqTimelineEvent[]> {
  const data = await requestFirstSuccess<any[]>(
    [`/api/v1/admin/rfq/${id}/timeline`, `/api/v1/admin/rfqs/${id}/timeline`],
    { method: 'GET' }
  )
  return Array.isArray(data) ? data.map(normalizeTimelineEvent) : []
}

export function useRFQs(params: { page?: number; size?: number; status?: string }) {
  return useQuery({
    queryKey: ['admin-rfqs', params],
    queryFn: () => getRFQs(params),
    staleTime: 20_000,
    gcTime: 5 * 60_000,
  })
}

export function useRFQ(id: number) {
  return useQuery({
    queryKey: ['admin-rfq', id],
    queryFn: () => getRFQById(id),
    enabled: Number.isFinite(id) && id > 0,
    staleTime: 20_000,
  })
}

export function useUpdateRFQStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: RfqUiStatus }) => updateRFQStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-rfqs'] })
      await queryClient.cancelQueries({ queryKey: ['admin-rfq', id] })

      const listSnapshots = queryClient.getQueriesData<{ items: AdminRfq[]; total: number }>({
        queryKey: ['admin-rfqs'],
      })
      const detailSnapshot = queryClient.getQueryData<AdminRfq | null>(['admin-rfq', id])

      listSnapshots.forEach(([key, value]) => {
        if (!value) return
        queryClient.setQueryData(key, {
          ...value,
          items: value.items.map((item) => (item.id === id ? { ...item, status } : item)),
        })
      })

      if (detailSnapshot) {
        queryClient.setQueryData<AdminRfq>(['admin-rfq', id], { ...detailSnapshot, status })
      }

      return { listSnapshots, detailSnapshot, id }
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return
      ctx.listSnapshots.forEach(([key, value]) => queryClient.setQueryData(key, value))
      queryClient.setQueryData(['admin-rfq', ctx.id], ctx.detailSnapshot)
    },
    onSettled: (_data, _error, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-rfqs'] })
      queryClient.invalidateQueries({ queryKey: ['admin-rfq', vars.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
  })
}

export function useUpdateRFQ() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateRFQDetails,
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-rfqs'] })
      queryClient.invalidateQueries({ queryKey: ['admin-rfq', vars.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-rfq-timeline', vars.id] })
    },
  })
}

export function useAddRFQNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addRFQNote,
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-rfqs'] })
      queryClient.invalidateQueries({ queryKey: ['admin-rfq', vars.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-rfq-timeline', vars.id] })
    },
  })
}

export function useRFQTimeline(id: number) {
  return useQuery({
    queryKey: ['admin-rfq-timeline', id],
    queryFn: () => getRFQTimeline(id),
    enabled: Number.isFinite(id) && id > 0,
    staleTime: 20_000,
  })
}

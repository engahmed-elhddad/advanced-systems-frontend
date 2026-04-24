'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input, Select } from '@/components/ui'
import type {
  B2BCustomerOption,
  CreateQuotationPayload,
  QuotationDetail,
  UpdateQuotationPayload,
} from '@/features/admin/services/adminService'
import type { Product } from '@/types/product'
import toast from 'react-hot-toast'
import { QuotationItemsTable, type BuilderItem } from './QuotationItemsTable'
import { QuotationSummary } from './QuotationSummary'
import { QuotationActions } from './QuotationActions'

interface QuotationBuilderProps {
  quotation: QuotationDetail | null
  creatingNew: boolean
  customers: B2BCustomerOption[]
  products: Product[]
  loading: boolean
  busy: boolean
  onCreate: (payload: CreateQuotationPayload) => void
  onUpdate: (id: number, payload: UpdateQuotationPayload) => void
  onAction: (id: number, action: 'send' | 'approve' | 'reject') => void
}

interface BuilderDraft {
  customer_id: number | null
  notes: string
  valid_until: string
  status: string
  items: BuilderItem[]
}

function nextTempId(): string {
  return `tmp-${Math.random().toString(36).slice(2, 10)}`
}

function toBuilderItems(quotation: QuotationDetail | null): BuilderItem[] {
  if (!quotation) return []
  const rawItems = quotation.items
  if (!Array.isArray(rawItems)) return []
  return rawItems.map((item) => ({
    tempId: nextTempId(),
    id: item.id,
    product_id: item.product_id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    line_total: item.line_total,
  }))
}

function withLineTotal(item: BuilderItem): BuilderItem {
  const quantity = Number.isFinite(item.quantity) ? item.quantity : 1
  const unitPrice = Number.isFinite(item.unit_price) ? item.unit_price : 0
  const lineTotal = Number((quantity * unitPrice).toFixed(2))
  return {
    ...item,
    quantity: quantity < 1 ? 1 : quantity,
    unit_price: unitPrice < 0 ? 0 : unitPrice,
    line_total: lineTotal,
  }
}

function toPayloadItems(items: BuilderItem[]) {
  return items.map((item) => ({
    product_id: item.product_id,
    description: item.description.trim(),
    quantity: item.quantity,
    unit_price: item.unit_price,
  }))
}

function validateQuotationForClientAction(draft: BuilderDraft): string | null {
  if (!draft.customer_id) return 'Select a customer.'
  if (!draft.items.length) return 'Add at least one line item.'
  for (const item of draft.items) {
    if (item.product_id == null || !Number.isFinite(Number(item.product_id))) {
      return 'Each line must have a product selected.'
    }
    if (!Number.isFinite(item.quantity) || item.quantity < 1) {
      return 'Each line must have quantity at least 1.'
    }
    if (!Number.isFinite(item.unit_price) || item.unit_price < 0) {
      return 'Unit prices cannot be negative.'
    }
  }
  return null
}

export function QuotationBuilder({
  quotation,
  creatingNew,
  customers,
  products,
  loading,
  busy,
  onCreate,
  onUpdate,
  onAction,
}: QuotationBuilderProps) {
  const [draft, setDraft] = useState<BuilderDraft>({
    customer_id: null,
    notes: '',
    valid_until: '',
    status: 'draft',
    items: [],
  })
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (creatingNew) {
      setDraft({
        customer_id: null,
        notes: '',
        valid_until: '',
        status: 'draft',
        items: [],
      })
      setDirty(false)
      return
    }
    if (!quotation) {
      setDraft({
        customer_id: null,
        notes: '',
        valid_until: '',
        status: 'draft',
        items: [],
      })
      setDirty(false)
      return
    }
    setDraft({
      customer_id: quotation.customer_id,
      notes: quotation.notes ?? '',
      valid_until: quotation.valid_until ? quotation.valid_until.slice(0, 10) : '',
      status: quotation.status,
      items: toBuilderItems(quotation).map(withLineTotal),
    })
    setDirty(false)
  }, [quotation, creatingNew])

  const isDraft = draft.status.toLowerCase() === 'draft'
  const isSent = draft.status.toLowerCase() === 'sent'
  const canEditFields = isDraft || isSent
  const canEditStructure = isDraft
  const locked = !canEditFields

  const subtotal = useMemo(
    () => Number(draft.items.reduce((sum, item) => sum + item.line_total, 0).toFixed(2)),
    [draft.items],
  )

  const hasItems = draft.items.length > 0
  const hasCustomer = typeof draft.customer_id === 'number' && draft.customer_id > 0

  const updateItem = (
    tempId: string,
    patch: Partial<Pick<BuilderItem, 'product_id' | 'description' | 'quantity' | 'unit_price'>>,
  ) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.tempId === tempId ? withLineTotal({ ...item, ...patch }) : item,
      ),
    }))
    setDirty(true)
  }

  const addItem = () => {
    setDraft((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        withLineTotal({
          tempId: nextTempId(),
          product_id: null,
          description: '',
          quantity: 1,
          unit_price: 0,
          line_total: 0,
        }),
      ],
    }))
    setDirty(true)
  }

  const removeItem = (tempId: string) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.tempId !== tempId),
    }))
    setDirty(true)
  }

  const handleSaveDraft = () => {
    const payloadItems = toPayloadItems(draft.items).filter((i) => i.description && i.quantity > 0)
    if (!draft.customer_id) {
      toast.error('Select a customer before saving.')
      return
    }
    if (!payloadItems.length) {
      toast.error('Add at least one valid line item (description and quantity).')
      return
    }

    if (creatingNew || !quotation) {
      onCreate({
        customer_id: draft.customer_id,
        notes: draft.notes || undefined,
        valid_until: draft.valid_until || undefined,
        items: payloadItems,
      })
      return
    }

    onUpdate(quotation.id, {
      notes: draft.notes || undefined,
      valid_until: draft.valid_until || undefined,
      items: payloadItems,
    })
    setDirty(false)
  }

  useEffect(() => {
    if (!quotation) return
    if (!dirty) return
    if (!canEditFields) return

    const timer = setTimeout(() => {
      const payloadItems = toPayloadItems(draft.items).filter((i) => i.description && i.quantity > 0)
      if (!payloadItems.length || !draft.customer_id) return
      onUpdate(quotation.id, {
        notes: draft.notes || undefined,
        valid_until: draft.valid_until || undefined,
        items: payloadItems,
      })
      setDirty(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [quotation, draft, dirty, canEditFields, onUpdate])

  const customerOptions = customers.map((c) => ({
    value: String(c.id),
    label: `${c.company_name} (${c.name})`,
  }))

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-white/[0.08]" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <h3 className="mb-3 text-sm font-semibold text-white">Quotation Builder</h3>
          <div className="grid gap-2 md:grid-cols-2">
            <Select
              value={draft.customer_id ? String(draft.customer_id) : ''}
              onChange={(value) => {
                setDraft((prev) => ({ ...prev, customer_id: value ? Number(value) : null }))
                setDirty(true)
              }}
              options={customerOptions}
              placeholder="Select customer"
              disabled={!canEditFields || (!creatingNew && isSent)}
              searchable
            />
            <Input
              type="date"
              value={draft.valid_until}
              onChange={(e) => {
                setDraft((prev) => ({ ...prev, valid_until: e.target.value }))
                setDirty(true)
              }}
              disabled={!canEditFields}
            />
          </div>
          <div className="mt-2">
            <Input
              value={draft.notes}
              onChange={(e) => {
                setDraft((prev) => ({ ...prev, notes: e.target.value }))
                setDirty(true)
              }}
              placeholder="Internal notes"
              disabled={!canEditFields}
            />
          </div>
        </div>

        <QuotationItemsTable
          items={draft.items}
          products={products}
          disabled={locked}
          canAddRemove={canEditStructure}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onItemChange={updateItem}
        />
      </div>

      <div className="space-y-3">
        <QuotationSummary subtotal={subtotal} total={subtotal} itemCount={draft.items.length} />
        <QuotationActions
          status={draft.status}
          busy={busy}
          canEdit={canEditFields}
          hasItems={hasItems}
          hasCustomer={hasCustomer}
          onSaveDraft={handleSaveDraft}
          onSend={() => {
            if (!quotation) return
            const err = validateQuotationForClientAction(draft)
            if (err) {
              toast.error(err)
              return
            }
            if (!window.confirm('Send this quotation to the client?')) return
            onAction(quotation.id, 'send')
          }}
          onApprove={() => {
            if (!quotation) return
            const err = validateQuotationForClientAction(draft)
            if (err) {
              toast.error(err)
              return
            }
            if (!window.confirm('Approve this quotation?')) return
            onAction(quotation.id, 'approve')
          }}
          onReject={() => {
            if (!quotation) return
            if (!window.confirm('Reject this quotation?')) return
            onAction(quotation.id, 'reject')
          }}
        />
        {!creatingNew && dirty ? (
          <p className="text-xs text-white/50">Unsaved changes — auto-save in progress...</p>
        ) : null}
      </div>
    </div>
  )
}

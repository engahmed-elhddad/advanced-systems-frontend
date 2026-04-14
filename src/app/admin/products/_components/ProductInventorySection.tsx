'use client'

import { useMemo, useState } from 'react'
import { Package, Plus, Trash2, Upload } from 'lucide-react'
import { Button, Input, Select } from '@/components/ui'
import {
  useBulkInventoryStatus,
  useCreateInventoryItem,
  useDeleteInventoryItem,
  useInventoryItems,
  useUpdateInventoryItem,
  importInventoryCsv,
} from '@/features/inventory/hooks/useInventoryItems'
import { getApiErrorMessage } from '@/lib/api'
import toast from 'react-hot-toast'

const CONDITIONS = [
  { value: '', label: 'All conditions' },
  { value: 'new', label: 'New' },
  { value: 'refurbished', label: 'Refurbished' },
  { value: 'used', label: 'Used' },
]

const STATUSES = [
  { value: '', label: 'All statuses' },
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'sold', label: 'Sold' },
]

const PACKAGING_OPTS = [
  { value: 'original', label: 'Original' },
  { value: 'no_box', label: 'No box' },
  { value: 'advanced_system', label: 'Advanced System' },
  { value: 'other', label: 'Other' },
]

type Props = { productId: number }

export function ProductInventorySection({ productId }: Props) {
  const [filterCond, setFilterCond] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<number>>(() => new Set())

  const filters = useMemo(
    () => ({
      condition: filterCond || undefined,
      status: filterStatus || undefined,
      search: search || undefined,
    }),
    [filterCond, filterStatus, search]
  )

  const listQuery = useInventoryItems(productId, filters)
  const createMut = useCreateInventoryItem(productId)
  const updateMut = useUpdateInventoryItem(productId)
  const deleteMut = useDeleteInventoryItem(productId)
  const bulkMut = useBulkInventoryStatus(productId)

  const [form, setForm] = useState({
    condition: 'new',
    packaging: 'original',
    price: '',
    status: 'available',
    condition_note: '',
    offer_id: '',
  })

  const items = listQuery.data ?? []

  const toggleSel = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set())
    else setSelected(new Set(items.map((i) => i.id)))
  }

  return (
    <div className="mt-8 space-y-4 rounded-xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Package className="h-5 w-5 text-orange-300" />
          Warehouse inventory
        </h2>
        <p className="text-xs text-white/50">
          Stock quantity on the product is the count of items with status <span className="text-white/70">available</span>.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[140px]">
          <Select
            value={filterCond}
            onChange={(v) => setFilterCond(v)}
            options={CONDITIONS}
            placeholder="Condition"
            className="border-white/15 bg-white/[0.08] text-white"
          />
        </div>
        <div className="min-w-[140px]">
          <Select
            value={filterStatus}
            onChange={(v) => setFilterStatus(v)}
            options={STATUSES}
            placeholder="Status"
            className="border-white/15 bg-white/[0.08] text-white"
          />
        </div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes / id…"
          className="max-w-xs border-white/15 bg-white/[0.06] text-white"
        />
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10">
          <Upload className="h-4 w-4" />
          Import CSV
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              try {
                const res = await importInventoryCsv(f)
                toast.success(`Imported ${res.created} row(s); ${res.failed_count} failed`)
                if (res.errors?.length) console.warn('inventory import errors', res.errors)
                listQuery.refetch()
              } catch (err) {
                toast.error(getApiErrorMessage(err, 'Import failed'))
              }
            }}
          />
        </label>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/20 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/45">Add item</p>
        <div className="flex flex-wrap gap-3">
          <Select
            value={form.condition}
            onChange={(v) => setForm((s) => ({ ...s, condition: v }))}
            options={CONDITIONS.filter((o) => o.value)}
            className="min-w-[120px] border-white/15 bg-white/[0.08] text-white"
          />
          <Select
            value={form.packaging}
            onChange={(v) => setForm((s) => ({ ...s, packaging: v }))}
            options={PACKAGING_OPTS}
            className="min-w-[160px] border-white/15 bg-white/[0.08] text-white"
          />
          <Select
            value={form.status}
            onChange={(v) => setForm((s) => ({ ...s, status: v }))}
            options={STATUSES.filter((o) => o.value)}
            className="min-w-[120px] border-white/15 bg-white/[0.08] text-white"
          />
          <Input
            value={form.price}
            onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
            placeholder="Price (optional)"
            type="number"
            step="0.01"
            className="w-32 border-white/15 bg-white/[0.06] text-white"
          />
          <Input
            value={form.offer_id}
            onChange={(e) => setForm((s) => ({ ...s, offer_id: e.target.value }))}
            placeholder="Offer id (opt.)"
            className="w-28 border-white/15 bg-white/[0.06] text-white"
          />
          <Input
            value={form.condition_note}
            onChange={(e) => setForm((s) => ({ ...s, condition_note: e.target.value }))}
            placeholder="Condition note"
            className="min-w-[180px] flex-1 border-white/15 bg-white/[0.06] text-white"
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            disabled={createMut.isPending}
            onClick={async () => {
              try {
                const price =
                  form.price.trim() === '' ? null : Number.parseFloat(form.price)
                const offerRaw = form.offer_id.trim()
                await createMut.mutateAsync({
                  condition: form.condition,
                  packaging: form.packaging,
                  status: form.status,
                  price: Number.isFinite(price as number) ? (price as number) : null,
                  condition_note: form.condition_note.trim() || null,
                  offer_id: offerRaw && /^\d+$/.test(offerRaw) ? Number(offerRaw) : null,
                })
                toast.success('Inventory item added')
                setForm((s) => ({ ...s, price: '', condition_note: '', offer_id: '' }))
              } catch (e) {
                toast.error(getApiErrorMessage(e, 'Failed to add item'))
              }
            }}
          >
            Add
          </Button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-orange-400/25 bg-orange-500/10 px-3 py-2">
          <span className="text-sm text-white/80">{selected.size} selected</span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={bulkMut.isPending}
            onClick={async () => {
              try {
                await bulkMut.mutateAsync({ item_ids: [...selected], status: 'sold' })
                toast.success('Marked sold')
                setSelected(new Set())
              } catch (e) {
                toast.error(getApiErrorMessage(e, 'Bulk update failed'))
              }
            }}
          >
            Mark sold
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={bulkMut.isPending}
            onClick={async () => {
              try {
                await bulkMut.mutateAsync({ item_ids: [...selected], status: 'available' })
                toast.success('Marked available')
                setSelected(new Set())
              } catch (e) {
                toast.error(getApiErrorMessage(e, 'Bulk update failed'))
              }
            }}
          >
            Mark available
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm text-white/90">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/45">
              <th className="p-2 w-10">
                <input
                  type="checkbox"
                  checked={items.length > 0 && selected.size === items.length}
                  onChange={toggleAll}
                  aria-label="Select all"
                />
              </th>
              <th className="p-2">ID</th>
              <th className="p-2">Condition</th>
              <th className="p-2">Packaging</th>
              <th className="p-2">Price</th>
              <th className="p-2">Status</th>
              <th className="p-2">Note</th>
              <th className="p-2 w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listQuery.isLoading ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-white/50">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-white/50">
                  No inventory rows yet. Add items above or import CSV (part_number must match this product for file import —
                  use global import for mixed parts).
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <InventoryRowEditor
                  key={row.id}
                  row={row}
                  selected={selected.has(row.id)}
                  onToggle={() => toggleSel(row.id)}
                  onSave={async (patch) => {
                    try {
                      await updateMut.mutateAsync({ id: row.id, body: patch })
                      toast.success('Updated')
                    } catch (e) {
                      toast.error(getApiErrorMessage(e, 'Update failed'))
                    }
                  }}
                  onDelete={async () => {
                    if (!confirm(`Delete inventory item #${row.id}?`)) return
                    try {
                      await deleteMut.mutateAsync(row.id)
                      toast.success('Deleted')
                    } catch (e) {
                      toast.error(getApiErrorMessage(e, 'Delete failed'))
                    }
                  }}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function InventoryRowEditor({
  row,
  selected,
  onToggle,
  onSave,
  onDelete,
}: {
  row: import('@/features/inventory/hooks/useInventoryItems').InventoryItemRow
  selected: boolean
  onToggle: () => void
  onSave: (patch: import('@/features/inventory/hooks/useInventoryItems').InventoryItemUpdateInput) => void
  onDelete: () => void
}) {
  const [status, setStatus] = useState(row.status)
  const [price, setPrice] = useState(row.price != null ? String(row.price) : '')
  const [note, setNote] = useState(row.condition_note ?? '')

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.03]">
      <td className="p-2">
        <input type="checkbox" checked={selected} onChange={onToggle} aria-label={`Select ${row.id}`} />
      </td>
      <td className="p-2 font-mono text-xs text-white/60">{row.id}</td>
      <td className="p-2 capitalize">{row.condition}</td>
      <td className="p-2 text-xs text-white/70">{row.packaging.replace(/_/g, ' ')}</td>
      <td className="p-2">
        <Input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="h-8 w-24 border-white/15 bg-white/[0.06] text-sm text-white"
        />
      </td>
      <td className="p-2">
        <Select
          value={status}
          onChange={(v) => setStatus(v)}
          options={STATUSES.filter((o) => o.value)}
          className="h-8 min-w-[110px] border-white/15 bg-white/[0.08] text-sm text-white"
        />
      </td>
      <td className="p-2">
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="h-8 min-w-[140px] border-white/15 bg-white/[0.06] text-sm text-white"
        />
      </td>
      <td className="p-2">
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="px-2 text-xs"
            onClick={() => {
              const p = price.trim() === '' ? null : Number.parseFloat(price)
              onSave({
                status,
                condition_note: note.trim() || null,
                price: Number.isFinite(p as number) ? (p as number) : null,
              })
            }}
          >
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="px-2 text-red-300 hover:text-red-200"
            onClick={onDelete}
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

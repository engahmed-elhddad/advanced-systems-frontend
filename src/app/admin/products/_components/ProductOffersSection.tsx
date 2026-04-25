'use client'

import { useState } from 'react'
import { Tag, Plus, Trash2 } from 'lucide-react'
import { Button, Input, Select } from '@/components/ui'
import {
  useProductOffers,
  useCreateProductOffer,
  useUpdateProductOffer,
  useDeleteProductOffer,
} from '@/features/products/hooks/useProductOffers'
import type { ProductOfferRow, ProductOfferUpdateInput } from '@/features/products/hooks/useProductOffers'
import { getApiErrorMessage } from '@/lib/api'
import toast from 'react-hot-toast'

const CONDITION_OPTS = [
  { value: 'new', label: 'New' },
  { value: 'refurbished', label: 'Refurbished' },
  { value: 'used', label: 'Used' },
]

const PACKAGING_OPTS = [
  { value: 'original_package', label: 'Original Package' },
  { value: 'advanced_systems_package', label: 'Advanced Systems Package' },
  { value: 'no_package', label: 'No Package' },
]

type Props = { productId: number }

export function ProductOffersSection({ productId }: Props) {
  const listQuery = useProductOffers(productId)
  const createMut = useCreateProductOffer(productId)
  const updateMut = useUpdateProductOffer(productId)
  const deleteMut = useDeleteProductOffer(productId)

  const [form, setForm] = useState({
    condition: 'new',
    packaging: 'original_package',
    price: '',
    quantity: '0',
    condition_notes: '',
    is_active: true,
  })

  const offers = listQuery.data ?? []

  return (
    <div className="mt-8 space-y-4 rounded-xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
        <Tag className="h-5 w-5 text-orange-300" />
        Offers / Variants
      </h2>

      <div className="rounded-lg border border-white/10 bg-black/20 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/45">Add offer</p>
        <div className="flex flex-wrap gap-3">
          <Select
            value={form.condition}
            onChange={(v) => setForm((s) => ({ ...s, condition: v }))}
            options={CONDITION_OPTS}
            className="min-w-[130px] border-white/15 bg-white/[0.08] text-white"
          />
          <Select
            value={form.packaging}
            onChange={(v) => setForm((s) => ({ ...s, packaging: v }))}
            options={PACKAGING_OPTS}
            className="min-w-[200px] border-white/15 bg-white/[0.08] text-white"
          />
          <Input
            value={form.price}
            onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
            placeholder="Price (USD)"
            type="number"
            step="0.01"
            className="w-32 border-white/15 bg-white/[0.06] text-white"
          />
          <Input
            value={form.quantity}
            onChange={(e) => setForm((s) => ({ ...s, quantity: e.target.value }))}
            placeholder="Qty"
            type="number"
            className="w-20 border-white/15 bg-white/[0.06] text-white"
          />
          <Input
            value={form.condition_notes}
            onChange={(e) => setForm((s) => ({ ...s, condition_notes: e.target.value }))}
            placeholder="Condition notes (optional)"
            className="min-w-[180px] flex-1 border-white/15 bg-white/[0.06] text-white"
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.checked }))}
              className="h-4 w-4"
            />
            Active
          </label>
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
                await createMut.mutateAsync({
                  condition: form.condition,
                  packaging: form.packaging,
                  price: Number.isFinite(price as number) ? (price as number) : null,
                  quantity: Number.parseInt(form.quantity, 10) || 0,
                  condition_notes: form.condition_notes.trim() || null,
                  is_active: form.is_active,
                })
                toast.success('Offer added')
                setForm((s) => ({ ...s, price: '', quantity: '0', condition_notes: '' }))
              } catch (e) {
                toast.error(getApiErrorMessage(e, 'Failed to add offer'))
              }
            }}
          >
            Add
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-left text-sm text-white/90">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/45">
              <th className="p-2">Condition</th>
              <th className="p-2">Packaging</th>
              <th className="p-2">Label</th>
              <th className="p-2">Price</th>
              <th className="p-2">Stock</th>
              <th className="p-2">Notes</th>
              <th className="p-2">Active</th>
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
            ) : offers.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-white/50">
                  No offers yet. Add one above.
                </td>
              </tr>
            ) : (
              offers.map((offer) => (
                <OfferRowEditor
                  key={offer.id}
                  offer={offer}
                  onSave={async (patch) => {
                    try {
                      await updateMut.mutateAsync({ offerId: offer.id, body: patch })
                      toast.success('Updated')
                    } catch (e) {
                      toast.error(getApiErrorMessage(e, 'Update failed'))
                    }
                  }}
                  onDelete={async () => {
                    if (!confirm(`Delete offer #${offer.id}?`)) return
                    try {
                      await deleteMut.mutateAsync(offer.id)
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

function OfferRowEditor({
  offer,
  onSave,
  onDelete,
}: {
  offer: ProductOfferRow
  onSave: (patch: ProductOfferUpdateInput) => void
  onDelete: () => void
}) {
  const [condition, setCondition] = useState(offer.condition)
  const [packaging, setPackaging] = useState(offer.packaging)
  const [price, setPrice] = useState(offer.price != null ? String(offer.price) : '')
  const [quantity, setQuantity] = useState(String(offer.quantity))
  const [notes, setNotes] = useState(offer.condition_notes ?? '')
  const [isActive, setIsActive] = useState(offer.is_active)

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.03]">
      <td className="p-2">
        <Select
          value={condition}
          onChange={setCondition}
          options={CONDITION_OPTS}
          className="h-8 min-w-[110px] border-white/15 bg-white/[0.08] text-sm text-white"
        />
      </td>
      <td className="p-2">
        <Select
          value={packaging}
          onChange={setPackaging}
          options={PACKAGING_OPTS}
          className="h-8 min-w-[170px] border-white/15 bg-white/[0.08] text-sm text-white"
        />
      </td>
      <td className="p-2 text-xs text-white/60">{offer.display_label ?? '—'}</td>
      <td className="p-2">
        <Input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          type="number"
          step="0.01"
          className="h-8 w-24 border-white/15 bg-white/[0.06] text-sm text-white"
        />
      </td>
      <td className="p-2">
        <Input
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          type="number"
          className="h-8 w-20 border-white/15 bg-white/[0.06] text-sm text-white"
        />
      </td>
      <td className="p-2">
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="h-8 min-w-[140px] border-white/15 bg-white/[0.06] text-sm text-white"
        />
      </td>
      <td className="p-2">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          aria-label="Active"
          className="h-4 w-4"
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
                condition,
                packaging,
                price: Number.isFinite(p as number) ? (p as number) : null,
                quantity: Number.parseInt(quantity, 10) || 0,
                condition_notes: notes.trim() || null,
                is_active: isActive,
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

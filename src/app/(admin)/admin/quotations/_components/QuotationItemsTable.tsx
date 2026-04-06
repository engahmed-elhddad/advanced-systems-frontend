'use client'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { Product } from '@/types/product'

export interface BuilderItem {
  tempId: string
  id?: number
  product_id: number | null
  description: string
  quantity: number
  unit_price: number
  line_total: number
}

interface QuotationItemsTableProps {
  items: BuilderItem[]
  products: Product[]
  disabled: boolean
  canAddRemove: boolean
  onAddItem: () => void
  onRemoveItem: (tempId: string) => void
  onItemChange: (
    tempId: string,
    patch: Partial<Pick<BuilderItem, 'product_id' | 'description' | 'quantity' | 'unit_price'>>,
  ) => void
}

function toOptions(products: Product[]) {
  const base = [{ value: '', label: 'Manual item' }]
  const mapped = products.map((p) => ({
    value: String(p.id),
    label: `${p.part_number} ${p.name ? `- ${p.name}` : ''}`.trim(),
  }))
  return [...base, ...mapped]
}

export function QuotationItemsTable({
  items,
  products,
  disabled,
  canAddRemove,
  onAddItem,
  onRemoveItem,
  onItemChange,
}: QuotationItemsTableProps) {
  const options = toOptions(products)

  return (
    <div className="rounded-[4px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">Items</h3>
        <Button size="sm" variant="secondary" onClick={onAddItem} disabled={disabled || !canAddRemove}>
          Add Item
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.tempId} className="rounded-[2px] border border-[#E5E7EB] p-3">
            <div className="mb-2 grid gap-2 md:grid-cols-2">
              <Select
                value={item.product_id ? String(item.product_id) : ''}
                onChange={(value) => {
                  onItemChange(item.tempId, { product_id: value ? Number(value) : null })
                  if (value) {
                    const product = products.find((p) => p.id === Number(value))
                    if (product) {
                      const text = product.name || product.description || product.part_number
                      onItemChange(item.tempId, { description: text })
                    }
                  }
                }}
                options={options}
                placeholder="Select product (optional)"
                disabled={disabled}
                searchable
              />
              <Input
                value={item.description}
                onChange={(e) => onItemChange(item.tempId, { description: e.target.value })}
                placeholder="Description"
                disabled={disabled}
              />
            </div>

            <div className="grid gap-2 md:grid-cols-[120px_140px_1fr_auto]">
              <Input
                type="number"
                min={1}
                value={String(item.quantity)}
                onChange={(e) => onItemChange(item.tempId, { quantity: Number(e.target.value || 1) })}
                placeholder="Qty"
                disabled={disabled}
              />
              <Input
                type="number"
                min={0}
                step="0.01"
                value={String(item.unit_price)}
                onChange={(e) => onItemChange(item.tempId, { unit_price: Number(e.target.value || 0) })}
                placeholder="Unit Price"
                disabled={disabled}
              />
              <div className="flex items-center rounded-[2px] border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm font-semibold text-[#1A1A1A]">
                Line Total: ${item.line_total.toFixed(2)}
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onRemoveItem(item.tempId)}
                disabled={disabled || !canAddRemove}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


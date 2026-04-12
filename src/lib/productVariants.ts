/**
 * Normalize API `variants[]` or fall back to product-level condition + stock.
 * Keeps one row per part so the product page can always show a condition selector.
 */

export interface ProductVariantOption {
  id: number | null
  condition: string
  stock: number
  price?: number | null
  image_url?: string | null
  status?: string
}

const CONDITION_LABELS: Record<string, string> = {
  new_box: 'New — sealed box',
  new_no_box: 'New — no box',
  refurbished: 'Refurbished',
  used: 'Used',
  standard: 'Standard listing',
  new: 'New',
}

export function formatVariantConditionLabel(condition: string): string {
  const key = condition.trim().toLowerCase().replace(/\s+/g, '_')
  if (CONDITION_LABELS[key]) return CONDITION_LABELS[key]
  if (!condition.trim()) return 'Standard listing'
  return condition
    .split(/[_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

export function variantOptionKey(v: ProductVariantOption, index: number): string {
  if (v.id != null) return `id:${v.id}`
  return `idx:${index}:${v.condition}`
}

/** Smallest positive finite variant list price, or null if none. */
export function minPositiveVariantPrice(variants: ProductVariantOption[]): number | null {
  let best: number | null = null
  for (const v of variants) {
    const p = v.price
    if (p != null && Number.isFinite(p) && p > 0) {
      best = best == null ? p : Math.min(best, p)
    }
  }
  return best
}

export function normalizeProductVariants(product: Record<string, unknown>): ProductVariantOption[] {
  const raw = product.variants
  if (Array.isArray(raw) && raw.length > 0) {
    const out: ProductVariantOption[] = []
    for (let i = 0; i < raw.length; i++) {
      const v = raw[i] as Record<string, unknown> | null
      if (!v || typeof v !== 'object') continue
      const idRaw = v.id
      const id =
        typeof idRaw === 'number' && Number.isFinite(idRaw)
          ? idRaw
          : typeof idRaw === 'string' && /^\d+$/.test(idRaw)
            ? Number(idRaw)
            : null
      const condition = String(v.condition ?? v.condition_code ?? `option_${i}`)
      const stockRaw = v.stock ?? v.stock_quantity
      const stock =
        typeof stockRaw === 'number' && Number.isFinite(stockRaw)
          ? Math.max(0, Math.floor(stockRaw))
          : Math.max(0, Math.floor(Number(stockRaw) || 0))
      const priceRaw = v.price
      const price =
        typeof priceRaw === 'number' && Number.isFinite(priceRaw)
          ? priceRaw
          : priceRaw != null && String(priceRaw).trim() !== ''
            ? Number(priceRaw)
            : null
      const status = v.status != null ? String(v.status) : 'active'
      const image_url = typeof v.image_url === 'string' ? v.image_url : null
      out.push({ id, condition, stock, price: Number.isFinite(price as number) ? price : null, image_url, status })
    }
    if (out.length > 0) return out
  }

  const stockRaw = product.stock_quantity
  const stock =
    typeof stockRaw === 'number' && Number.isFinite(stockRaw)
      ? Math.max(0, Math.floor(stockRaw))
      : Math.max(0, Math.floor(Number(stockRaw) || 0))
  const condition = String(product.condition ?? 'standard').trim() || 'standard'
  return [{ id: null, condition, stock, status: 'active' }]
}

export function variantStockHint(v: ProductVariantOption): string {
  const st = (v.status || '').toLowerCase()
  if (st === 'sold') return 'Sold — we can still source'
  if (v.stock > 0) return `${v.stock} unit${v.stock === 1 ? '' : 's'} available`
  return 'Availability on request'
}

export function buildRfqVariantFooter(args: {
  partNumber: string
  productId?: number
  variant: ProductVariantOption
}): string {
  const { partNumber, productId, variant } = args
  const lines = [
    `Part: ${partNumber}`,
    `Condition: ${formatVariantConditionLabel(variant.condition)}`,
    variant.id != null ? `Variant ID: ${variant.id}` : null,
    `Stock: ${variantStockHint(variant)}`,
    productId != null ? `Product ID: ${productId}` : null,
  ].filter(Boolean)
  return `---\n${lines.join('\n')}`
}

/** Replace trailing `---` block (from a previous variant) when updating selection. */
export function mergeVariantIntoMessage(message: string, variantBlock: string): string {
  const re = /\n?---\n[\s\S]*$/
  const trimmed = message.replace(re, '').trimEnd()
  return trimmed ? `${trimmed}\n\n${variantBlock}` : variantBlock
}

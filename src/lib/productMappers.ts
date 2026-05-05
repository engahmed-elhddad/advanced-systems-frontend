import type { ProductCardProps } from '@/components/products/ProductCard'
import { getProductImage } from '@/lib/productImageUrl'
import { asApiDisplayString } from '@/lib/utils'
import type { ProductPricing } from '@/types/product'
import type { StockBadge } from '@/types/warehouse'

const INDENT_BADGE: StockBadge = { kind: 'indent' }

export function coerceStockBadges(raw: unknown): StockBadge[] {
  if (!Array.isArray(raw) || raw.length === 0) return [INDENT_BADGE]
  const out: StockBadge[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    if (
      o.kind === 'in_stock' &&
      typeof o.warehouse_id === 'number' &&
      typeof o.name_en === 'string' &&
      typeof o.name_ar === 'string'
    ) {
      out.push({
        kind: 'in_stock',
        warehouse_id: o.warehouse_id,
        name_en: o.name_en,
        name_ar: o.name_ar,
      })
      continue
    }
    if (o.kind === 'lead_time' && (o.days === 7 || o.days === 14)) {
      out.push({ kind: 'lead_time', days: o.days })
      continue
    }
    if (o.kind === 'indent') {
      out.push({ kind: 'indent' })
    }
  }
  return out.length ? out : [INDENT_BADGE]
}

/** Flexible product shape from API (various backend responses) */
export interface ApiProduct {
  id?: number
  slug?: string
  part_number: string
  brand?: string | { name?: string } | null
  manufacturer?: string
  brand_slug?: string | null
  brand_logo_url?: string | null
  brand_name?: string | null
  category?: string | { name?: string } | null
  description?: string
  short_description?: string
  images?: Array<{ url?: string } | string> | null
  image_url?: string
  stock_quantity?: number | null
  availability?: string
  price_usd?: number | null
  price?: number | null
  pricing?: ProductPricing | null
  stock_badges?: StockBadge[]
  series?: string | null
  voltage?: string | null
  current?: string | null
  coil_voltage?: string | null
  mounting_type?: string | null
  specs?: Record<string, unknown> | null
}

/**
 * Map an API product object to ProductCard props.
 * Uses API-provided image_url directly.
 */
/** Map ORM-shaped product JSON (list/detail API) to ApiProduct. */
export function ormProductToApiProduct(p: Record<string, unknown>): ApiProduct {
  const imgUrl = getProductImage(p)
  const brandStr = asApiDisplayString(p.brand) || asApiDisplayString(p.manufacturer)
  const categoryStr = asApiDisplayString(p.category)
  return {
    id: typeof p.id === 'number' && Number.isFinite(p.id) ? p.id : undefined,
    slug: p.slug != null ? String(p.slug) : undefined,
    part_number: String(p.part_number ?? ''),
    brand: brandStr || undefined,
    manufacturer: brandStr || undefined,
    brand_slug: p.brand_slug != null ? String(p.brand_slug) : null,
    brand_logo_url: p.brand_logo_url != null ? String(p.brand_logo_url) : null,
    brand_name: p.brand_name != null ? String(p.brand_name) : null,
    category: categoryStr || undefined,
    description: String(p.description ?? ''),
    short_description: String(p.short_description ?? ''),
    image_url: imgUrl,
    stock_quantity: Number(p.stock_quantity ?? 0),
    availability: String(p.availability ?? ''),
    price_usd: (p.price_usd as number) ?? null,
    pricing: (p.pricing as ProductPricing) ?? null,
    stock_badges: coerceStockBadges(p.stock_badges),
    series: p.series != null ? String(p.series) : null,
  }
}

/** Normalize a Meilisearch / search API hit to ApiProduct for cards (uses {@link getProductImage}). */
export function searchHitToApiProduct(hit: Record<string, unknown>): ApiProduct {
  const img = getProductImage(hit)
  const hid = hit.id
  const parsedId =
    typeof hid === 'number' && Number.isFinite(hid)
      ? hid
      : typeof hid === 'string' && /^\d+$/.test(hid)
        ? Number(hid)
        : undefined
  const brandStr = asApiDisplayString(hit.brand_name ?? hit.brand)
  const categoryStr = asApiDisplayString(hit.category_name ?? hit.category)
  return {
    id: parsedId,
    slug: hit.slug != null ? String(hit.slug) : undefined,
    part_number: String(hit.part_number ?? ''),
    brand: brandStr,
    manufacturer: brandStr,
    brand_slug: hit.brand_slug != null ? String(hit.brand_slug) : null,
    brand_logo_url: hit.brand_logo_url != null ? String(hit.brand_logo_url) : null,
    brand_name: hit.brand_name != null ? String(hit.brand_name) : null,
    category: categoryStr,
    description: String(hit.short_description ?? hit.description ?? ''),
    short_description: String(hit.short_description ?? ''),
    image_url: img,
    stock_quantity: typeof hit.stock_quantity === 'number' ? hit.stock_quantity : 0,
    availability: String(hit.availability ?? ''),
    price_usd: typeof hit.price_usd === 'number' ? hit.price_usd : null,
    pricing: (hit.pricing as ProductPricing) ?? null,
    stock_badges: coerceStockBadges(hit.stock_badges),
    series: hit.series != null ? String(hit.series) : null,
  }
}

export function productToCardProps(p: ApiProduct): ProductCardProps {
  const manufacturer =
    typeof p.brand === 'string' ? p.brand : (p.brand?.name ?? p.manufacturer)
  const category =
    typeof p.category === 'string' ? p.category : (p.category?.name ?? undefined)
  const stock = p.stock_quantity ?? 0
  const isAvailable =
    p.availability === 'available' ||
    p.availability === 'in_stock' ||
    stock > 0

  const hasQuickSpecs =
    p.series || p.voltage || p.current || p.coil_voltage || p.mounting_type
  const quickSpecs = hasQuickSpecs
    ? {
        series: p.series != null ? String(p.series) : undefined,
        voltage: p.voltage != null ? String(p.voltage) : undefined,
        current: p.current != null ? String(p.current) : undefined,
        coil_voltage: p.coil_voltage != null ? String(p.coil_voltage) : undefined,
        mounting_type: p.mounting_type != null ? String(p.mounting_type) : undefined,
      }
    : undefined

  const brand = typeof p.brand === 'string' ? p.brand : (p.brand?.name ?? p.manufacturer ?? 'Industrial')
  const categoryDisplay = category || 'Industrial Component'

  return {
    part_number: p.part_number,
    slug: p.slug?.trim() || undefined,
    id: typeof p.id === 'number' && Number.isFinite(p.id) ? p.id : undefined,
    brand,
    manufacturer,
    brand_slug: p.brand_slug ?? undefined,
    brand_logo_url: p.brand_logo_url ?? undefined,
    brand_name: p.brand_name?.trim() ? p.brand_name.trim() : undefined,
    category: categoryDisplay,
    description: p.short_description ?? p.description,
    image_url: getProductImage(p as unknown as Record<string, unknown>),
    stock_quantity: stock,
    availability: isAvailable ? 'in_stock' : 'on_request',
    price_usd: p.price_usd,
    pricing: p.pricing ?? undefined,
    stock_badges: p.stock_badges ?? coerceStockBadges(undefined),
    quickSpecs,
  }
}

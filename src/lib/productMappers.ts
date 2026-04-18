import type { ProductCardProps } from '@/components/products/ProductCard'
import { getProductImage } from '@/lib/productImageUrl'

/** Flexible product shape from API (various backend responses) */
export interface ApiProduct {
  id?: number
  slug?: string
  part_number: string
  brand?: string | { name?: string } | null
  manufacturer?: string
  category?: string | { name?: string } | null
  description?: string
  short_description?: string
  images?: Array<{ url?: string } | string> | null
  image_url?: string
  stock_quantity?: number | null
  availability?: string
  price_usd?: number | null
  price?: number | null
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
  const br = p.brand as { name?: string } | undefined
  const cat = p.category as { name?: string } | undefined
  const imgUrl = getProductImage(p)
  return {
    id: typeof p.id === 'number' && Number.isFinite(p.id) ? p.id : undefined,
    slug: p.slug != null ? String(p.slug) : undefined,
    part_number: String(p.part_number ?? ''),
    brand: br?.name,
    manufacturer: br?.name,
    category: cat?.name,
    description: String(p.description ?? ''),
    short_description: String(p.short_description ?? ''),
    image_url: imgUrl,
    stock_quantity: Number(p.stock_quantity ?? 0),
    availability: String(p.availability ?? ''),
    price_usd: (p.price_usd as number) ?? null,
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
  return {
    id: parsedId,
    slug: hit.slug != null ? String(hit.slug) : undefined,
    part_number: String(hit.part_number ?? ''),
    brand: String(hit.brand_name ?? hit.brand ?? ''),
    manufacturer: String(hit.brand_name ?? ''),
    category: String(hit.category_name ?? hit.category ?? ''),
    description: String(hit.short_description ?? hit.description ?? ''),
    short_description: String(hit.short_description ?? ''),
    image_url: img,
    stock_quantity: typeof hit.stock_quantity === 'number' ? hit.stock_quantity : 0,
    availability: String(hit.availability ?? ''),
    price_usd: typeof hit.price_usd === 'number' ? hit.price_usd : null,
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
    category: categoryDisplay,
    description: p.short_description ?? p.description,
    image_url: getProductImage(p as unknown as Record<string, unknown>),
    stock_quantity: stock,
    availability: isAvailable ? 'in_stock' : 'on_request',
    price_usd: p.price_usd,
    quickSpecs,
  }
}

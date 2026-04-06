import type { ProductCardProps } from '@/components/products/ProductCard'

/** Flexible product shape from API (various backend responses) */
export interface ApiProduct {
  id?: number
  part_number: string
  brand?: string | { name?: string } | null
  manufacturer?: string
  category?: string | { name?: string } | null
  description?: string
  short_description?: string
  images?: Array<{ url?: string } | string> | null
  primary_image?: string
  image?: string
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
export function productToCardProps(p: ApiProduct): ProductCardProps {
  const manufacturer =
    typeof p.brand === 'string' ? p.brand : (p.brand?.name ?? p.manufacturer)
  const category =
    typeof p.category === 'string' ? p.category : (p.category?.name ?? undefined)
  const imageUrl = typeof p.image_url === 'string' ? p.image_url : ''
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
    brand,
    manufacturer,
    category: categoryDisplay,
    description: p.short_description ?? p.description,
    image_url: imageUrl,
    stock_quantity: stock,
    availability: isAvailable ? 'in_stock' : 'on_request',
    price_usd: p.price_usd,
    quickSpecs,
  }
}

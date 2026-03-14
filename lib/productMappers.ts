import { resolveProductImageUrl } from '@/app/lib/constants'
import type { ProductCardProps } from '@/components/products/ProductCard'

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:8000'

/** Flexible product shape from API (various backend responses) */
export interface ApiProduct {
  id?: number
  part_number: string
  brand?: { name?: string } | null
  manufacturer?: string
  category?: { name?: string } | null
  description?: string
  short_description?: string
  images?: Array<{ url?: string } | string> | null
  primary_image?: string
  image?: string
  image_url?: string
  stock_quantity?: number | null
  availability?: string
  price_usd?: number | null
  [key: string]: unknown
}

/**
 * Map an API product object to ProductCard props.
 * Handles various API shapes (brand vs manufacturer, images array vs primary_image, etc.)
 */
export function productToCardProps(p: ApiProduct): ProductCardProps {
  const manufacturer =
    typeof p.brand === 'string' ? p.brand : (p.brand?.name ?? p.manufacturer)
  const category =
    typeof p.category === 'string' ? p.category : (p.category?.name ?? undefined)
  const imageUrl = resolveProductImageUrl(
    {
      part_number: p.part_number,
      images: Array.isArray(p.images)
        ? p.images.map((img) => (typeof img === 'string' ? img : img?.url ?? '')).filter(Boolean)
        : undefined,
      image: p.primary_image ?? p.image,
      image_url: p.image_url,
    },
    API_BASE
  )
  const stock = p.stock_quantity ?? 0
  const isAvailable =
    p.availability === 'available' ||
    p.availability === 'in_stock' ||
    stock > 0

  const quickSpecs =
    (p.series || p.voltage || p.current)
      ? { series: p.series, voltage: p.voltage, current: p.current }
      : undefined

  return {
    part_number: p.part_number,
    manufacturer,
    category,
    description: p.short_description ?? p.description,
    image_url: imageUrl,
    stock_quantity: stock,
    availability: isAvailable ? 'in_stock' : 'on_request',
    price_usd: p.price_usd,
    quickSpecs,
  }
}

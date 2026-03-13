import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ProductDetail } from '@/app/product/[part_number]/ProductDetail'
import type { Metadata } from 'next'

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:8000'

interface Props {
  params: Promise<{ part_number: string }>
}

async function fetchProduct(partNumber: string) {
  const res = await fetch(
    `${API_BASE}/product/${encodeURIComponent(partNumber)}`,
    { next: { revalidate: 3600 } }
  )
  if (!res.ok) return null
  return res.json()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { part_number } = await params
  const decoded = decodeURIComponent(part_number)
  const product = await fetchProduct(decoded)
  if (!product) {
    return {
      title: `${decoded} | Industrial Automation Component | Advanced Systems`,
      description: `Buy ${decoded} industrial automation component. RFQ and availability from Advanced Systems.`,
    }
  }
  const brand = product.brand || product.manufacturer || ''
  const category = product.category || ''
  const desc = product.description?.slice(0, 155) ||
    `Buy ${decoded} industrial automation component. RFQ and availability from Advanced Systems.`
  return {
    title: `${product.part_number} | Industrial Automation Component | Advanced Systems`,
    description: category
      ? `${brand} ${product.part_number} - ${category}. ${desc}`
      : `Buy ${product.part_number} industrial automation component. RFQ and availability from Advanced Systems.`,
    openGraph: {
      title: `${product.part_number} | Industrial Automation Component | Advanced Systems`,
      description: desc,
      images: product.image_url
        ? [{ url: product.image_url.startsWith('http') ? product.image_url : `${API_BASE}${product.image_url}` }]
        : [],
    },
  }
}

export default async function DynamicProductPage({ params }: Props) {
  const { part_number } = await params
  const decoded = decodeURIComponent(part_number)
  const product = await fetchProduct(decoded)
  if (!product) notFound()

  // Normalize images for ProductDetail (expects [{ url }]); backend returns strings or image_url
  const rawImages = product.images && Array.isArray(product.images) ? product.images : []
  const images = rawImages.length
    ? rawImages.map((u: string | { url?: string }, i: number) => ({
        url: typeof u === 'string' ? u : (u as { url?: string }).url,
        is_primary: i === 0,
      })).filter((x: { url?: string }) => x.url)
    : product.image_url
      ? [{ url: product.image_url, is_primary: true }]
      : product.part_number
        ? [{ url: `/uploads/products/${product.part_number}/main.png`, is_primary: true }]
        : []

  const normalizedProduct = {
    ...product,
    images,
    image_url: product.image_url || (product.part_number ? `/uploads/products/${product.part_number}/main.png` : null),
  }

  return (
    <div className="page-container py-8">
      <Suspense fallback={<div className="h-96 skeleton rounded-xl" />}>
        <ProductDetail product={normalizedProduct} />
      </Suspense>
    </div>
  )
}

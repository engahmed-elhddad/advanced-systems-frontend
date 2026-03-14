import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getProductByPartNumber, getProductBySlug, getProductOrGenerate } from '@/lib/api'
import { ProductDetail } from './ProductDetail'
import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://advancedsystems-int.com'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

interface Props {
  params: Promise<{ part_number: string }>
}

async function fetchProduct(ident: string) {
  try {
    return await getProductByPartNumber(ident)
  } catch {
    try {
      return await getProductBySlug(ident)
    } catch {
      try {
        return await getProductOrGenerate(ident)
      } catch {
        return null
      }
    }
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { part_number } = await params
  const product = await fetchProduct(decodeURIComponent(part_number))
  if (!product) return { title: 'Product Not Found' }
  const brandName = product.brand?.name || product.manufacturer || 'Industrial'
  const categoryName = product.category?.name || product.category || 'Industrial Automation'
  const title = `${brandName} ${product.part_number} Datasheet, Specifications and Availability | Industrial Automation Supplier`
  const desc = `Find specifications, datasheet and availability for ${brandName} ${product.part_number}. Advanced Systems supplies hard-to-find industrial automation components and obsolete parts.`.slice(0, 160)
  const images = product.images || []
  const imgUrl = images[0]?.url || product.image_url
  const fullImgUrl = imgUrl ? (imgUrl.startsWith('http') ? imgUrl : `${API_BASE}${imgUrl}`) : undefined
  const canonical = `${SITE_URL}/product/${encodeURIComponent(product.part_number)}`
  const keywords = [product.part_number, brandName, categoryName, 'datasheet', 'specifications', 'availability', 'industrial automation', 'RFQ'].filter(Boolean).join(', ')
  return {
    title,
    description: desc,
    keywords,
    alternates: { canonical },
    openGraph: {
      title,
      description: desc,
      url: canonical,
      type: 'website',
      images: fullImgUrl ? [{ url: fullImgUrl, alt: product.name || product.part_number }] : [],
    },
    twitter: { card: 'summary_large_image', title, description: desc },
    robots: { index: true, follow: true },
  }
}

export const revalidate = 3600

export default async function ProductPage({ params }: Props) {
  const { part_number } = await params
  const product = await fetchProduct(decodeURIComponent(part_number))
  if (!product) notFound()

  return (
    <div className="page-container py-8">
      <Suspense fallback={<div className="h-96 skeleton rounded-xl" />}>
        <ProductDetail product={product} productBasePath="/product" />
      </Suspense>
    </div>
  )
}

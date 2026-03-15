import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getProductByPartNumber, getProductBySlug, getProductOrGenerate } from '@/lib/api'
import { SITE_URL, API_BASE_URL } from '@/app/lib/constants'
import { ProductDetail } from './ProductDetail'
import type { Metadata } from 'next'

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

const SITE_NAME = 'Advanced Systems'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { part_number } = await params
  const product = await fetchProduct(decodeURIComponent(part_number))
  if (!product) return { title: 'Product Not Found' }

  const brandName = typeof product.brand === 'string' ? product.brand : (product.brand?.name ?? product.manufacturer ?? 'Industrial')
  const categoryName = typeof product.category === 'string' ? product.category : (product.category?.name ?? '')
  const partNumber = product.part_number ?? ''

  // Title: {part_number} {brand} {category} | Advanced Systems
  const titleParts = [partNumber, brandName, categoryName].filter(Boolean)
  const title = titleParts.length > 0
    ? `${titleParts.join(' ')} | ${SITE_NAME}`
    : `${partNumber || 'Product'} | ${SITE_NAME}`

  const description =
    `Buy or request quote for ${brandName} ${partNumber}${categoryName ? ` ${categoryName}` : ''}. View specifications, datasheet and alternatives.`

  const canonical = `${SITE_URL}/product/${encodeURIComponent(partNumber)}`
  const images = product.images || []
  const imgUrl = typeof images[0] === 'string' ? images[0] : images[0]?.url ?? product.image_url
  const fullImgUrl = imgUrl ? (String(imgUrl).startsWith('http') ? imgUrl : `${API_BASE_URL}${imgUrl}`) : undefined
  const ogImage = fullImgUrl ? [{ url: String(fullImgUrl), alt: product.name || partNumber }] : []
  const keywords = [partNumber, brandName, categoryName, 'datasheet', 'specifications', 'industrial automation', 'RFQ'].filter(Boolean).join(', ')

  return {
    title,
    description: description.slice(0, 160),
    keywords,
    alternates: { canonical },
    openGraph: {
      title,
      description: description.slice(0, 160),
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
      images: ogImage,
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description.slice(0, 160),
    },
    robots: { index: true, follow: true },
  }
}

export const revalidate = 3600

export default async function ProductPage({ params }: Props) {
  const { part_number } = await params
  const product = await fetchProduct(decodeURIComponent(part_number))
  if (!product) notFound()

  return (
    <div className="page-container py-8 md:py-10">
      <Suspense fallback={<ProductPageSkeleton />}>
        <ProductDetail product={product} productBasePath="/product" />
      </Suspense>
    </div>
  )
}

/** Layout: 1 Product Hero | 2 Specifications | 3 Datasheet | 4 Cross references | 5 Related products (horizontal scroll) */
function ProductPageSkeleton() {
  return (
    <div className="space-y-10 md:space-y-14 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="aspect-square rounded-xl bg-slate-200" />
        <div className="space-y-4">
          <div className="h-8 w-48 bg-slate-200 rounded" />
          <div className="h-5 w-32 bg-slate-100 rounded" />
          <div className="h-10 w-full max-w-xs bg-slate-200 rounded-lg" />
        </div>
      </div>
      <div className="h-64 rounded-xl bg-slate-100" />
      <div className="h-24 rounded-xl bg-slate-100" />
    </div>
  )
}

import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getProductOrGenerate } from '@/lib/api'
import { ProductDetail } from '@/app/product/[part_number]/ProductDetail'
import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://advancedsystems-int.com'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

interface Props {
  params: Promise<{ part_number: string }>
}

async function fetchProduct(partNumber: string) {
  try {
    return await getProductOrGenerate(partNumber)
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { part_number } = await params
  const product = await fetchProduct(decodeURIComponent(part_number))
  if (!product) return { title: 'Product Not Found' }

  const brandName = product.brand?.name || product.manufacturer || 'Industrial'
  const categoryName = product.category?.name || product.category || 'Industrial Automation'
  const desc =
    `Find specifications, datasheet and availability for ${brandName} ${product.part_number}. Request a quote for this hard-to-find industrial automation component.`.slice(0, 160)
  const title = `${brandName} ${product.part_number} Datasheet, Specifications and Availability`

  const images = product.images || []
  const imgUrl = images[0]?.url || product.image_url
  const fullImgUrl = imgUrl
    ? imgUrl.startsWith('http')
      ? imgUrl
      : `${API_BASE}${imgUrl}`
    : undefined

  const canonical = `${SITE_URL}/part-number/${encodeURIComponent(product.part_number)}`
  const keywords = [
    product.part_number,
    brandName,
    categoryName,
    product.series,
    'datasheet',
    'specifications',
    'industrial automation',
    'RFQ',
  ].filter(Boolean).join(', ')

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
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export const revalidate = 3600 // Cache 1 hour for SEO performance

export default async function PartNumberPage({ params }: Props) {
  const { part_number } = await params
  const product = await fetchProduct(decodeURIComponent(part_number))
  if (!product) notFound()

  return (
    <div className="page-container py-8">
      <Suspense fallback={<div className="h-96 skeleton rounded-xl" />}>
        <ProductDetail product={product} productBasePath="/part-number" />
      </Suspense>
    </div>
  )
}

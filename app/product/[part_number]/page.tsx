import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getProductByPartNumber, getProductBySlug } from '@/lib/api'
import { ProductDetail } from './ProductDetail'
import type { Metadata } from 'next'

interface Props {
  params: { part_number: string }
}

async function fetchProduct(ident: string) {
  try {
    return await getProductByPartNumber(ident)
  } catch {
    try {
      return await getProductBySlug(ident)
    } catch {
      return null
    }
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await fetchProduct(decodeURIComponent(params.part_number))
  if (!product) return { title: 'Product Not Found' }
  const brandName = product.brand?.name || 'Industrial Part'
  const desc = (product.description || product.short_description || '').slice(0, 160)
  const imgUrl = product.images?.[0]?.url
  return {
    title: `${product.part_number} — ${brandName}`,
    description: desc,
    openGraph: {
      title: `${product.part_number} | Advanced Systems`,
      description: desc,
      images: imgUrl ? [{ url: imgUrl.startsWith('http') ? imgUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${imgUrl}` }] : [],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const product = await fetchProduct(decodeURIComponent(params.part_number))
  if (!product) notFound()

  return (
    <div className="page-container py-8">
        <Suspense fallback={<div className="h-96 skeleton rounded-xl" />}>
        <ProductDetail product={product} />
      </Suspense>
    </div>
  )
}

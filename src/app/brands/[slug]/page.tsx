import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { apiFetch } from '@/lib/api'
import { API_BASE_URL, SITE_URL } from '@/lib/constants'
import { BrandStorefront, type BrandDetail } from '@/components/home/BrandStorefront'

type Props = { params: Promise<{ slug: string }> }

async function fetchBrand(slug: string): Promise<BrandDetail | null> {
  try {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/brands/${encodeURIComponent(slug)}`, {
      next: { revalidate: 120 },
    })
    if (!res.ok) return null
    return (await res.json()) as BrandDetail
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const brand = await fetchBrand(decodeURIComponent(slug))
  if (!brand) {
    return { title: 'Brand' }
  }
  const title = `${brand.name} | Industrial parts`
  const desc =
    (brand.description || '').slice(0, 155) ||
    `Browse ${brand.name} industrial automation products, availability, and fast quotes at Advanced Systems.`
  return {
    title,
    description: desc,
    alternates: { canonical: `${SITE_URL}/brands/${encodeURIComponent(brand.slug || slug)}` },
    openGraph: { title, description: desc },
  }
}

export default async function BrandSlugPage({ params }: Props) {
  const { slug: raw } = await params
  const slug = decodeURIComponent(raw)
  const brand = await fetchBrand(slug)
  if (!brand) notFound()

  return <BrandStorefront brand={brand} slug={slug} />
}

import type { Metadata } from 'next'
import { apiFetch } from '@/lib/api'
import { API_BASE_URL } from '@/lib/constants'
import { BrandsDirectory, type BrandRow } from '@/components/home/BrandsDirectory'
import { canonicalPath } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Browse by Brand',
  description:
    'Explore trusted industrial automation brands — Siemens, ABB, Schneider, Omron, and more. Search, filter A–Z, request quotes on any line.',
  alternates: { canonical: canonicalPath('/brands') },
  openGraph: {
    title: 'Industrial automation brands',
    description: 'Browse manufacturers and request quotes.',
    url: canonicalPath('/brands'),
  },
}

async function fetchBrands(): Promise<BrandRow[]> {
  try {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/brands/`, {
      next: { revalidate: 120 },
    })
    if (!res.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data as BrandRow[]
  } catch {
    return []
  }
}

export default async function BrandsPage() {
  const brands = await fetchBrands()

  return <BrandsDirectory brands={brands} />
}

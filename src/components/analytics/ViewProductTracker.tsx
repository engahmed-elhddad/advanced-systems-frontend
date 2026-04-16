'use client'

import { useEffect, useRef } from 'react'
import { trackProductView } from '@/lib/analytics'

type Props = {
  partNumber: string
  productId?: number | null
  slug?: string | null
}

export function ViewProductTracker({ partNumber, productId, slug }: Props) {
  const trackedRef = useRef<string | null>(null)

  useEffect(() => {
    const normalized = (partNumber || '').trim()
    if (!normalized) return
    const key = `${normalized}:${productId ?? ''}:${slug ?? ''}`
    if (trackedRef.current === key) return
    trackProductView({
      part_number: normalized,
      ...(productId != null && Number.isFinite(productId) ? { product_id: productId } : {}),
      ...(slug != null && String(slug).trim() ? { slug: String(slug).trim() } : {}),
    })
    trackedRef.current = key
  }, [partNumber, productId, slug])

  return null
}

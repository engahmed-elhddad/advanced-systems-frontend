'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { ProductListFilters } from '@/features/products/types'

export function useProductFilters() {
  const params = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const filters = useMemo<ProductListFilters>(() => {
    const brand = params.get('brand_id')
    const category = params.get('category_id')
    const page = Number(params.get('page') ?? '1')
    const size = Number(params.get('size') ?? '24')
    const q = params.get('q') ?? undefined
    return {
      brand_id: brand ? Number(brand) : undefined,
      category_id: category ? Number(category) : undefined,
      page: Number.isFinite(page) && page > 0 ? page : 1,
      size: Number.isFinite(size) && size > 0 ? size : 24,
      q,
    }
  }, [params])

  const setFilters = useCallback(
    (next: Partial<ProductListFilters>) => {
      const sp = new URLSearchParams(params.toString())
      const merged = { ...filters, ...next }
      const setNum = (key: 'brand_id' | 'category_id' | 'page' | 'size', value?: number) => {
        if (value === undefined || Number.isNaN(value)) sp.delete(key)
        else sp.set(key, String(value))
      }
      setNum('brand_id', merged.brand_id)
      setNum('category_id', merged.category_id)
      setNum('page', merged.page)
      setNum('size', merged.size)
      if (merged.q) sp.set('q', merged.q)
      else sp.delete('q')
      const query = sp.toString()
      router.replace(query ? `${pathname}?${query}` : pathname)
    },
    [filters, params, pathname, router]
  )

  const clearFilters = useCallback(() => {
    router.replace(pathname)
  }, [pathname, router])

  return { filters, setFilters, clearFilters }
}

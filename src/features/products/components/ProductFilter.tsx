'use client'

import { useCallback, useMemo, useRef, useEffect, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select, type SelectOption } from '@/components/ui/Select'
import { useDebounce } from '@/hooks/useDebounce'
import type { ProductListFilters } from '@/features/products/types'

export interface ProductFilterProps {
  brands: { id: number; name: string }[]
  categories: { id: number; name: string }[]
  value: ProductListFilters
  onChange: (next: ProductListFilters) => void
}

export function ProductFilter({ brands, categories, value, onChange }: ProductFilterProps) {
  const [qInput, setQInput] = useState(value.q ?? '')
  const debouncedQ = useDebounce(qInput, 300)
  const valueRef = useRef(value)
  valueRef.current = value

  useEffect(() => {
    setQInput(value.q ?? '')
  }, [value.q])

  const brandOptions: SelectOption[] = useMemo(
    () => [
      { value: '', label: 'All brands' },
      ...brands.map((b) => ({ value: String(b.id), label: b.name })),
    ],
    [brands]
  )

  const categoryOptions: SelectOption[] = useMemo(
    () => [
      { value: '', label: 'All categories' },
      ...categories.map((c) => ({ value: String(c.id), label: c.name })),
    ],
    [categories]
  )

  useEffect(() => {
    const v = valueRef.current
    onChange({ ...v, q: debouncedQ || undefined, page: 1 })
  }, [debouncedQ, onChange])

  const setBrand = useCallback(
    (v: string) => {
      onChange({
        ...valueRef.current,
        brand_id: v ? Number(v) : undefined,
        page: 1,
      })
    },
    [onChange]
  )

  const setCategory = useCallback(
    (v: string) => {
      onChange({
        ...valueRef.current,
        category_id: v ? Number(v) : undefined,
        page: 1,
      })
    },
    [onChange]
  )

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Input
        label="Search"
        name="q"
        value={qInput}
        onChange={(e) => setQInput(e.target.value)}
        placeholder="Part number or keyword"
      />
      <Select
        label="Brand"
        name="brand_id"
        options={brandOptions}
        value={value.brand_id != null ? String(value.brand_id) : ''}
        onChange={setBrand}
        placeholder="All brands"
      />
      <Select
        label="Category"
        name="category_id"
        options={categoryOptions}
        value={value.category_id != null ? String(value.category_id) : ''}
        onChange={setCategory}
        placeholder="All categories"
        searchable
      />
    </div>
  )
}

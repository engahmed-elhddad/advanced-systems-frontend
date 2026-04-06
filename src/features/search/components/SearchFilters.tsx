'use client'

import { Select, type SelectOption } from '@/components/ui/Select'

export interface SearchFiltersProps {
  brandId: string
  categoryId: string
  onBrandChange: (v: string) => void
  onCategoryChange: (v: string) => void
  brands: { id: number; name: string }[]
  categories: { id: number; name: string }[]
}

export function SearchFilters({
  brandId,
  categoryId,
  onBrandChange,
  onCategoryChange,
  brands,
  categories,
}: SearchFiltersProps) {
  const brandOptions: SelectOption[] = [
    { value: '', label: 'All brands' },
    ...brands.map((b) => ({ value: String(b.id), label: b.name })),
  ]
  const categoryOptions: SelectOption[] = [
    { value: '', label: 'All categories' },
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Select label="Brand" name="brand_id" options={brandOptions} value={brandId} onChange={onBrandChange} />
      <Select
        label="Category"
        name="category_id"
        options={categoryOptions}
        value={categoryId}
        onChange={onCategoryChange}
        searchable
      />
    </div>
  )
}

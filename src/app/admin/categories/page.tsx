'use client'

import { CatalogEntityAdminPage } from '@/app/admin/_components/CatalogEntityAdminPage'

export default function AdminCategoriesPage() {
  return (
    <CatalogEntityAdminPage
      kind="category"
      title="Categories"
      description="Manage product categories. Names use Title Case; duplicates are blocked case-insensitively."
    />
  )
}

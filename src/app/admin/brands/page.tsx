'use client'

import { CatalogEntityAdminPage } from '@/app/admin/_components/CatalogEntityAdminPage'

export default function AdminBrandsPage() {
  return (
    <CatalogEntityAdminPage
      kind="brand"
      title="Brands"
      description="Manage catalog brands. Names are stored in UPPERCASE; duplicates are blocked case-insensitively."
    />
  )
}

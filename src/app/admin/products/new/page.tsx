'use client'

import { Suspense, useMemo, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useBrands } from '@/features/products/hooks/useBrands'
import { useCategories } from '@/features/products/hooks/useCategories'
import { getApiErrorMessage, isDuplicatePartNumberConflict } from '@/lib/api'
import { useAdminProduct, useCreateAdminProduct } from '@/features/products/hooks/useProducts'
import { Card, Skeleton } from '@/components/ui'
import { ProductForm } from '../_components/ProductForm'
import toast from 'react-hot-toast'

const emptyCreateForm = {
  name: '',
  partNumber: '',
  brandId: '',
  categoryId: '',
  description: '',
  specs: [] as { key: string; value: string }[],
  imageUrl: '',
  datasheetUrl: '',
  status: 'Draft' as const,
  condition: 'new' as const,
  quantity: 1,
  priceEGP: null,
  shelfLocation: '',
  binLabel: '',
}

function NewAdminProductPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const duplicateId = Number(searchParams.get('duplicate') ?? '')
  const dupEnabled = Number.isFinite(duplicateId) && duplicateId > 0

  const brandsQuery = useBrands()
  const categoriesQuery = useCategories()
  const dupQuery = useAdminProduct(dupEnabled ? duplicateId : 0)
  const createMutation = useCreateAdminProduct()
  const [partNumberError, setPartNumberError] = useState<string | null>(null)

  const brandOptions = (brandsQuery.data ?? [])
    .filter((b: { id?: unknown }) => b.id != null && String(b.id).trim() !== '')
    .map((b: { id: number | string; name?: string }) => ({ value: String(b.id), label: String(b.name ?? '') }))
  const categoryOptions = (categoriesQuery.data ?? [])
    .filter((c: { id?: unknown }) => c.id != null && String(c.id).trim() !== '')
    .map((c: { id: number | string; name?: string }) => ({ value: String(c.id), label: String(c.name ?? '') }))

  const duplicateSource = dupQuery.data

  const initialFromDuplicate = useMemo(() => {
    if (!duplicateSource) return null
    return {
      name: `${duplicateSource.name} (copy)`,
      partNumber: '',
      brandId: duplicateSource.brandId || '',
      categoryId: duplicateSource.categoryId || '',
      description: duplicateSource.description,
      specs: duplicateSource.specs.map((s) => ({ key: s.key, value: s.value })),
      imageUrl: duplicateSource.imageUrl,
      datasheetUrl: duplicateSource.datasheetUrl,
      status: duplicateSource.status,
    }
  }, [duplicateSource])

  useEffect(() => {
    if (!dupEnabled) return
    if (dupQuery.isError) {
      toast.error('Could not load product to duplicate. Start fresh or try another id.')
    }
  }, [dupEnabled, dupQuery.isError])

  const formKey = dupEnabled ? `dup-${duplicateId}-${dupQuery.dataUpdatedAt}` : 'create-new'
  const initialValue = initialFromDuplicate ?? emptyCreateForm

  const catalogsLoading = brandsQuery.isLoading || categoriesQuery.isLoading
  const dupLoading = dupEnabled && dupQuery.isLoading

  return (
      <div className="space-y-6" data-testid="admin-create-product-page">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm text-gray-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">{dupEnabled ? 'Duplicate Product' : 'Create Product'}</h1>
          <p className="mt-1 text-sm text-gray-300">
            {dupEnabled
              ? 'Prefilled from the source product. Update the name and save as a new catalog row.'
              : 'Add a new product with structured specs and media.'}
          </p>
        </div>

        {catalogsLoading || dupLoading ? (
          <Card className="space-y-3 border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <Skeleton className="h-12 w-full bg-white/10" />
            <Skeleton className="h-12 w-full bg-white/10" />
            <Skeleton className="h-12 w-full bg-white/10" />
          </Card>
        ) : dupEnabled && !duplicateSource ? (
          <Card className="rounded-lg border border-white/10 bg-white/5 p-6 text-sm text-gray-300">
            Product not found in the current catalog list (first 200 items). Open the product in admin and use Duplicate from the edit screen, or reduce list filters.
          </Card>
        ) : (
          <div data-testid="admin-product-form-ready">
          <ProductForm
            key={formKey}
            mode="create"
            loading={createMutation.isPending}
            brandOptions={brandOptions}
            categoryOptions={categoryOptions}
            initialValue={initialValue}
            partNumberError={partNumberError}
            onClearPartNumberError={() => setPartNumberError(null)}
            onSubmit={async (payload) => {
              setPartNumberError(null)
              try {
                await createMutation.mutateAsync(payload)
                toast.success('Product created')
                router.push('/admin/products')
              } catch (error) {
                if (isDuplicatePartNumberConflict(error)) {
                  setPartNumberError('Part number already exists')
                  toast.error('Part number already exists')
                  return
                }
                toast.error(getApiErrorMessage(error, 'Failed to create product'))
              }
            }}
          />
          </div>
        )}
      </div>
  )
}

export default function NewAdminProductPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Card className="space-y-3 border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <Skeleton className="h-12 w-full bg-white/10" />
            <Skeleton className="h-12 w-full bg-white/10" />
            <Skeleton className="h-12 w-full bg-white/10" />
          </Card>
        </div>
      }
    >
      <NewAdminProductPageInner />
    </Suspense>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useBrands } from '@/features/products/hooks/useBrands'
import { useCategories } from '@/features/products/hooks/useCategories'
import { getApiErrorMessage } from '@/lib/api'
import { useCreateAdminProduct } from '@/features/products/hooks/useProducts'
import { Card, Skeleton } from '@/components/ui'
import { ProductForm } from '../_components/ProductForm'
import toast from 'react-hot-toast'

export default function NewAdminProductPage() {
  const router = useRouter()
  const brandsQuery = useBrands()
  const categoriesQuery = useCategories()
  const createMutation = useCreateAdminProduct()

  const brandOptions = (brandsQuery.data ?? []).map((b: any) => ({ value: String(b.id), label: String(b.name) }))
  const categoryOptions = (categoriesQuery.data ?? []).map((c: any) => ({ value: String(c.id), label: String(c.name) }))

  return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm text-gray-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">Create Product</h1>
          <p className="mt-1 text-sm text-gray-300">Add a new product with structured specs and media.</p>
        </div>

        {brandsQuery.isLoading || categoriesQuery.isLoading ? (
          <Card className="space-y-3 border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <Skeleton className="h-12 w-full bg-white/10" />
            <Skeleton className="h-12 w-full bg-white/10" />
            <Skeleton className="h-12 w-full bg-white/10" />
          </Card>
        ) : (
          <ProductForm
            mode="create"
            loading={createMutation.isPending}
            brandOptions={brandOptions}
            categoryOptions={categoryOptions}
            initialValue={{
              name: '',
              brandId: String(brandOptions[0]?.value ?? ''),
              categoryId: String(categoryOptions[0]?.value ?? ''),
              description: '',
              specs: [],
              imageUrl: '',
              datasheetUrl: '',
              status: 'Draft',
            }}
            onSubmit={async (payload) => {
              try {
                await createMutation.mutateAsync(payload)
                toast.success('Product created')
                router.push('/admin/products')
              } catch (error) {
                toast.error(getApiErrorMessage(error, 'Failed to create product'))
              }
            }}
          />
        )}
      </div>
  )
}

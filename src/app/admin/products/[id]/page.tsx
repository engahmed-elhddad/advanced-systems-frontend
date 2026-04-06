'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { Card, Skeleton } from '@/components/ui'
import { useBrands } from '@/hooks/useBrands'
import { useCategories } from '@/hooks/useCategories'
import { getApiErrorMessage } from '@/lib/api'
import { useAdminProduct, useUpdateAdminProduct } from '@/hooks/useProducts'
import { ProductForm } from '../_components/ProductForm'
import toast from 'react-hot-toast'

export default function AdminEditProductPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const productId = Number(params.id)
  const productQuery = useAdminProduct(productId)
  const updateMutation = useUpdateAdminProduct()
  const brandsQuery = useBrands()
  const categoriesQuery = useCategories()

  const product = productQuery.data
  const loading = productQuery.isLoading
  const brandOptions = (brandsQuery.data ?? []).map((b: any) => ({ value: String(b.id), label: String(b.name) }))
  const categoryOptions = (categoriesQuery.data ?? []).map((c: any) => ({ value: String(c.id), label: String(c.name) }))

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm text-gray-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">Edit Product</h1>
          <p className="mt-1 text-sm text-gray-300">Update product details, specs, image, and datasheet.</p>
        </div>

        {loading || !product ? (
          <Card className="space-y-4 border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            {loading ? (
              <>
                <Skeleton className="h-5 w-40 bg-white/10" />
                <Skeleton className="h-12 w-full bg-white/10" />
                <Skeleton className="h-12 w-full bg-white/10" />
                <Skeleton className="h-24 w-full bg-white/10" />
              </>
            ) : (
              <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-sm text-gray-300">
                Product not found.
              </div>
            )}
          </Card>
        ) : (
          <ProductForm
            mode="edit"
            loading={updateMutation.isPending}
            brandOptions={brandOptions}
            categoryOptions={categoryOptions}
            initialValue={{
              name: product.name,
              brandId: product.brandId,
              categoryId: product.categoryId,
              description: product.description,
              specs: product.specs,
              imageUrl: product.imageUrl,
              datasheetUrl: product.datasheetUrl,
              status: product.status,
            }}
            onSubmit={async (payload) => {
              try {
                await updateMutation.mutateAsync({ id: product.id, input: payload })
                toast.success('Product updated')
                router.push('/admin/products')
              } catch (error) {
                toast.error(getApiErrorMessage(error, 'Failed to update product'))
              }
            }}
          />
        )}
      </div>
    </AdminLayout>
  )
}

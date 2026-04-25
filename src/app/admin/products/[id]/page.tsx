'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Copy, Loader2 } from 'lucide-react'
import { Button, Card, Skeleton } from '@/components/ui'
import { useBrands } from '@/features/products/hooks/useBrands'
import { useCategories } from '@/features/products/hooks/useCategories'
import { api, getApiErrorMessage } from '@/lib/api'
import { useAdminProduct, useUpdateAdminProduct } from '@/features/products/hooks/useProducts'
import { ProductForm } from '../_components/ProductForm'
import { ProductInventorySection } from '../_components/ProductInventorySection'
import { ProductOffersSection } from '../_components/ProductOffersSection'
import toast from 'react-hot-toast'

export default function AdminEditProductPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const productId = Number(params.id)
  const productQuery = useAdminProduct(productId)
  const updateMutation = useUpdateAdminProduct()
  const brandsQuery = useBrands()
  const categoriesQuery = useCategories()

  const enrichMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/api/v1/admin/enrich/${id}`)
    },
    onSuccess: async () => {
      toast.success('Product enriched successfully')
      await productQuery.refetch()
    },
    onError: () => {
      toast.error('Enrichment failed')
    },
  })

  const product = productQuery.data
  const loading = productQuery.isLoading
  const brandOptions = (brandsQuery.data ?? [])
    .filter((b: { id?: unknown }) => b.id != null && String(b.id).trim() !== '')
    .map((b: { id: number | string; name?: string }) => ({ value: String(b.id), label: String(b.name ?? '') }))
  const categoryOptions = (categoriesQuery.data ?? [])
    .filter((c: { id?: unknown }) => c.id != null && String(c.id).trim() !== '')
    .map((c: { id: number | string; name?: string }) => ({ value: String(c.id), label: String(c.name ?? '') }))

  return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm text-gray-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-white">Edit Product</h1>
              {product?.is_enriched ? (
                <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-200">
                  ✓ Enriched
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-gray-300">Update product details, specs, image, and datasheet.</p>
          </div>
          {product ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                surface="dark"
                className="shrink-0"
                disabled={loading || enrichMutation.isPending}
                onClick={() => enrichMutation.mutate(product.id)}
              >
                {enrichMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                ✨ Enrich
              </Button>
              <Button asChild type="button" variant="secondary" surface="dark" className="shrink-0">
                <Link href={`/admin/products/new?duplicate=${product.id}`}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate as new
                </Link>
              </Button>
            </div>
          ) : null}
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
          <>
            <ProductForm
              mode="edit"
              loading={updateMutation.isPending}
              brandOptions={brandOptions}
              categoryOptions={categoryOptions}
              initialValue={{
                name: product.name,
                brandId: product.brandId != null ? String(product.brandId) : '',
                categoryId: product.categoryId != null ? String(product.categoryId) : '',
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
            <ProductOffersSection productId={product.id} />
            <ProductInventorySection productId={product.id} />
          </>
        )}
      </div>
  )
}

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Boxes } from 'lucide-react'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { Badge, Button, Card, Input, Skeleton } from '@/components/ui'
import { getApiErrorMessage } from '@/lib/api'
import { useAdminProducts, useDeleteAdminProduct, type AdminProductStatus } from '@/hooks/useProducts'
import toast from 'react-hot-toast'

const FALLBACK_IMAGE = 'https://placehold.co/80x80/111827/9CA3AF?text=No+Img'

function ProductRowsSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index}>
          <td colSpan={6} className="px-2 py-2">
            <Skeleton className="h-14 w-full rounded-lg bg-white/10" />
          </td>
        </tr>
      ))}
    </>
  )
}

function statusVariant(status: AdminProductStatus) {
  return status === 'Active' ? 'success' : 'default'
}

export default function AdminProductsListPage() {
  const [query, setQuery] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const productsQuery = useAdminProducts({ page: 1, size: 100, search: query })
  const deleteMutation = useDeleteAdminProduct()

  useEffect(() => {
    if (productsQuery.isError) {
      toast.error(getApiErrorMessage(productsQuery.error, 'Failed to load products'))
    }
  }, [productsQuery.isError, productsQuery.error])

  const filtered = useMemo(() => {
    return productsQuery.data?.items ?? []
  }, [productsQuery.data])

  async function onDelete(productId: number) {
    setDeletingId(productId)
    try {
      await deleteMutation.mutateAsync(productId)
      toast.success('Product deleted')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete product'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Products</h1>
            <p className="mt-1 text-sm text-gray-300">Manage your catalog with premium workflow controls.</p>
          </div>
          <Button asChild leftIcon={<Plus className="h-4 w-4" />}>
            <Link href="/admin/products/new" aria-label="Add new product">
              Add Product
            </Link>
          </Button>
        </div>

        <Card className="border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <Input
            placeholder="Search by product, brand, or category"
            aria-label="Search products"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </Card>

        <Card className="overflow-hidden border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-300">
                  <th className="px-4 py-2">Image</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Brand</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {productsQuery.isLoading ? (
                  <ProductRowsSkeleton />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-gray-300">
                        <div className="rounded-full border border-white/10 bg-white/5 p-3">
                          <Boxes className="h-6 w-6" />
                        </div>
                        <p className="text-base font-medium text-white">No products yet</p>
                        <p className="text-sm text-gray-400">Create your first catalog item to start managing inventory.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((product) => (
                    <tr
                      key={product.id}
                      className="rounded-lg bg-white/5 text-gray-100 transition-all duration-300 hover:scale-[1.02] hover:bg-white/10 hover:shadow-[0_0_24px_rgba(255,122,0,0.12)]"
                    >
                      <td className="rounded-l-lg px-4 py-3">
                        <Image
                          src={product.imageUrl || FALLBACK_IMAGE}
                          alt={product.name}
                          width={48}
                          height={48}
                          loading="lazy"
                          unoptimized
                          className="h-12 w-12 rounded-md border border-white/10 object-cover"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-white">{product.name}</td>
                      <td className="px-4 py-3 text-gray-300">{product.brand}</td>
                      <td className="px-4 py-3 text-gray-300">{product.category}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(product.status)}>{product.status}</Badge>
                      </td>
                      <td className="rounded-r-lg px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button asChild size="sm" variant="secondary">
                            <Link href={`/admin/products/${product.id}`} aria-label={`Edit ${product.name}`}>
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            loading={deletingId === product.id || deleteMutation.isPending}
                            aria-label={`Delete ${product.name}`}
                            onClick={() => onDelete(product.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}

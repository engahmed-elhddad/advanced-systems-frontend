'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getProducts } from '@/lib/api'
import { ProductCard } from '@/components/products/ProductCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function ProductsClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [products, setProducts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const page = Number(searchParams.get('page') || 1)
  const category = searchParams.get('category') || ''
  const brand = searchParams.get('brand') || ''
  const sort = searchParams.get('sort') || 'newest'

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getProducts({ page, limit: 24, category, brand, sort })
      setProducts(data.items || [])
      setTotal(data.total || 0)
      setPages(data.pages || 1)
    } catch {}
    setLoading(false)
  }, [page, category, brand, sort])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.set('page', '1')
    router.push(`/products?${params.toString()}`)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          {!loading && <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} results found</p>}
        </div>
        <select
          value={sort}
          onChange={e => updateParam('sort', e.target.value)}
          className="input text-sm py-2 w-auto max-w-[140px]"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      {(category || brand) && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {category && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-full text-sm text-primary-700 font-medium">
              Category: {category}
              <button onClick={() => updateParam('category', '')} className="ml-1 hover:text-primary-800">×</button>
            </span>
          )}
          {brand && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-full text-sm text-primary-700 font-medium">
              Brand: {brand}
              <button onClick={() => updateParam('brand', '')} className="ml-1 hover:text-primary-800">×</button>
            </span>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-80 bg-gray-100 rounded-xl skeleton" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24 text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-lg font-medium">No products found.</p>
          <button onClick={() => router.push('/products')} className="mt-4 btn-secondary">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(p => (
            <ProductCard
              key={p.part_number}
              part_number={p.part_number}
              manufacturer={p.brand?.name ?? p.manufacturer}
              category={p.category?.name ?? p.category}
              description={p.short_description ?? p.description}
              image_url={p.images?.[0]?.url ?? p.primary_image ?? p.image_url}
              stock_quantity={p.stock_quantity}
              availability={p.availability === 'available' || (p.stock_quantity ?? 0) > 0 ? 'in_stock' : 'on_request'}
              price_usd={p.price_usd}
            />
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            onClick={() => updateParam('page', String(page - 1))}
            disabled={page <= 1}
            className="btn-secondary p-2 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-500 px-4">Page {page} of {pages}</span>
          <button
            onClick={() => updateParam('page', String(page + 1))}
            disabled={page >= pages}
            className="btn-secondary p-2 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

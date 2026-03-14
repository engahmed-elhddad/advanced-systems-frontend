import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ProductCard } from '@/components/products/ProductCard'
import { productToCardProps } from '@/lib/productMappers'

const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://advancedsystems-int.com'

const RESERVED = new Set(['news', 'product', 'datasheet', 'alternatives', 'search', 'rfq', 'products', 'brands', 'categories', 'tools'])

type Props = { params: Promise<{ locale: string; matrixSlug: string }> }

export async function generateMetadata({ params }: Props) {
  const { locale, matrixSlug } = await params
  if (RESERVED.has(matrixSlug)) return { title: 'Not Found' }

  try {
    const res = await fetch(`${API}/api/matrix/${encodeURIComponent(matrixSlug)}?limit=1`, { next: { revalidate: 3600 } })
    if (!res.ok) return { title: 'Not Found' }
    const data = await res.json()
    const brand = data.brand || ''
    const category = data.category || ''
    const condition = data.condition ? ` ${data.condition}` : ''
    const title = `${brand} ${category}${condition} | Industrial Automation | Advanced Systems`
    const desc = `Buy ${brand} ${category} industrial automation parts. Specifications, datasheets and RFQ. Advanced Systems supplies hard-to-find components.`.slice(0, 160)
    const canonical = `${SITE}/${locale}/${matrixSlug}`
    return {
      title,
      description: desc,
      alternates: {
        canonical,
        languages: { en: `${SITE}/en/${matrixSlug}`, ar: `${SITE}/ar/${matrixSlug}` },
      },
    }
  } catch {
    return { title: 'Not Found' }
  }
}

export const revalidate = 3600

export default async function MatrixPage({ params }: Props) {
  const { locale, matrixSlug } = await params
  if (RESERVED.has(matrixSlug)) notFound()

  let data: { slug: string; brand: string; category: string; condition?: string; products: unknown[]; total: number; related_news: unknown[] }
  try {
    const res = await fetch(`${API}/api/matrix/${encodeURIComponent(matrixSlug)}?limit=48`, { next: { revalidate: 3600 } })
    if (!res.ok) notFound()
    data = await res.json()
  } catch {
    notFound()
  }

  const t = locale === 'ar' ? { news: 'آخر الأخبار', viewProduct: 'عرض المنتج', products: 'المنتجات' } : { news: 'Latest News', viewProduct: 'View Product', products: 'Products' }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-10">
        <nav className="text-sm text-slate-500 mb-6">
          <Link href={`/${locale}`} className="hover:text-primary-600">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900 font-medium">{data.brand} {data.category}{data.condition ? ` (${data.condition})` : ''}</span>
        </nav>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {data.brand} {data.category}{data.condition ? ` – ${data.condition}` : ''}
        </h1>
        <p className="text-slate-600 mb-8">
          {data.total} industrial automation components. Request a quote for specifications and availability.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {(data.products || []).map((p: Record<string, unknown>) => (
            <ProductCard key={String(p.part_number)} {...productToCardProps(p as never)} productBasePath="/product" />
          ))}
        </div>

        {(data.related_news?.length ?? 0) > 0 && (
          <section className="mt-12 pt-10 border-t border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">{t.news}: {data.brand} {data.category}</h2>
            <ul className="space-y-3">
              {(data.related_news || []).map((n: Record<string, unknown>) => (
                <li key={String(n.slug)}>
                  <Link href={`/${locale}/news/${n.slug}`} className="text-primary-600 hover:underline font-medium">
                    {(locale === 'ar' ? n.title_ar : n.title_en) || n.title_en}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

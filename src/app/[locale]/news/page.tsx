import { apiFetch } from '@/lib/api'
import Link from 'next/link'
import { Newspaper } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://advancedsystems-int.com'

const CATEGORIES = [
  { slug: 'automation', labelEn: 'Automation', labelAr: 'أتمتة' },
  { slug: 'plc', labelEn: 'PLC', labelAr: 'PLC' },
  { slug: 'robotics', labelEn: 'Robotics', labelAr: 'الروبوتات' },
  { slug: 'electrical-industry', labelEn: 'Electrical Industry', labelAr: 'الصناعة الكهربائية' },
  { slug: 'product-releases', labelEn: 'Product Releases', labelAr: 'إصدارات المنتجات' },
]

type Props = { params: Promise<{ locale: string }> }

export const metadata = {
  title: 'Industrial Automation News | Advanced Systems',
  description: 'Latest news on PLCs, robotics, automation and electrical industry.',
}

export const revalidate = 3600

export default async function NewsPage({ params }: Props) {
  const { locale } = await params

  let items: { slug: string; title_en?: string; title_ar?: string; summary_en?: string; published_date?: string; category?: string }[] = []
  try {
    const res = await apiFetch(`${API}/api/news?limit=30`, { next: { revalidate: 3600 } })
    if (res.ok) {
      const data = await res.json()
      items = data.items || []
    }
  } catch {
    /* ignore */
  }

  const t = locale === 'ar'
    ? { title: 'أخبار الصناعة', subtitle: 'آخر أخبار الأتمتة الصناعية والـ PLC والروبوتات' }
    : { title: 'Industrial News', subtitle: 'Latest automation, PLC, robotics and electrical industry news' }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-10">
        <div className="mb-10">
          <span className="inline-flex items-center gap-2 text-primary-600 font-semibold mb-4">
            <Newspaper className="w-5 h-5" />
            News
          </span>
          <h1 className="text-3xl font-bold text-slate-900">{t.title}</h1>
          <p className="text-slate-600 mt-2">{t.subtitle}</p>
        </div>

        <div className="flex gap-2 flex-wrap mb-8">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/${locale}/news?category=${c.slug}`}
              className="px-4 py-2 rounded-lg border border-slate-200 hover:border-primary-500 hover:bg-primary-50 text-sm font-medium"
            >
              {locale === 'ar' ? c.labelAr : c.labelEn}
            </Link>
          ))}
        </div>

        {items.length > 0 ? (
          <div className="space-y-6">
            {items.map((a) => (
              <Link
                key={a.slug}
                href={`/${locale}/news/${a.slug}`}
                className="block rounded-xl border border-slate-200 bg-white p-6 hover:border-primary-300 hover:shadow-sm transition"
              >
                <h2 className="text-lg font-semibold text-slate-900 mb-2">
                  {(locale === 'ar' ? a.title_ar : a.title_en) || a.title_en}
                </h2>
                {a.summary_en && <p className="text-slate-600 text-sm line-clamp-2">{a.summary_en}</p>}
                {a.published_date && <p className="text-slate-400 text-xs mt-2">{new Date(a.published_date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en')}</p>}
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            No news articles yet. Check back soon.
          </div>
        )}
      </div>
    </div>
  )
}

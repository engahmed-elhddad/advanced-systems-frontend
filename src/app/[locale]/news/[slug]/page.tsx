import { apiFetch } from '@/lib/api'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://advancedsystems-int.com'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params
  try {
    const res = await apiFetch(`${API}/api/news/${encodeURIComponent(slug)}`, { next: { revalidate: 3600 } })
    if (!res.ok) return { title: 'Article Not Found' }
    const a = await res.json()
    const title = (locale === 'ar' ? a.title_ar : a.title_en) || a.title_en || 'News'
    const desc = (a.summary_en || a.summary_ar || '').slice(0, 160)
    const canonical = `${SITE}/${locale}/news/${slug}`
    return {
      title: `${title} | Advanced Systems News`,
      description: desc,
      alternates: {
        canonical,
        languages: { en: `${SITE}/en/news/${slug}`, ar: `${SITE}/ar/news/${slug}` },
      },
    }
  } catch {
    return { title: 'Article Not Found' }
  }
}

export const revalidate = 3600

export default async function NewsArticlePage({ params }: Props) {
  const { locale, slug } = await params

  let article: { title_en?: string; title_ar?: string; content_en?: string; content_ar?: string; image_url?: string; source?: string; published_date?: string }
  try {
    const res = await apiFetch(`${API}/api/news/${encodeURIComponent(slug)}`, { next: { revalidate: 3600 } })
    if (!res.ok) notFound()
    article = await res.json()
  } catch {
    notFound()
  }

  const title = (locale === 'ar' ? article.title_ar : article.title_en) || article.title_en
  const content = (locale === 'ar' ? article.content_ar : article.content_en) || article.content_en

  return (
    <div className="min-h-screen bg-slate-50">
      <article className="page-container py-10 max-w-3xl">
        <Link href={`/${locale}/news`} className="inline-flex items-center gap-2 text-primary-600 hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to News
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-4">{title}</h1>
        {article.published_date && (
          <time className="text-slate-500 text-sm" dateTime={article.published_date}>
            {new Date(article.published_date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en', { dateStyle: 'long' })}
          </time>
        )}
        {article.source && <p className="text-slate-500 text-sm mt-1">Source: {article.source}</p>}

        {article.image_url && (
          <div className="relative aspect-video mt-6 rounded-xl overflow-hidden bg-slate-100">
            <Image src={article.image_url} alt={title || ''} fill className="object-cover" sizes="(max-width: 768px) 100vw, 672px" />
          </div>
        )}

        <div className="mt-8 prose prose-slate max-w-none whitespace-pre-wrap text-slate-700">
          {content || 'Content not available.'}
        </div>
      </article>
    </div>
  )
}

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ENGINEERING_GUIDES } from '@/app/lib/knowledge-hub/content'

const CATEGORY_LABELS: Record<string, string> = {
  motors: 'Motors',
  plc: 'PLC',
  sensors: 'Sensors',
  electrical: 'Electrical',
  safety: 'Safety',
  general: 'General',
}

export async function generateStaticParams() {
  return ENGINEERING_GUIDES.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const guide = ENGINEERING_GUIDES.find((g) => g.slug === slug)
  if (!guide) return { title: 'Guide Not Found' }
  return {
    title: `${guide.title} | Engineering Knowledge Hub`,
    description: guide.excerpt,
  }
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const guide = ENGINEERING_GUIDES.find((g) => g.slug === slug)
  if (!guide) notFound()

  return (
    <div className="min-h-screen bg-slate-50">
      <article className="max-w-3xl mx-auto px-4 py-12">
        <nav className="text-sm text-slate-500 mb-6">
          <Link href="/knowledge" className="hover:text-primary-600">Knowledge Hub</Link>
          <span className="mx-2">/</span>
          <Link href="/knowledge/guides" className="hover:text-primary-600">Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900 font-medium">{guide.title}</span>
        </nav>

        <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
          {CATEGORY_LABELS[guide.category] || guide.category}
        </span>
        <h1 className="text-3xl font-bold text-slate-900 mt-4">{guide.title}</h1>
        <p className="text-lg text-slate-600 mt-2">{guide.excerpt}</p>

        <div className="prose prose-slate max-w-none mt-8">
          {guide.sections.map((s, i) => (
            <section key={i} className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-3">{s.heading}</h2>
              <p className="text-slate-700 leading-relaxed">{s.content}</p>
            </section>
          ))}
        </div>

        {guide.products && guide.products.length > 0 && (
          <div className="mt-10 p-6 rounded-xl border border-slate-200 bg-white">
            <h3 className="font-semibold text-slate-900 mb-3">Related products</h3>
            <ul className="space-y-2">
              {guide.products.map((p) => (
                <li key={p.part_number}>
                  <Link
                    href={`/products/${encodeURIComponent(p.part_number)}`}
                    className="font-mono text-primary-600 hover:underline"
                  >
                    {p.part_number}
                  </Link>
                  {p.label && <span className="text-slate-600 ml-2">– {p.label}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-slate-200">
          <Link href="/knowledge/guides" className="text-primary-600 hover:underline font-medium">
            ← All guides
          </Link>
        </div>
      </article>
    </div>
  )
}

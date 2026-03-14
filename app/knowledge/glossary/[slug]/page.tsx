import { notFound } from 'next/navigation'
import Link from 'next/link'
import { GLOSSARY_TERMS } from '@/app/lib/knowledge-hub/content'

export async function generateStaticParams() {
  return GLOSSARY_TERMS.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const term = GLOSSARY_TERMS.find((t) => t.slug === slug)
  if (!term) return { title: 'Term Not Found' }
  return {
    title: `${term.term} – Industrial Glossary`,
    description: term.definition.slice(0, 160),
  }
}

export default async function GlossaryTermPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const term = GLOSSARY_TERMS.find((t) => t.slug === slug)
  if (!term) notFound()

  return (
    <div className="min-h-screen bg-slate-50">
      <article className="max-w-3xl mx-auto px-4 py-12">
        <nav className="text-sm text-slate-500 mb-6">
          <Link href="/knowledge" className="hover:text-primary-600">Knowledge Hub</Link>
          <span className="mx-2">/</span>
          <Link href="/knowledge/glossary" className="hover:text-primary-600">Glossary</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900 font-medium">{term.term}</span>
        </nav>

        <h1 className="text-3xl font-bold text-slate-900">{term.term}</h1>
        <p className="text-lg text-slate-700 mt-4 leading-relaxed">{term.definition}</p>

        {term.relatedTerms && term.relatedTerms.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-slate-900 mb-2">Related terms</h3>
            <div className="flex flex-wrap gap-2">
              {term.relatedTerms.map((rt) => {
                const t = GLOSSARY_TERMS.find((x) => x.term.toLowerCase() === rt.toLowerCase())
                return t ? (
                  <Link
                    key={t.slug}
                    href={`/knowledge/glossary/${t.slug}`}
                    className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-primary-100 hover:text-primary-700 text-sm"
                  >
                    {t.term}
                  </Link>
                ) : (
                  <span key={rt} className="px-3 py-1 rounded-lg bg-slate-100 text-slate-500 text-sm">{rt}</span>
                )
              })}
            </div>
          </div>
        )}

        {term.products && term.products.length > 0 && (
          <div className="mt-8 p-6 rounded-xl border border-slate-200 bg-white">
            <h3 className="font-semibold text-slate-900 mb-3">Related products</h3>
            <ul className="space-y-2">
              {term.products.map((p) => (
                <li key={p.part_number}>
                  <Link
                    href={`/part-number/${encodeURIComponent(p.part_number)}`}
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
          <Link href="/knowledge/glossary" className="text-primary-600 hover:underline font-medium">
            ← All glossary terms
          </Link>
        </div>
      </article>
    </div>
  )
}

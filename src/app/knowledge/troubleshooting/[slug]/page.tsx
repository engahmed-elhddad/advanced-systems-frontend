import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TROUBLESHOOTING_GUIDES } from '@/lib/knowledge-hub/content'

export async function generateStaticParams() {
  return TROUBLESHOOTING_GUIDES.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const guide = TROUBLESHOOTING_GUIDES.find((g) => g.slug === slug)
  if (!guide) return { title: 'Guide Not Found' }
  return {
    title: `${guide.title} | Troubleshooting`,
    description: guide.excerpt,
  }
}

export default async function TroubleshootingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const guide = TROUBLESHOOTING_GUIDES.find((g) => g.slug === slug)
  if (!guide) notFound()

  return (
    <div className="min-h-screen bg-slate-50">
      <article className="max-w-3xl mx-auto px-4 py-12">
        <nav className="text-sm text-slate-500 mb-6">
          <Link href="/knowledge" className="hover:text-primary-600">Knowledge Hub</Link>
          <span className="mx-2">/</span>
          <Link href="/knowledge/troubleshooting" className="hover:text-primary-600">Troubleshooting</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900 font-medium">{guide.title}</span>
        </nav>

        <h1 className="text-3xl font-bold text-slate-900">{guide.title}</h1>
        <p className="text-lg text-slate-600 mt-2">{guide.excerpt}</p>
        <p className="text-sm text-amber-700 bg-amber-50 px-4 py-2 rounded-lg mt-4">
          <strong>Symptom:</strong> {guide.symptom}
        </p>

        <ol className="mt-8 space-y-6">
          {guide.steps.map((s) => (
            <li key={s.step} className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-semibold flex items-center justify-center">
                {s.step}
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">{s.title}</h3>
                <p className="text-slate-700 mt-1">{s.content}</p>
              </div>
            </li>
          ))}
        </ol>

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
          <Link href="/knowledge/troubleshooting" className="text-primary-600 hover:underline font-medium">
            ← All troubleshooting guides
          </Link>
        </div>
      </article>
    </div>
  )
}

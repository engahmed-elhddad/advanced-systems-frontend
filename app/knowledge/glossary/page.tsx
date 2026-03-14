import Link from 'next/link'
import { BookMarked } from 'lucide-react'
import { GLOSSARY_TERMS } from '@/app/lib/knowledge-hub/content'

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export default function GlossaryPage() {
  const byLetter = letters.reduce((acc, l) => {
    acc[l] = GLOSSARY_TERMS.filter((t) => t.term.toUpperCase().startsWith(l))
    return acc
  }, {} as Record<string, typeof GLOSSARY_TERMS>)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/knowledge" className="text-sm text-slate-500 hover:text-primary-600 mb-4 inline-block">
            ← Knowledge Hub
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookMarked className="w-7 h-7 text-primary-600" />
            Industrial Glossary
          </h1>
          <p className="text-slate-600 mt-2">
            Definitions for AC-3, contactor, DOL, PLC, VFD, and more. Each term links to relevant products.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-8">
          {letters.map((l) => (
            <a
              key={l}
              href={`#letter-${l}`}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium ${
                byLetter[l]?.length ? 'bg-primary-100 text-primary-700 hover:bg-primary-200' : 'bg-slate-100 text-slate-400'
              }`}
            >
              {l}
            </a>
          ))}
        </div>

        <div className="space-y-8">
          {letters.map((l) => {
            const terms = byLetter[l]
            if (!terms?.length) return null
            return (
              <section key={l} id={`letter-${l}`}>
                <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">{l}</h2>
                <ul className="space-y-3">
                  {terms.map((t) => (
                    <li key={t.slug}>
                      <Link
                        href={`/knowledge/glossary/${t.slug}`}
                        className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-primary-200 transition-colors"
                      >
                        <span className="font-semibold text-slate-900">{t.term}</span>
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">{t.definition}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}

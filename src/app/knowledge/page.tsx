import Link from 'next/link'
import { BookOpen, FileText, Calculator, BookMarked, Wrench } from 'lucide-react'
import { ENGINEERING_GUIDES, GLOSSARY_TERMS, TROUBLESHOOTING_GUIDES } from '@/lib/knowledge-hub/content'

const SECTIONS = [
  {
    href: '/knowledge/guides',
    icon: BookOpen,
    title: 'Engineering Guides',
    description: 'Learn motor sizing, contactor selection, sensor types, PLC wiring, and more.',
    count: ENGINEERING_GUIDES.length,
    color: 'bg-blue-500',
  },
  {
    href: '/knowledge/datasheet-library',
    icon: FileText,
    title: 'Datasheet Library',
    description: 'Browse technical datasheets by category. Download PDFs for PLCs, drives, sensors, contactors.',
    count: null,
    color: 'bg-emerald-500',
  },
  {
    href: '/knowledge/calculators',
    icon: Calculator,
    title: 'Engineering Calculators',
    description: 'Motor current, wire gauge, cable sizing, and power calculations.',
    count: 4,
    color: 'bg-amber-500',
  },
  {
    href: '/knowledge/glossary',
    icon: BookMarked,
    title: 'Industrial Glossary',
    description: 'Terms from AC-3 to VFD. Definitions with links to relevant products.',
    count: GLOSSARY_TERMS.length,
    color: 'bg-violet-500',
  },
  {
    href: '/knowledge/troubleshooting',
    icon: Wrench,
    title: 'Troubleshooting Guides',
    description: 'Step-by-step solutions for common industrial automation issues.',
    count: TROUBLESHOOTING_GUIDES.length,
    color: 'bg-rose-500',
  },
]

export default function KnowledgeHubPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16 px-4 text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Engineering Knowledge Hub</h1>
          <p className="text-slate-300 text-lg">
            Trusted educational content and tools for industrial automation. Guides, calculators, datasheets, glossary, and troubleshooting.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
            >
              <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center mb-4`}>
                <s.icon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                {s.title}
              </h2>
              <p className="text-sm text-slate-600 mt-1 flex-1">{s.description}</p>
              {s.count != null && (
                <p className="text-xs text-slate-500 mt-3">{s.count} {s.count === 1 ? 'article' : 'articles'}</p>
              )}
            </Link>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-slate-200 bg-white p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Featured guides</h2>
          <ul className="space-y-3">
            {ENGINEERING_GUIDES.slice(0, 3).map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/knowledge/guides/${g.slug}`}
                  className="text-primary-600 hover:underline font-medium"
                >
                  {g.title}
                </Link>
                <p className="text-sm text-slate-600 mt-0.5">{g.excerpt}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

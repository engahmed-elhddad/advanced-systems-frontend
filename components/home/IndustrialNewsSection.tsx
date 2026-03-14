import Link from 'next/link'
import { Newspaper, ArrowRight } from 'lucide-react'

export function IndustrialNewsSection() {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title">Industrial News</h2>
        <Link
          href="/en/news"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <Link
        href="/en/news"
        className="flex items-center gap-4 px-5 py-4 rounded-xl border border-slate-200 bg-white hover:border-primary-300 hover:bg-primary-50/30 transition-all group"
      >
        <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-primary-100 flex items-center justify-center shrink-0">
          <Newspaper className="w-6 h-6 text-slate-600 group-hover:text-primary-600" />
        </div>
        <div>
          <span className="font-semibold text-slate-900">Latest automation news & updates</span>
          <p className="text-sm text-slate-500 mt-0.5">Industry insights, product launches, and technical guides</p>
        </div>
        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-600 ml-auto shrink-0" />
      </Link>
    </section>
  )
}

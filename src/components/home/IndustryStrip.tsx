import Link from 'next/link'
import { Flame, Apple, Mountain, FlaskConical, Droplets, Car } from 'lucide-react'

const INDUSTRIES = [
  { slug: 'oil-gas', label: 'Oil & Gas', Icon: Flame },
  { slug: 'food-beverage', label: 'Food & Beverage', Icon: Apple },
  { slug: 'cement', label: 'Cement', Icon: Mountain },
  { slug: 'pharma', label: 'Pharma', Icon: FlaskConical },
  { slug: 'water', label: 'Water', Icon: Droplets },
  { slug: 'automotive', label: 'Automotive', Icon: Car },
] as const

export function IndustryStrip() {
  return (
    <section className="w-full bg-[#0E1116] px-6 py-10" aria-labelledby="industries-heading">
      <h2
        id="industries-heading"
        className="mb-6 text-center text-2xl font-bold text-white"
      >
        Industries We Serve
      </h2>
      <div className="mx-auto grid max-w-5xl grid-cols-3 gap-3 sm:grid-cols-6">
        {INDUSTRIES.map(({ slug, label, Icon }) => (
          <Link
            key={slug}
            href={`/industries/${slug}`}
            className="flex flex-col items-center gap-2 rounded-xl border border-[--border] bg-[--bg-elevated] px-3 py-4 text-center transition-all hover:border-[--accent]/40 hover:bg-[--bg-surface]"
          >
            <Icon className="h-7 w-7 text-[--accent]" aria-hidden />
            <span className="text-xs font-semibold text-[--text-secondary] leading-tight">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

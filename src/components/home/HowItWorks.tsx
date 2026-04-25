import { Fragment } from 'react'
import { ArrowRight, MessageSquare, Package, Search } from 'lucide-react'

const STEPS = [
  {
    n: 1,
    Icon: Search,
    title: 'Search',
    description: 'Search by part number or keyword',
  },
  {
    n: 2,
    Icon: MessageSquare,
    title: 'Quote',
    description: 'Get a quote within 2-4 hours',
  },
  {
    n: 3,
    Icon: Package,
    title: 'Receive',
    description: 'Receive your parts fast',
  },
] as const

export function HowItWorks() {
  return (
    <section className="w-full bg-[#0E1116] px-6 py-12 sm:py-16" aria-labelledby="how-it-works-heading">
      <h2 id="how-it-works-heading" className="text-center text-2xl font-bold text-white">
        How it works
      </h2>

      <div className="mx-auto mt-10 flex max-w-5xl flex-col items-center gap-8 md:flex-row md:items-stretch md:justify-center md:gap-3 lg:gap-6">
        {STEPS.map((step, i) => (
          <Fragment key={step.n}>
            {i > 0 ? (
              <ArrowRight
                className="hidden h-6 w-6 shrink-0 rotate-90 text-white/25 md:block md:rotate-0 md:self-center"
                aria-hidden
              />
            ) : null}
            <div className="flex w-full max-w-sm flex-1 flex-col items-center text-center md:max-w-[260px]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[--accent] text-sm font-bold text-white shadow-[0_4px_14px_rgba(255,106,0,0.35)]">
                {step.n}
              </span>
              <step.Icon className="mt-4 h-9 w-9 text-[--accent]" aria-hidden />
              <h3 className="mt-3 text-base font-semibold text-white">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-white/65">{step.description}</p>
            </div>
          </Fragment>
        ))}
      </div>
    </section>
  )
}

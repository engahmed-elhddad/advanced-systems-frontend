'use client'

import Link from 'next/link'
import { Shield } from 'lucide-react'

const CDN = 'https://cdn.advancedsystems-int.com/cdn/categories/'

const CATEGORY_GRID = [
  { label: 'PLC',           href: '/categories/plc',           image: 'plc.webp' },
  { label: 'Drive',         href: '/categories/drive',         image: 'drive.webp' },
  { label: 'Sensors',       href: '/categories/sensors',       image: 'Sensors.webp' },
  { label: 'HMI',           href: '/categories/hmi',           image: 'hmi.png' },
  { label: 'Power Supply',  href: '/categories/power-supply',  image: 'power-supply.jpg' },
  { label: 'Soft Starter',  href: '/categories/soft-starter',  image: 'soft-starter.jpg' },
  { label: 'Safety Relay',  href: '/categories/safety-relay',  image: null },
]

export function HeroSection() {
  return (
    <section
      className="relative flex min-h-[82vh] w-full flex-col justify-center pb-8"
      style={{ backgroundColor: 'var(--bg-header)' }}
    >
      <div className="w-full py-16 sm:py-24 lg:py-28 page-container">
        <div className="mx-auto max-w-3xl text-center">

          <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-white/50">
            Industrial automation marketplace
          </p>

          <h1 className="mb-7 text-5xl font-bold leading-tight text-white">
            Parts that power{' '}
            <span className="text-[--accent]">your line</span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-white/60">
            Search millions of components by part number, brand, or category — engineered for
            procurement teams who need speed and certainty.
          </p>

          {/* CTAs */}
          <div className="mb-12 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/products"
              className="bg-[--accent] hover:bg-[--accent-hover] text-white px-6 py-3 rounded-lg font-semibold"
            >
              Browse products
            </Link>
            <Link
              href="/rfq/instant"
              className="border border-white/30 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/5"
            >
              Request quote
            </Link>
          </div>

          {/* Category grid */}
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
            {CATEGORY_GRID.map(({ label, href, image }) => (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-4 transition-colors hover:border-[--accent] hover:bg-white/10"
              >
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${CDN}${image}`}
                    alt={label}
                    className="h-16 w-16 object-contain"
                    loading="lazy"
                  />
                ) : (
                  <Shield className="h-16 w-16 text-[--accent]" />
                )}
                <span className="text-center text-sm font-medium text-white leading-tight">{label}</span>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}

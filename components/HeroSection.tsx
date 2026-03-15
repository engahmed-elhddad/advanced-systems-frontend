'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SearchBar } from '@/components/search/SearchBar'

const HERO_IMAGE = '/industrial-automation-hero.png'
const HERO_IMAGE_FALLBACK = '/hero-industrial.svg'

export function HeroSection() {
  const [imgError, setImgError] = useState(false)

  return (
    <section className="relative w-full min-h-[560px] sm:min-h-[620px] flex flex-col justify-center overflow-hidden bg-gradient-to-r from-blue-900 via-blue-700 to-indigo-600">
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative page-container py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          {/* Left: content */}
          <div className="order-2 lg:order-1 text-white">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
              Industrial Automation Parts &amp; Solutions
            </h1>
            <p className="text-slate-200 text-base sm:text-lg max-w-xl mb-8 leading-relaxed">
              Source PLCs, Drives, Sensors, HMIs, and Industrial Automation Components from trusted global brands.
              New, Surplus and Refurbished – Tested &amp; Certified.
            </p>

            <div className="flex flex-wrap gap-3 mb-6">
              <Link
                href="/search"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-blue-800 bg-white hover:bg-slate-100 transition-colors shadow-lg"
              >
                Search Parts
              </Link>
              <Link
                href="/categories"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-white border-2 border-white hover:bg-white/10 transition-colors"
              >
                Browse Categories
              </Link>
            </div>

            {/* Smart search – Enter redirects to /search?q={query} */}
            <div className="max-w-xl">
              <SearchBar
                placeholder="Search by part number (ex: 6ES7400-1PB00-0AA0)"
                size="lg"
                showSuggestions
                debounceMs={300}
              />
            </div>
          </div>

          {/* Right: illustration (next/image; fallback if PNG missing) */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[320px] sm:max-w-[380px] lg:max-w-[420px] animate-float drop-shadow-2xl">
              {!imgError ? (
                <Image
                  src={HERO_IMAGE}
                  alt="Industrial automation components"
                  width={420}
                  height={360}
                  className="w-full h-auto object-contain"
                  priority
                  unoptimized
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full aspect-[7/6] flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                  <Image
                    src={HERO_IMAGE_FALLBACK}
                    alt="Industrial automation"
                    width={380}
                    height={320}
                    className="w-full h-full object-contain opacity-90"
                    unoptimized
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

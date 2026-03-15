'use client'

import { useState } from 'react'
import Image from 'next/image'

const HERO_PLACEHOLDER = '/hero-industrial.jpg'
const HERO_FALLBACK = '/hero-industrial.svg'

/** Right-side hero visual: placeholder from /public/hero-industrial.jpg (fallback .svg). Animation disabled on mobile via CSS. */
export function HeroVisual() {
  const [useFallback, setUseFallback] = useState(false)
  const src = useFallback ? HERO_FALLBACK : HERO_PLACEHOLDER

  return (
    <div className="relative w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[460px] aspect-[4/3] rounded-2xl overflow-hidden shadow-xl shadow-slate-300/40 ring-1 ring-slate-200/80">
      {/* Industrial visual placeholder — next/image */}
      <div className="absolute inset-0">
        <Image
          src={src}
          alt="Industrial automation"
          fill
          sizes="(max-width: 640px) 340px, (max-width: 1024px) 400px, 460px"
          className="object-cover"
          loading="lazy"
          unoptimized
          onError={() => setUseFallback(true)}
        />
      </div>

      {/* Overlay for depth */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent"
        aria-hidden
      />
    </div>
  )
}

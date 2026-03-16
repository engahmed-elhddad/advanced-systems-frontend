import { Suspense } from 'react'
import { HeroSection } from '@/components/home/HeroSection'
import { TrustedBrands } from '@/components/home/TrustedBrands'
import { TopCategories } from '@/components/home/TopCategories'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { AutoProductCarousel } from '@/components/home/AutoProductCarousel'
import { RFQBanner } from '@/components/home/RFQBanner'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Advanced Systems — Industrial Automation Marketplace',
  description: 'Source PLCs, drives, sensors, and industrial automation components from 500+ manufacturers. Fast quote, global shipping.',
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <div className="page-container space-y-14 sm:space-y-16 py-12 sm:py-16 bg-gray-50">
        <Suspense fallback={<SectionSkeleton className="h-40" />}>
          <TrustedBrands />
        </Suspense>
        <Suspense fallback={<SectionSkeleton className="h-48" />}>
          <TopCategories />
        </Suspense>
        <Suspense fallback={<SectionSkeleton className="h-80" />}>
          <FeaturedProducts />
        </Suspense>
        <Suspense fallback={<SectionSkeleton className="h-72" />}>
          <AutoProductCarousel />
        </Suspense>
        <RFQBanner />
      </div>
    </>
  )
}

function SectionSkeleton({ className = 'h-48' }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />
}

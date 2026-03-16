import { Suspense } from 'react'
import { HeroSection } from '@/components/home/HeroSection'
import { TrendingProducts } from '@/components/home/TrendingProducts'
import { BrandCarousel } from '@/components/home/BrandCarousel'
import { CategoryHeroGrid } from '@/components/home/CategoryHeroGrid'
import { FeaturedProductsCarousel } from '@/components/home/FeaturedProductsCarousel'
import { TrendingParts } from '@/components/home/TrendingParts'
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
      <Suspense fallback={<SectionSkeleton className="h-72" />}>
        <TrendingProducts />
      </Suspense>
      <Suspense fallback={null}>
        <BrandCarousel />
      </Suspense>
      <div className="bg-gray-50">
        <Suspense fallback={<SectionSkeleton className="h-48" />}>
          <CategoryHeroGrid />
        </Suspense>
        <Suspense fallback={<SectionSkeleton className="h-64" />}>
          <FeaturedProductsCarousel />
        </Suspense>
        <Suspense fallback={<SectionSkeleton className="h-48" />}>
          <TrendingParts />
        </Suspense>
        <div className="mx-auto max-w-7xl px-6 py-16">
          <RFQBanner />
        </div>
      </div>
    </>
  )
}

function SectionSkeleton({ className = 'h-48' }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />
}

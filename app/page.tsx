import { Suspense } from 'react'
import { HeroSearch } from '@/components/HeroSearch'
import { FeaturedBrands } from '@/components/home/FeaturedBrands'
import { CategoriesGrid } from '@/components/home/CategoriesGrid'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { EngineeringToolsSection } from '@/components/home/EngineeringToolsSection'
import { IndustrialNewsSection } from '@/components/home/IndustrialNewsSection'
import { WhyUs } from '@/components/home/WhyUs'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Advanced Systems — Industrial Automation Marketplace',
  description: 'Source PLCs, drives, sensors, and industrial automation components from 500+ manufacturers. Fast quote, global shipping.',
}

export default function HomePage() {
  return (
    <>
      <HeroSearch />
      <div className="page-container space-y-16 py-12 sm:py-16 bg-white">
        <Suspense fallback={<div className="h-48 skeleton rounded-xl" />}>
          <CategoriesGrid />
        </Suspense>
        <Suspense fallback={<div className="h-32 skeleton rounded-xl" />}>
          <FeaturedBrands />
        </Suspense>
        <Suspense fallback={<div className="h-80 skeleton rounded-xl" />}>
          <FeaturedProducts />
        </Suspense>
        <Suspense fallback={<div className="h-32 skeleton rounded-xl" />}>
          <EngineeringToolsSection />
        </Suspense>
        <Suspense fallback={<div className="h-24 skeleton rounded-xl" />}>
          <IndustrialNewsSection />
        </Suspense>
        <WhyUs />
      </div>
    </>
  )
}

import { Suspense } from 'react'
import { HeroSection } from '@/components/home/HeroSection'
import { FeaturedBrands } from '@/components/home/FeaturedBrands'
import { CategoriesGrid } from '@/components/home/CategoriesGrid'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { WhyUs } from '@/components/home/WhyUs'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Advanced Systems — Industrial Automation Marketplace',
  description: 'Source PLCs, drives, sensors, and industrial automation components from 500+ manufacturers. Fast quote, global shipping.',
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <div className="page-container space-y-20 py-16">
        <Suspense fallback={<div className="h-32 skeleton rounded-xl" />}>
          <FeaturedBrands />
        </Suspense>
        <Suspense fallback={<div className="h-48 skeleton rounded-xl" />}>
          <CategoriesGrid />
        </Suspense>
        <Suspense fallback={<div className="h-96 skeleton rounded-xl" />}>
          <FeaturedProducts />
        </Suspense>
        <WhyUs />
      </div>
    </>
  )
}

import { Suspense } from 'react'
import { HeroSection } from '@/components/home/HeroSection'
import { TrendingProducts } from '@/components/home/TrendingProducts'
import { BrandCarousel } from '@/components/home/BrandCarousel'
import { CategoryHeroGrid } from '@/components/home/CategoryHeroGrid'
import { FeaturedProductsCarousel } from '@/components/home/FeaturedProductsCarousel'
import { TrendingParts } from '@/components/home/TrendingParts'
import { RFQBanner } from '@/components/home/RFQBanner'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Advanced Systems — Industrial Automation Parts Supplier Egypt',
  description: 'Source PLCs, drives, sensors, contactors from Siemens, ABB, Schneider Electric and more. Fast quotes, worldwide shipping from Egypt.',
  alternates: { canonical: 'https://www.advancedsystems-int.com/' },
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
          <div className="mt-6 rounded-[2px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#1A1A1A]">
              Emergency Breakdown? Get Industrial Spare Parts Fast
            </h2>
            <p className="mt-2 text-sm text-[#6B7280]">
              In Stock - Ready to Ship for urgent factory downtime support.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/emergency-industrial-spare-parts"
                className="inline-flex items-center px-5 py-2.5 rounded-[2px] bg-[#0072CE] hover:bg-[#005BA4] text-white text-sm font-semibold transition-colors duration-150"
              >
                Emergency Industrial Spare Parts
              </Link>
              <Link
                href="/rfq"
                className="inline-flex items-center px-5 py-2.5 rounded-[2px] border border-[#E5E7EB] text-[#1A1A1A] text-sm font-medium hover:bg-[#F9FAFB] transition-colors duration-150"
              >
                Get Price in 2 Hours
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function SectionSkeleton({ className = 'h-48' }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />
}

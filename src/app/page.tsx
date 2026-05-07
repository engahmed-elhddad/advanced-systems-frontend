export const revalidate = 60

import { Suspense } from 'react'
import { HeroSection } from '@/components/home/HeroSection'
import { BrandCarousel } from '@/components/home/BrandCarousel'
import { HowItWorks } from '@/components/home/HowItWorks'
import { IndustryStrip } from '@/components/home/IndustryStrip'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Advanced Systems — Industrial Automation Marketplace',
  description: 'Source PLCs, drives, sensors, and industrial automation components from 500+ manufacturers. Fast quote, global shipping.',
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <Suspense fallback={null}>
        <BrandCarousel />
      </Suspense>
      <HowItWorks />
      <IndustryStrip />
    </>
  )
}

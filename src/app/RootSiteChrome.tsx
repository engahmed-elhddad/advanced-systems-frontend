'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SkipLink } from '@/components/shared/SkipLink'
import { RFQModalGlobal } from './RFQModalGlobal'
import { RFQFloatingBar } from '@/components/rfq/RFQFloatingBar'

const IndustrialAssistant = dynamic(
  () => import('@/components/assistant/IndustrialAssistant').then((m) => ({ default: m.IndustrialAssistant })),
  { ssr: false },
)

export function RootSiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const isAdmin = pathname.startsWith('/admin')

  return (
    <>
      <SkipLink />
      {!isAdmin ? (
        <Suspense
          fallback={
            <header
              className="sticky top-0 z-50 h-[4.75rem] border-b border-white/[0.08] bg-[rgba(11,31,58,0.72)] backdrop-blur-2xl"
              aria-hidden
            />
          }
        >
          <Navbar />
        </Suspense>
      ) : null}
      <main className="relative min-h-screen">{children}</main>
      {!isAdmin ? (
        <>
          <Footer />
          <RFQModalGlobal />
          <RFQFloatingBar />
          <IndustrialAssistant />
        </>
      ) : null}
    </>
  )
}

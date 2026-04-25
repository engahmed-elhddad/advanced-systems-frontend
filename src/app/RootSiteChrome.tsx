'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SkipLink } from '@/components/shared/SkipLink'
import { RFQModalGlobal } from './RFQModalGlobal'

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
              className="sticky top-0 z-50 h-[9.5rem] border-b border-[--border-dark]"
              style={{ backgroundColor: 'var(--bg-header)' }}
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
          <IndustrialAssistant />
        </>
      ) : null}
    </>
  )
}

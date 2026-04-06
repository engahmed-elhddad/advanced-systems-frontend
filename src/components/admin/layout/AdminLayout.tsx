'use client'

import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

type AdminLayoutProps = {
  children: ReactNode
  userEmail?: string
}

export function AdminLayout({ children, userEmail }: AdminLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0B1F3A] via-[#1a2a4a] to-[#2a1f3a] text-white">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-[360px] w-[360px] rounded-full bg-purple-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-120px] right-[-80px] h-[380px] w-[380px] rounded-full bg-orange-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-purple-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '18px 18px' }} />

      <div className="relative flex min-h-screen">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar userEmail={userEmail} />

          <main className="w-full flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1400px]">
              <div className="animate-fade-in-up rounded-xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-xl transition-all duration-300 ease-in-out lg:p-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

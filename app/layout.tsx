import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CurrencyProvider } from '@/lib/providers/CurrencyProvider'

const IndustrialAssistant = dynamic(
  () => import('@/components/assistant/IndustrialAssistant').then((m) => ({ default: m.IndustrialAssistant })),
  { ssr: false }
)

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: {
    default: 'Advanced Systems — Industrial Automation Marketplace',
    template: '%s | Advanced Systems',
  },
  description: 'Source industrial automation parts, PLCs, drives, sensors, and more from leading manufacturers. Fast quote, global shipping.',
  keywords: ['industrial automation', 'PLC', 'drives', 'sensors', 'industrial parts', 'automation components'],
  openGraph: {
    type: 'website',
    siteName: 'Advanced Systems',
    title: 'Advanced Systems — Industrial Automation Marketplace',
    description: 'Source industrial automation parts from 500+ manufacturers worldwide.',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className={`${inter.className} bg-white text-gray-900 antialiased`}>
        <CurrencyProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <IndustrialAssistant />
        </CurrencyProvider>
      </body>
    </html>
  )
}
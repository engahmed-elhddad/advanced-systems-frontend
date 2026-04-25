import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { CurrencyProvider } from '@/lib/providers/CurrencyProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ShopAuthProvider } from '@/components/providers/ShopAuthProvider'
import { AppToaster } from '@/components/providers/AppToaster'
import { AnalyticsClient } from '@/components/analytics/AnalyticsClient'
import { SiteJsonLd } from '@/components/seo/SiteJsonLd'
import { RootSiteChrome } from './RootSiteChrome'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', display: 'swap' })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://advancedsystems-int.com'

export const viewport: Viewport = {
  themeColor: '#0a1629',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Advanced Systems — Industrial Automation Marketplace',
    template: '%s | Advanced Systems',
  },
  description:
    'Source industrial automation parts, PLCs, drives, sensors, and more from leading manufacturers. Fast quote, global shipping.',
  keywords: ['industrial automation', 'PLC', 'drives', 'sensors', 'industrial parts', 'automation components'],
  applicationName: 'Advanced Systems',
  referrer: 'origin-when-cross-origin',
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Advanced Systems',
    url: siteUrl,
    title: 'Advanced Systems — Industrial Automation Marketplace',
    description: 'Source industrial automation parts from 500+ manufacturers worldwide.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Advanced Systems — Industrial Automation Marketplace',
    description: 'Industrial automation parts, fast quotes, global shipping.',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <SiteJsonLd />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${inter.className} font-sans antialiased text-white`}>
        <AnalyticsClient />
        <QueryProvider>
          <ShopAuthProvider>
            <CurrencyProvider>
            <div
              className="fixed inset-0 -z-20 bg-gradient-to-br from-[#0a1629] via-[#121f3d] to-[#1c1530]"
              aria-hidden
            />
            <div
              className="pointer-events-none fixed -bottom-40 -right-32 -z-10 h-[min(100vw,600px)] w-[min(100vw,600px)] rounded-full bg-orange-500/[0.2] blur-[140px]"
              aria-hidden
            />
            <div
              className="pointer-events-none fixed -left-24 top-0 -z-10 h-[min(90vw,480px)] w-[min(90vw,480px)] rounded-full bg-violet-600/[0.14] blur-[140px]"
              aria-hidden
            />
            <RootSiteChrome>{children}</RootSiteChrome>
            <AppToaster />
            </CurrencyProvider>
          </ShopAuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}

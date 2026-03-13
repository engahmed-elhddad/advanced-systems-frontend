import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
const inter = Inter({ subsets: ['latin'] })

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
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BOM Analyzer',
  description: 'Upload your Excel or CSV Bill of Materials to match part numbers, get datasheets, specifications, and alternative components.',
}

export default function BomAnalyzerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

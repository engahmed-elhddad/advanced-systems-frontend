import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Engineering Knowledge Hub',
  description: 'Educational content and engineering tools for industrial automation. Guides, calculators, datasheet library, glossary, and troubleshooting.',
}

export default function KnowledgeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

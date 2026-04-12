import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Engineering Assistant',
  description: 'Ask questions about industrial automation components in natural language. Find contactors, PLCs, drives, sensors and get product recommendations with specifications and datasheets.',
}

export default function AIAssistantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

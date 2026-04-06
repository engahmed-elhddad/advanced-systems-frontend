import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Panel Builder',
  description: 'Configure industrial control panels by application, motor power, voltage, and control type. Generate BOM automatically and export or request RFQ.',
}

export default function PanelBuilderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

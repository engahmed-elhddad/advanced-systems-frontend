import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Smart Product Finder',
  description: 'Find industrial automation components by specifications – category, current, voltage, poles, mounting type. No part number needed.',
}

export default function ProductFinderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

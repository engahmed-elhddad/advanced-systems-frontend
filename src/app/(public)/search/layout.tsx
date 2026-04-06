import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search Industrial Parts — PLCs, Drives, Sensors',
  description: 'Search industrial automation parts by part number, brand, or keyword. Find PLCs, drives, sensors, contactors from Siemens, ABB, Schneider.',
  alternates: { canonical: 'https://www.advancedsystems-int.com/search' },
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

import type { Metadata } from 'next'
import { canonicalPath } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Request a Quote',
  description:
    'Submit an industrial parts RFQ — our team returns pricing and lead time fast. Same-day response typical during business hours.',
  alternates: { canonical: canonicalPath('/rfq') },
  openGraph: {
    title: 'Request a quote — Advanced Systems',
    description: 'Fast RFQ for PLCs, drives, sensors, and automation spares.',
    url: canonicalPath('/rfq'),
  },
}

export default function RfqLayout({ children }: { children: React.ReactNode }) {
  return children
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Request a Quote — Get Pricing for Industrial Parts',
  description: 'Submit a request for quote (RFQ) for industrial automation parts. Get pricing within 2 hours from Advanced Systems, Egypt.',
  alternates: { canonical: 'https://www.advancedsystems-int.com/rfq' },
}

export default function RFQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

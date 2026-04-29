import type { Metadata } from 'next'
import Link from 'next/link'
import { canonicalPath } from '@/lib/seo'
import { RMA_WINDOW_DAYS } from '@/lib/company'
import { CONTACT_EMAIL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Return & RMA Policy | Advanced Systems',
  description: 'Our 30-day return and RMA policy for industrial parts.',
  alternates: { canonical: canonicalPath('/policies/rma') },
}

export default function RmaPolicyPage() {
  return (
    <article className="page-container max-w-3xl py-10">
      <p className="mb-4 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
        <strong>DRAFT</strong> — Replace with legal-approved RMA policy. Structure below matches operational intent.
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-[--text-primary]">Return &amp; RMA Policy</h1>
      <p className="mt-4 text-sm text-[--text-secondary]">
        Advanced Systems operates a {RMA_WINDOW_DAYS}-day return and RMA (Return Merchandise Authorization) window for
        eligible industrial automation products, measured from the date of delivery or pickup confirmation.
      </p>

      <h2 className="mt-10 text-lg font-semibold text-[--text-primary]">Conditions for return</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[--text-secondary]">
        <li>Original packaging is required unless the product was shipped bulk/industrial outer pack only.</li>
        <li>Product must be unused, undamaged, and suitable for resale as new or in the agreed condition grade.</li>
        <li>Manufacturer seals and anti-tamper labels must be intact where applicable.</li>
        <li>Returns must match the part number and serial (if any) on the original invoice or packing list.</li>
      </ul>

      <h2 className="mt-10 text-lg font-semibold text-[--text-primary]">How to initiate an RMA</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[--text-secondary]">
        <li>
          Contact us via{' '}
          <Link href="/contact" className="font-semibold text-[--accent] hover:underline">
            the contact page
          </Link>
          , WhatsApp, or email at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-[--accent] hover:underline">
            {CONTACT_EMAIL}
          </a>{' '}
          with your order or RFQ reference and reason for return.
        </li>
        <li>We issue an RMA number and return instructions. Do not ship goods without an approved RMA.</li>
        <li>Use the RFQ tool on the product page if you need a replacement quote while the RMA is processed.</li>
      </ol>

      <h2 className="mt-10 text-lg font-semibold text-[--text-primary]">Refund and replacement</h2>
      <p className="mt-3 text-sm text-[--text-secondary]">
        After inspection, approved returns may receive a refund to the original payment method, account credit, or a
        replacement unit of equivalent specification. Freight and restocking fees may apply as quoted at RMA approval.
      </p>

      <h2 className="mt-10 text-lg font-semibold text-[--text-primary]">Exclusions</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[--text-secondary]">
        <li>Custom-ordered, programmed, or factory-configured items unless defective on arrival.</li>
        <li>Used, refurbished, or &quot;no box&quot; condition sales except where warranty terms state otherwise.</li>
        <li>Products damaged by misuse, improper installation, or electrical events after delivery.</li>
        <li>Items returned after the {RMA_WINDOW_DAYS}-day window without prior written extension.</li>
      </ul>

      <h2 className="mt-10 text-lg font-semibold text-[--text-primary]">Contact</h2>
      <p className="mt-3 text-sm text-[--text-secondary]">
        For questions about this policy, visit{' '}
        <Link href="/contact" className="font-semibold text-[--accent] hover:underline">
          /contact
        </Link>{' '}
        or start an RFQ from any product page. We aim to respond within two to six business hours.
      </p>

      <h2 className="mt-10 text-lg font-semibold text-[--text-primary]">Shipping and risk</h2>
      <p className="mt-3 text-sm text-[--text-secondary]">
        Title and risk of loss pass according to the agreed Incoterms on your order. When returning goods under RMA,
        use the carrier and service level we specify so tracking and insurance remain valid. Unauthorized returns sent
        without an RMA may be refused at the dock or held until administrative fees are settled.
      </p>

      <h2 className="mt-10 text-lg font-semibold text-[--text-primary]">Inspection timeline</h2>
      <p className="mt-3 text-sm text-[--text-secondary]">
        After we receive your return, technical inspection typically completes within five business days for standard
        catalog SKUs. Complex drives, safety PLCs, or serialized motion products may require manufacturer involvement;
        we will communicate any extension before the {RMA_WINDOW_DAYS}-day window affects your eligibility for credit.
      </p>

      <h2 className="mt-10 text-lg font-semibold text-[--text-primary]">Recordkeeping</h2>
      <p className="mt-3 text-sm text-[--text-secondary]">
        Keep copies of the commercial invoice, packing list, and any calibration or commissioning reports. For B2B
        buyers in Egypt and the GCC, your trade license and tax registration may be requested to align refunds with
        local VAT treatment. Nothing in this DRAFT overrides a signed supply agreement; where a contract exists, its
        RMA article controls.
      </p>
    </article>
  )
}

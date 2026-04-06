'use client'

import Link from 'next/link'
import { trackLead, trackWhatsApp } from '@/lib/analytics'

interface ProductStickyCtasProps {
  partNumber: string
}

export function ProductStickyCtas({ partNumber }: ProductStickyCtasProps) {
  const whatsappMessage = encodeURIComponent(`Hello, I need price for ${partNumber}`)
  const whatsappLink = `https://wa.me/201000629229?text=${whatsappMessage}`

  return (
    <>
      <div className="fixed bottom-5 right-4 z-40 hidden flex-col gap-2 sm:right-6 md:flex">
        <Link
          href={`/rfq?part_number=${encodeURIComponent(partNumber)}`}
          onClick={() => trackLead({ part_number: partNumber, source: 'sticky_cta_primary' })}
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#ff9b45] px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-orange-300/60 transition hover:scale-105"
        >
          ⚡ Get Price
        </Link>
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackWhatsApp({ part_number: partNumber, source: 'sticky_cta_whatsapp' })}
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-xl transition hover:scale-105"
        >
          💬 WhatsApp
        </a>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur md:hidden">
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/rfq?part_number=${encodeURIComponent(partNumber)}`}
            onClick={() => trackLead({ part_number: partNumber, source: 'sticky_bottom_bar_primary' })}
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#ff9b45] px-4 py-3 text-sm font-semibold text-white"
          >
            ⚡ Get Price
          </Link>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsApp({ part_number: partNumber, source: 'sticky_bottom_bar_whatsapp' })}
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
          >
            💬 WhatsApp
          </a>
        </div>
      </div>
    </>
  )
}

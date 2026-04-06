'use client'

import { Suspense, useState, useMemo } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useRFQListStore } from '@/state/rfqListStore'

const PHONE = '201000629229'

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function WhatsAppFloatingInner() {
  const [showTooltip, setShowTooltip] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const whatsappUrl = useMemo(() => {
    let message = 'Hello, I need pricing for industrial parts'

    const productMatch = pathname?.match(/^\/products\/(.+)$/)
    if (productMatch) {
      const partNumber = decodeURIComponent(productMatch[1])
      message = `I need pricing for ${partNumber}`
    } else {
      const q = searchParams?.get('q')?.trim()
      if (q && q.length >= 2) {
        message = `I need pricing for ${q}`
      }
    }

    return `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`
  }, [pathname, searchParams])

  const isProductDetailMobile = pathname?.startsWith('/products/') && pathname.split('/').length > 2
  const hasRFQItems = useRFQListStore((s) => s.items.length > 0)

  const bottomOffset = isProductDetailMobile
    ? 'bottom-[72px] lg:bottom-4'
    : hasRFQItems
      ? 'bottom-[68px] lg:bottom-[68px]'
      : 'bottom-4'

  return (
    <div className={`fixed right-4 z-50 transition-all duration-150 ${bottomOffset}`}>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-md hover:scale-105 active:scale-95 transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
      >
        <WhatsAppIcon className="w-7 h-7" />

        {showTooltip && (
          <span className="absolute right-[calc(100%+8px)] top-1/2 -translate-y-1/2 whitespace-nowrap bg-[#1A1A1A] text-white text-xs font-medium px-2.5 py-1.5 rounded-[2px] shadow-sm pointer-events-none animate-fadeIn">
            Chat on WhatsApp
          </span>
        )}
      </a>
    </div>
  )
}

export function WhatsAppFloating() {
  return (
    <Suspense fallback={null}>
      <WhatsAppFloatingInner />
    </Suspense>
  )
}

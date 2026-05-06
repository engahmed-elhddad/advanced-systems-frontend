'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { z } from 'zod'
import Link from 'next/link'
import {
  Zap,
  Download,
  Check,
  Loader2,
  Plus,
  MessageCircle,
  FileText,
  Layers,
  ChevronRight,
  Truck,
  ShieldCheck,
} from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import TrustBlock from '@/components/TrustBlock'
import { SafeImage } from '@/components/ui/SafeImage'
import { useRFQSubmit } from '@/features/rfq/hooks/useRFQSubmit'
import { useCart } from '@/context/CartContext'
import { API_BASE_URL, whatsappHref } from '@/lib/constants'
import { getProductImage } from '@/lib/productImageUrl'
import { trackPricingView, trackRfqCtaClick, trackWhatsApp } from '@/lib/analytics'
import { usePricingGate } from '@/lib/hooks/usePricingGate'
import { cn } from '@/lib/utils'
import { formatEgp, formatUsd, pricingVatLabel } from '@/lib/pricing'
import type { ProductPricing } from '@/types/product'
import type { StockBadge } from '@/types/warehouse'
import { StockBadgeList } from '@/components/products/StockBadgeList'
import type { ProductVariantOption } from '@/lib/productVariants'
import {
  buildRfqVariantFooter,
  formatVariantConditionLabel,
  mergeVariantIntoMessage,
  minPositiveVariantPrice,
  variantOptionKey,
  variantStockHint,
} from '@/lib/productVariants'
import { useI18n } from '@/lib/i18n'
import toast from 'react-hot-toast'

const rfqSchema = z.object({
  email: z.string().email('Valid email required'),
  quantity: z.number().min(1, 'Minimum 1'),
  contact_name: z.string().max(200).optional(),
  phone: z.string().max(80).optional(),
  company: z.string().optional(),
  country: z.string().optional(),
})

type TabId = 'description' | 'specifications' | 'datasheet'

interface Props {
  productName: string
  partNumber: string
  productId?: number
  brandName: string
  categoryName: string
  description: string
  series: string
  specs: Record<string, string>
  galleryImages: string[]
  datasheetUrl: string
  availability: string
  /** Catalog stock (used with variants for “only X left” urgency). */
  stockQuantity?: number
  stockBadges?: StockBadge[]
  pricing?: ProductPricing | null
  variants: ProductVariantOption[]
  lifecycleStatus?: string
}

function specCardValue(specs: Record<string, string>, series: string, keys: string[]): string {
  const entries = Object.entries(specs)
  for (const k of keys) {
    const found = entries.find(([label]) => label.toLowerCase().includes(k.toLowerCase()))
    if (found?.[1]?.trim()) return found[1].trim()
  }
  if (keys.includes('series') && series.trim()) return series.trim()
  return '—'
}

export function ProductDetail({
  productName,
  partNumber,
  productId,
  brandName,
  categoryName,
  description,
  series,
  specs,
  galleryImages,
  datasheetUrl,
  availability,
  stockQuantity = 0,
  stockBadges,
  pricing,
  variants,
  lifecycleStatus,
}: Props) {
  const { locale } = useI18n()
  const badges = stockBadges ?? [{ kind: 'indent' }]
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState('1')
  const [company, setCompany] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tab, setTab] = useState<TabId>('description')
  const [selectedVariantKey, setSelectedVariantKey] = useState<string | null>(() =>
    variants.length === 1 ? variantOptionKey(variants[0], 0) : null,
  )
  const [variantError, setVariantError] = useState<string | null>(null)
  const [addingToCart, setAddingToCart] = useState(false)
  const { submit, isLoading, isSuccess, data, error, reset } = useRFQSubmit({
    successToast: false,
    errorToast: false,
    analyticsSource: 'product_page',
  })
  const { addItem, items: cartItems } = useCart()
  const isInRFQList = cartItems.some((i) => i.part_number === partNumber)
  const { showExactPricing, openLoginModal } = usePricingGate()
  const minListPrice = useMemo(() => minPositiveVariantPrice(variants), [variants])
  const pricingUsd = pricing?.unit_price_usd ?? minListPrice ?? null
  const pricingEgp = pricing?.unit_price_egp ?? null
  const hasListPrices = minListPrice != null
  const pricingTrackedKey = useRef<string | null>(null)

  useEffect(() => {
    if (!showExactPricing || !hasListPrices) return
    const key = `${partNumber}:${productId ?? ''}`
    if (pricingTrackedKey.current === key) return
    pricingTrackedKey.current = key
    trackPricingView({ product_id: productId ?? null, part_number: partNumber })
  }, [showExactPricing, hasListPrices, partNumber, productId])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('rfq_email')
      const savedCompany = localStorage.getItem('rfq_company')
      if (savedEmail) setEmail(savedEmail)
      if (savedCompany) setCompany(savedCompany)
    }
  }, [])

  /** Slug/detail API often omits image_url; list endpoint includes it — hydrate in browser using same API base as the site. */
  const [clientGallery, setClientGallery] = useState<string[] | null>(null)
  useEffect(() => {
    if (galleryImages.length > 0) return
    const pn = partNumber.trim()
    if (!pn) return
    let cancelled = false
    ;(async () => {
      try {
        const qs = new URLSearchParams({ page: '1', size: '1', search: pn })
        const r = await fetch(`${API_BASE_URL}/api/v1/products/?${qs}`)
        if (!r.ok || cancelled) return
        const data = (await r.json()) as { items?: Array<Record<string, unknown>> }
        const row = data.items?.[0]
        if (!row || cancelled) return
        const u = String(row.image_url ?? '').trim()
        if (u) setClientGallery([u])
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [galleryImages.length, partNumber])

  const displayGallery = clientGallery ?? galleryImages

  const selectedVariant = useMemo(() => {
    if (selectedVariantKey == null) return null
    const i = variants.findIndex((v, idx) => variantOptionKey(v, idx) === selectedVariantKey)
    if (i < 0) return null
    return variants[i]
  }, [selectedVariantKey, variants])

  useEffect(() => {
    if (selectedVariantKey == null) return
    const i = variants.findIndex((v, idx) => variantOptionKey(v, idx) === selectedVariantKey)
    if (i < 0) return
    const v = variants[i]
    const block = buildRfqVariantFooter({
      partNumber,
      productId,
      variant: v,
    })
    setMessage((prev) => mergeVariantIntoMessage(prev, block))
  }, [selectedVariantKey, partNumber, productId, variants])

  const scrollToRfqPanel = useCallback(() => {
    document.getElementById('product-rfq-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.setTimeout(() => {
      document.getElementById('product-variant-first')?.focus()
    }, 400)
  }, [])

  const specEntries = Object.entries(specs)
  const voltage = specCardValue(specs, series, ['voltage', 'volt'])
  const current = specCardValue(specs, series, ['current', 'amp', 'a '])
  const power = specCardValue(specs, series, ['power', 'watt', 'kw'])
  const seriesVal = specCardValue(specs, series, ['series'])

  const featuredCards = [
    { label: 'Voltage', value: voltage },
    { label: 'Current', value: current },
    { label: 'Power', value: power },
    { label: 'Series', value: seriesVal },
  ]

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setErrors({})
      setVariantError(null)
      if (!selectedVariant) {
        setVariantError('Choose a condition above to continue.')
        scrollToRfqPanel()
        return
      }
      const parsed = rfqSchema.safeParse({
        email,
        quantity: Number(quantity),
        contact_name: contactName,
        phone,
        company: company || undefined,
        country: country || undefined,
      })
      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {}
        for (const issue of parsed.error.issues) {
          const field = issue.path[0]
          if (typeof field === 'string') fieldErrors[field] = issue.message
        }
        setErrors(fieldErrors)
        return
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('rfq_email', email)
        if (company.trim()) localStorage.setItem('rfq_company', company.trim())
      }
      const variantBlock = buildRfqVariantFooter({
        partNumber,
        productId,
        variant: selectedVariant,
      })
      const combinedMessage = mergeVariantIntoMessage(message.trim(), variantBlock)

      submit({
        part_number: partNumber,
        quantity: parsed.data.quantity,
        email: parsed.data.email,
        company: parsed.data.company ?? '',
        contact_name: parsed.data.contact_name,
        phone: parsed.data.phone,
        country: parsed.data.country,
        message: combinedMessage || undefined,
        product_id: productId,
      })
    },
    [
      email,
      quantity,
      company,
      contactName,
      phone,
      country,
      message,
      partNumber,
      productId,
      submit,
      selectedVariant,
      scrollToRfqPanel,
    ],
  )

  const handleReset = useCallback(() => {
    reset()
    setQuantity('1')
    setErrors({})
    setVariantError(null)
    const sole = variants.length === 1 ? variants[0] : null
    const key = sole ? variantOptionKey(sole, 0) : null
    setSelectedVariantKey(key)
    if (sole) {
      setMessage(buildRfqVariantFooter({ partNumber, productId, variant: sole }))
    } else {
      setMessage('')
    }
  }, [reset, variants, partNumber, productId])

  const availLower = availability.toLowerCase()
  const isAvailable =
    availLower.includes('stock') ||
    availLower.includes('available') ||
    availability === 'in_stock'

  const stockForUrgency = useMemo(() => {
    if (variants.length > 1 && selectedVariant) return Math.max(0, Math.floor(selectedVariant.stock))
    if (variants.length === 1) {
      const vs = Math.max(0, Math.floor(variants[0]?.stock ?? 0))
      if (vs > 0) return vs
    }
    return Math.max(0, Math.floor(Number(stockQuantity) || 0))
  }, [variants, selectedVariant, stockQuantity])

  const showLowStockUrgency =
    isAvailable && stockForUrgency > 0 && stockForUrgency <= 25 && !(variants.length > 1 && !selectedVariant)

  const waLink = whatsappHref(partNumber)
  const hasDatasheet = Boolean(datasheetUrl?.startsWith('http'))

  const fullRfqHref = useMemo(() => {
    const q = new URLSearchParams()
    q.set('part_number', partNumber)
    q.set('product_name', productName)
    if (productId != null) q.set('product_id', String(productId))
    if (selectedVariant) {
      q.set('variant_condition', selectedVariant.condition)
      if (selectedVariant.id != null) q.set('variant_id', String(selectedVariant.id))
    }
    return `/rfq?${q.toString()}`
  }, [partNumber, productName, productId, selectedVariant])

  const primaryCtaLabel =
    variants.length > 1 && !selectedVariant
      ? locale === 'ar'
        ? 'اختر الحالة · أضف إلى طلب العرض'
        : 'Choose condition · Add to RFQ'
      : locale === 'ar'
        ? 'أضف إلى طلب العرض - عرض سعر مجاني'
        : 'Add to RFQ — free quote'

  const glass = 'rounded-xl border border-[--border] bg-[--bg-elevated] transition-all duration-300'

  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
        {/* LEFT — gallery */}
        <div className="space-y-4">
          <div
            className={cn(
              glass,
              'relative flex aspect-[4/3] items-center justify-center overflow-hidden p-6',
              'hover:border-[--accent]/30'
            )}
          >
            {displayGallery.length > 0 ? (
              <div className="group relative h-full w-full">
                <SafeImage
                  src={displayGallery[selectedImage] ?? displayGallery[0]}
                  alt={partNumber}
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="mx-auto max-h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.08]"
                />
              </div>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4">
                <div className="relative h-full min-h-[180px] w-full max-w-md opacity-90">
                  <SafeImage
                    src={getProductImage({ part_number: partNumber })}
                    alt={`${partNumber} — image not available`}
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-contain"
                  />
                </div>
                <span className="text-xs text-[--text-secondary]">
                  {locale === 'ar' ? 'لا توجد صورة للمنتج - يتم عرض صورة بديلة' : 'No product photo — placeholder shown'}
                </span>
              </div>
            )}
          </div>
          {displayGallery.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {displayGallery.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    'h-16 w-16 overflow-hidden rounded-lg border p-1 transition-all duration-300',
                    i === selectedImage
                      ? 'border-[--accent]/60'
                      : 'border-[--border] bg-[--bg-elevated] hover:border-[--accent]/30 hover:scale-105'
                  )}
                  aria-label={`View image ${i + 1}`}
                >
                  <SafeImage
                    src={url}
                    alt={`${partNumber} ${i + 1}`}
                    sizes="64px"
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — hero + conversion */}
        <div className="flex flex-col gap-6">
          <div>
            <p className="font-mono text-sm font-semibold tracking-wide text-[--accent]">{partNumber}</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-[--text-primary] sm:text-4xl">
              {productName || partNumber}
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-[--text-secondary] sm:text-[0.9375rem]">
              Firm quote on this SKU · Typical response <span className="text-[--accent]/80">2–6 hours</span> · No
              obligation
            </p>
            {showLowStockUrgency ? (
              <p
                className="mt-4 inline-flex items-center gap-2.5 rounded-xl border border-rose-400/40 bg-rose-500/[0.12] px-4 py-2.5 text-sm font-semibold text-rose-100 shadow-[0_0_24px_rgba(244,63,94,0.12)]"
                role="status"
              >
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-400" />
                </span>
                Only {stockForUrgency} left in stock — secure yours on the RFQ below.
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {brandName ? (
                <Badge variant="info" size="sm">
                  {brandName}
                </Badge>
              ) : null}
              {categoryName ? (
                <Badge variant="default" size="sm">
                  {categoryName}
                </Badge>
              ) : null}
              <Badge variant={isAvailable ? 'success' : 'pending'} size="sm">
                {isAvailable ? 'Available' : 'On request'}
              </Badge>
              {lifecycleStatus === 'nrnd' && (
                <Badge variant="warning" size="sm">NRND</Badge>
              )}
              {lifecycleStatus === 'obsolete' && (
                <Badge variant="error" size="sm">Obsolete</Badge>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide',
                  isAvailable
                    ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                    : 'border-amber-400/40 bg-amber-500/10 text-amber-100',
                )}
              >
                <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                {isAvailable ? 'In stock' : 'On request'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/35 bg-sky-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-sky-100">
                <Truck className="h-3.5 w-3.5 shrink-0 text-sky-200/90" aria-hidden />
                Fast delivery
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/35 bg-violet-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-violet-100">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-violet-200/90" aria-hidden />
                Trusted supplier
              </span>
            </div>
            {(pricingUsd != null || hasListPrices) && !showExactPricing ? (
              <div className="mt-4 rounded-xl border border-[--border] bg-[--bg-elevated] px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-lg font-semibold text-[--text-primary]">
                    Starting from{' '}
                    <span className="text-[--accent] tabular-nums">{formatUsd(pricingUsd) ?? '$0.00'}</span>
                    {formatEgp(pricingEgp) ? (
                      <span className="ml-2 text-sm font-medium text-[--text-secondary]">{formatEgp(pricingEgp)}</span>
                    ) : null}
                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-[--text-secondary]">
                      {pricingVatLabel(pricing ?? undefined)}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={openLoginModal}
                    className="inline-flex shrink-0 items-center justify-center rounded-xl border border-[--accent]/40 bg-[--accent]/10 px-4 py-2.5 text-sm font-bold text-[--accent] transition-colors hover:bg-[--accent]/20"
                  >
                    Login to view pricing
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {description ? (
            <p className="text-base leading-relaxed text-[--text-secondary]">{description}</p>
          ) : null}

          {/* Featured spec cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {featuredCards.map(({ label, value }) => (
              <div
                key={label}
                className={cn(
                  glass,
                  'p-4 hover:scale-[1.02] hover:border-[--accent]/30'
                )}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-[--text-secondary]">{label}</p>
                <p className="mt-1 truncate text-sm font-semibold text-[--text-primary]" title={value}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {specEntries.length > 0 ? (
            <div className={cn(glass, 'overflow-hidden')}>
              <div className="flex items-center justify-between border-b border-[--border] px-4 py-3">
                <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[--text-secondary]">Quick specs</h2>
                <span className="text-[10px] text-[--text-secondary]">{specEntries.length} fields</span>
              </div>
              <div className="max-h-[min(280px,45vh)] overflow-y-auto overscroll-contain">
                <table className="w-full text-left text-sm">
                  <tbody>
                    {specEntries.slice(0, 28).map(([k, v]) => (
                      <tr key={k} className="border-b border-[--border]/60 last:border-0 hover:bg-[--bg-surface]">
                        <th
                          scope="row"
                          className="w-[min(42%,200px)] px-4 py-2.5 align-top text-xs font-semibold uppercase tracking-wide text-[--text-secondary]"
                        >
                          {k}
                        </th>
                        <td className="px-4 py-2.5 font-mono text-[13px] leading-snug text-[--text-primary]">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {specEntries.length > 28 ? (
                <p className="border-t border-[--border] px-4 py-2 text-center text-[11px] text-[--text-secondary]">
                  Full list in the Specifications tab below.
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Primary CTAs */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              variant="primary"
              size="lg"
              leftIcon={<Zap className="h-5 w-5" />}
              className="min-h-[56px] flex-1 rounded-xl px-8 text-base font-bold sm:min-w-[260px]"
              onClick={() => {
                trackRfqCtaClick({
                  source: 'product_hero_scroll_rfq',
                  part_number: partNumber,
                  product_id: productId ?? null,
                })
                scrollToRfqPanel()
              }}
            >
              {primaryCtaLabel}
            </Button>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWhatsApp({ part_number: partNumber, source: 'product_hero_whatsapp' })}
              className={cn(
                'inline-flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-xl border border-[--border] px-8 text-base font-semibold text-[--text-primary]',
                'bg-[--bg-elevated] transition-all duration-300',
                'hover:scale-[1.02] hover:border-emerald-400/35',
                'sm:min-w-[200px]'
              )}
            >
              <MessageCircle className="h-5 w-5 text-emerald-300" />
              WhatsApp
            </a>
          </div>

          <StockBadgeList badges={badges} className="mb-3 mt-2" />
          <TrustBlock partNumber={partNumber} locale={locale} className="mt-6" />

          {/* RFQ panel */}
          <section
            id="product-rfq-panel"
            aria-label="Request a quote for this product"
            className={cn(glass, 'scroll-mt-28 p-5 sm:p-6')}
          >
            {isSuccess && data ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                  <Check className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-[--text-primary]">
                  {locale === 'ar' ? 'تم استلام طلبك' : 'Your request has been received'}
                </h3>
                <p className="font-mono text-xl font-bold text-[--accent]">{data.reference}</p>
                <p className="text-sm text-[--text-secondary]">
                  {locale === 'ar' ? 'سنتواصل معك خلال 2-6 ساعات.' : 'We will contact you within 2–6 hours.'}
                </p>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackWhatsApp({ part_number: partNumber, source: 'product_inline_success_whatsapp' })}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-500/20"
                >
                  <MessageCircle className="h-4 w-4" />
                  {locale === 'ar' ? 'واتساب' : 'WhatsApp'}
                </a>
                <Link href={`/account/rfqs/${data.reference}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[--accent] hover:text-[--accent-hover]">
                  {locale === 'ar' ? 'تتبع عرض السعر' : 'Track quote'} <ChevronRight className="h-4 w-4" />
                </Link>
                <Button variant="secondary" fullWidth onClick={handleReset}>
                  {locale === 'ar' ? 'طلب آخر' : 'Request another'}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold uppercase tracking-wider text-[--text-secondary]">
                      {locale === 'ar' ? 'اطلب عرض السعر' : 'Request your quote'}
                    </h2>
                    <p className="mt-1 text-xs text-[--text-secondary]">
                      {locale === 'ar'
                        ? 'البريد الإلكتروني والكمية كافيان - الحقول التالية اختيارية.'
                        : 'Email &amp; quantity are enough — optional fields below.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedVariant) {
                        setVariantError('Choose a condition before adding to cart.')
                        scrollToRfqPanel()
                        return
                      }
                      if (addingToCart || isInRFQList) return
                      setAddingToCart(true)
                      void addItem({ part_number: partNumber, qty: Math.max(1, Number(quantity) || 1) })
                        .then(() => {
                          toast.success(locale === 'ar' ? 'تمت إضافة المنتج إلى السلة' : 'Added to cart')
                        })
                        .catch((e) => {
                          toast.error(e instanceof Error ? e.message : locale === 'ar' ? 'تعذر الإضافة إلى السلة' : 'Failed to add to cart')
                        })
                        .finally(() => {
                          setAddingToCart(false)
                        })
                    }}
                    disabled={isInRFQList || addingToCart}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-xs font-bold transition-all duration-300',
                      isInRFQList
                        ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100'
                        : 'border-[--accent]/40 bg-[--accent]/10 text-[--accent] hover:bg-[--accent]/20',
                    )}
                  >
                    {isInRFQList ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : addingToCart ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    {isInRFQList
                      ? (locale === 'ar' ? 'في السلة' : 'In cart')
                      : addingToCart
                        ? (locale === 'ar' ? 'جارٍ الإضافة...' : 'Adding...')
                        : locale === 'ar'
                          ? 'إضافة سريعة إلى السلة'
                          : 'Quick add to cart'}
                  </button>
                </div>
                {variantError ? (
                  <div
                    className="rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
                    role="alert"
                  >
                    {variantError}
                  </div>
                ) : null}
                <fieldset className="space-y-2.5 rounded-xl border border-[--border] bg-[--bg-surface] p-4">
                  <legend className="px-1 text-xs font-bold uppercase tracking-wider text-[--text-secondary]">
                    {locale === 'ar'
                      ? `الحالة${variants.length > 1 ? ' (اختر واحدة)' : ''}`
                      : `Condition${variants.length > 1 ? ' (select one)' : ''}`}
                  </legend>
                  <div className="space-y-2.5" role="radiogroup" aria-label="Product condition variant">
                    {variants.map((v, idx) => {
                      const key = variantOptionKey(v, idx)
                      const inputId =
                        idx === 0 ? 'product-variant-first' : `product-variant-${key.replace(/[^a-zA-Z0-9_-]/g, '_')}`
                      const selected = selectedVariantKey === key
                      return (
                        <label
                          key={key}
                          htmlFor={inputId}
                          className={cn(
                            'flex cursor-pointer flex-col gap-0.5 rounded-lg border px-3 py-2.5 transition-colors',
                            selected
                              ? 'border-[--accent]/45 bg-[--accent]/10'
                              : 'border-[--border] bg-[--bg-surface] hover:border-[--accent]/30',
                          )}
                        >
                          <span className="flex items-start gap-3">
                            <input
                              id={inputId}
                              type="radio"
                              name="product-variant"
                              checked={selected}
                              onChange={() => {
                                setSelectedVariantKey(key)
                                setVariantError(null)
                              }}
                              className="mt-1 h-4 w-4 shrink-0 border-white/30 text-orange-500 focus:ring-orange-400/40"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="mb-1 inline-flex w-fit rounded-md border border-violet-400/35 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-200/95">
                                {locale === 'ar' ? 'الحالة' : 'Condition'}
                              </span>
                              <span className="block text-sm font-semibold text-[--text-primary]">
                                {formatVariantConditionLabel(v.condition)}
                              </span>
                              <span className="mt-1 flex items-center gap-1.5 text-xs text-[--text-secondary]">
                                <span
                                  className={cn(
                                    'inline-block h-1.5 w-1.5 rounded-full',
                                    v.stock > 0 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]' : 'bg-amber-400/80',
                                  )}
                                  aria-hidden
                                />
                                {variantStockHint(v)}
                              </span>
                              {showExactPricing && v.price != null && Number.isFinite(v.price) ? (
                                <span className="mt-1.5 block text-base font-bold tabular-nums text-[--accent]">
                                  ${v.price.toFixed(2)}{' '}
                                  <span className="text-xs font-medium text-[--text-secondary]">USD list</span>
                                </span>
                              ) : hasListPrices && !showExactPricing ? (
                                <span className="mt-1.5 block text-xs text-[--text-secondary]">Sign in to see exact price</span>
                              ) : null}
                            </span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                  {hasListPrices && !showExactPricing ? (
                    <button
                      type="button"
                      onClick={openLoginModal}
                      className="w-full rounded-lg border border-[--accent]/35 bg-[--accent]/10 py-2.5 text-sm font-bold text-[--accent] transition-colors hover:bg-[--accent]/20"
                    >
                      {locale === 'ar' ? 'سجّل الدخول لرؤية الأسعار' : 'Login to view pricing'}
                    </button>
                  ) : null}
                </fieldset>
                <Input
                  label={locale === 'ar' ? 'رقم القطعة' : 'Part number'}
                  value={partNumber}
                  readOnly
                  comfortable
                  className="font-mono opacity-90"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label={locale === 'ar' ? 'بريد العمل' : 'Work email'}
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                    placeholder="you@company.com"
                    comfortable
                    autoComplete="email"
                  />
                  <Input
                    label={locale === 'ar' ? 'الكمية' : 'Quantity'}
                    type="number"
                    min={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    error={errors.quantity}
                    comfortable
                    inputMode="numeric"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label={locale === 'ar' ? 'اسمك (اختياري)' : 'Your name (optional)'}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    error={errors.contact_name}
                    placeholder={locale === 'ar' ? 'يساعدنا على تخصيص عرض السعر' : 'Helps us personalize your quote'}
                    comfortable
                    autoComplete="name"
                  />
                  <Input
                    label={locale === 'ar' ? 'الهاتف (اختياري)' : 'Phone (optional)'}
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    error={errors.phone}
                    placeholder="+20 …"
                    comfortable
                    autoComplete="tel"
                  />
                </div>
                <details className="group rounded-xl border border-[--border] bg-[--bg-elevated] open:border-[--accent]/25">
                  <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-[--text-secondary] transition-colors marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-2">
                      Company, country &amp; notes
                      <ChevronRight className="h-4 w-4 shrink-0 text-[--text-secondary] transition-transform group-open:rotate-90" />
                    </span>
                  </summary>
                  <div className="space-y-4 border-t border-[--border] px-4 pb-4 pt-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        label="Company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Optional"
                        comfortable
                        autoComplete="organization"
                      />
                      <Input
                        label="Country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="Optional"
                        comfortable
                        autoComplete="country-name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium text-[--text-secondary]">Message</span>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Urgency, target price, alternate parts…"
                        rows={3}
                        className="min-h-[88px] w-full resize-y rounded-xl border border-[--border] bg-[--bg-surface] px-3 py-3 text-base text-[--text-primary] outline-none transition-colors placeholder:text-[--text-secondary]/50 focus:border-[--accent]/40 focus:ring-2 focus:ring-[--accent]/15 sm:min-h-[72px] sm:text-sm"
                      />
                    </div>
                  </div>
                </details>
                <Link
                  href={fullRfqHref}
                  onClick={() =>
                    trackRfqCtaClick({
                      source: 'product_full_rfq_link',
                      part_number: partNumber,
                      product_id: productId ?? null,
                    })
                  }
                  className="block text-center text-sm font-medium text-[--accent] hover:text-[--accent-hover]"
                >
                  Open full RFQ form
                  {variants.length > 1 && !selectedVariant ? (
                    <span className="mt-0.5 block text-[11px] font-normal text-[--text-secondary]">
                      Select a condition above to include it in the link
                    </span>
                  ) : null}
                </Link>
                {error ? (
                  <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100" role="alert">
                    Could not submit. Try again or use WhatsApp.
                  </div>
                ) : null}
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  loading={isLoading}
                  disabled={!selectedVariant}
                  className="min-h-[52px] rounded-xl text-base font-bold"
                  onClick={() =>
                    trackRfqCtaClick({
                      source: 'product_inline_form_submit',
                      part_number: partNumber,
                      product_id: productId ?? null,
                    })
                  }
                >
                  {isLoading
                    ? 'Sending…'
                    : !selectedVariant
                      ? 'Select condition to add to RFQ'
                      : `Submit RFQ · ${formatVariantConditionLabel(selectedVariant.condition)}`}
                </Button>
                <p className="text-center text-[11px] text-[--text-secondary]">Typical reply within 2–6 hours · No obligation</p>
              </form>
            )}
          </section>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-14 border-b border-[--border]">
        <div className="flex gap-1 overflow-x-auto pb-px sm:gap-2">
          {(
            [
              { id: 'description' as const, label: 'Description', icon: FileText },
              { id: 'specifications' as const, label: 'Specifications', icon: Layers },
              ...(hasDatasheet ? [{ id: 'datasheet' as const, label: 'Datasheet', icon: Download }] : []),
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-semibold transition-all duration-300',
                tab === id ? 'text-[--text-primary]' : 'text-[--text-secondary] hover:text-[--text-primary]'
              )}
            >
              <Icon className="h-4 w-4 opacity-80" />
              {label}
              <span
                className={cn(
                  'absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-orange-400 to-purple-500 transition-all duration-300',
                  tab === id ? 'opacity-100 shadow-[0_0_12px_rgba(255,122,0,0.8)]' : 'opacity-0'
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 min-h-[120px]">
        {tab === 'description' && (
          <div className={cn(glass, 'p-6')}>
            <p className="leading-relaxed text-[--text-secondary]">
              {description || 'Detailed description will appear here when available from the manufacturer.'}
            </p>
          </div>
        )}
        {tab === 'specifications' && (
          <div className={cn(glass, 'p-6')}>
            {specEntries.length > 0 ? (
              <dl className="grid gap-4 sm:grid-cols-2">
                {specEntries.map(([k, v]) => (
                  <div
                    key={k}
                    className="flex flex-col gap-1 rounded-lg border border-[--border] bg-[--bg-surface] px-4 py-3 transition-all duration-300 hover:border-[--accent]/30"
                  >
                    <dt className="text-xs font-semibold uppercase tracking-wider text-[--text-secondary]">{k}</dt>
                    <dd className="font-mono text-sm text-[--text-primary]">{v}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-[--text-secondary]">Full specifications are not yet available for this SKU.</p>
            )}
          </div>
        )}
        {tab === 'datasheet' && hasDatasheet && (
          <div className={cn(glass, 'flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between')}>
            <p className="text-sm text-[--text-secondary]">Download the official technical datasheet (PDF).</p>
            <a
              href={datasheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[--accent] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[--accent-hover]"
            >
              <Download className="h-4 w-4" />
              Open datasheet
            </a>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          trackRfqCtaClick({ source: 'product_fab_rfq', part_number: partNumber, product_id: productId ?? null })
          scrollToRfqPanel()
        }}
        className="pointer-events-auto fixed bottom-8 right-8 z-30 hidden h-14 min-h-[56px] items-center gap-2 rounded-full border-2 border-[--accent]/50 bg-[--accent] px-6 text-sm font-bold text-white transition-all hover:scale-[1.04] hover:bg-[--accent-hover] lg:inline-flex"
        aria-label="Add to RFQ"
      >
        <Zap className="h-5 w-5" />
        Add to RFQ
      </button>

      {/* Mobile sticky — always visible above the fold when scrolling */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[--border] bg-[--bg-header] px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.4)] lg:hidden">
        <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-white/60">
          {isAvailable ? 'In stock · Fast delivery · Trusted supplier' : 'Fast sourcing · Trusted supplier'}
        </p>
        <div className="mx-auto flex max-w-lg gap-2">
          <button
            type="button"
            onClick={() => {
              trackRfqCtaClick({ source: 'product_mobile_sticky_rfq', part_number: partNumber, product_id: productId ?? null })
              scrollToRfqPanel()
            }}
            className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[--accent]/40 bg-[--accent] py-3.5 text-sm font-bold text-white hover:bg-[--accent-hover]"
          >
            <Zap className="h-4 w-4" />
            {primaryCtaLabel}
          </button>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsApp({ part_number: partNumber, source: 'product_mobile_sticky_whatsapp' })}
            className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 py-3.5 text-sm font-semibold text-white"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </div>
      </div>
      <div className="h-20 lg:hidden" aria-hidden />
    </div>
  )
}

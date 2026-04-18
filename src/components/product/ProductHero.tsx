'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Copy, Download } from 'lucide-react'
import { seriesToSlug } from '@/lib/constants'
import { asApiDisplayString } from '@/lib/utils'
import { trackLead, trackWhatsApp } from '@/lib/analytics'
import { SafeImage } from '@/components/ui/SafeImage'

export interface ProductHeroProduct {
  part_number: string
  name?: string
  brand?: string
  manufacturer?: string
  category?: string
  series?: string
  availability?: string
  image_url?: string
  brand_logo_url?: string
  images?: string[]
  description?: string
  specifications?: Record<string, unknown> | null
  voltage?: string
  current?: string
  mounting_type?: string
}

export interface ProductHeroProps {
  product: ProductHeroProduct
  imageSrc: string
  imageAlt?: string
  apiBase: string
  datasheetUrl?: string | null
  productBasePath?: string
  brandHref?: string | null
  categoryHref?: string | null
}

function availabilityStyle(value?: string) {
  const v = (value || '').toLowerCase()
  if (v.includes('stock') || v.includes('available')) {
    return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
  }
  if (v.includes('limited') || v.includes('request')) {
    return 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
  }
  return 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
}

export function ProductHero({
  product,
  imageSrc: _imageSrc,
  imageAlt,
  apiBase: _apiBase,
  datasheetUrl,
  productBasePath = '/products',
  brandHref,
  categoryHref,
}: ProductHeroProps) {
  const partNumber = product.part_number ?? ''
  const nameStr = asApiDisplayString(product.name)
  const title = nameStr || partNumber
  const rawBrand =
    asApiDisplayString(product.brand) || asApiDisplayString(product.manufacturer) || ''
  const rawCategory = asApiDisplayString(product.category) || ''
  const brand = rawBrand || 'Brand on request'
  const category = rawCategory || 'Category on request'
  const series = asApiDisplayString(product.series)
  const availability = product.availability || 'On Request'
  const availabilityClass = availabilityStyle(availability)
  const whatsappMessage = encodeURIComponent(`Hello, I need price for ${partNumber}`)
  const whatsappLink = `https://wa.me/201000629229?text=${whatsappMessage}`

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-14 items-start"
    >
      <div className="group mx-auto w-full max-w-[560px] rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60 transition-transform duration-500 hover:scale-[1.01]">
        <div className="relative mx-auto aspect-square w-full max-h-[480px] overflow-hidden rounded-xl bg-slate-50">
          <SafeImage
            src={product.image_url}
            alt={imageAlt ?? `${partNumber} product`}
            className="h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </div>

      <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-lg shadow-slate-200/60">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Industrial Component</p>
            <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight text-[#111827]">{title}</h1>
            <div className="mt-3 flex items-center gap-3 text-sm text-slate-600">
              <span className="font-medium text-[#0B1F3A]">{partNumber}</span>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(partNumber)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${availabilityClass}`}>
            {availability}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
          <span className="rounded-lg bg-slate-100 px-2.5 py-1">
            <span className="font-semibold text-slate-700">Brand</span>:{' '}
            {brandHref && rawBrand ? (
              <Link href={brandHref} className="text-[#0B1F3A] hover:underline" aria-label={`Brand: ${brand}`}>
                {brand}
              </Link>
            ) : (
              brand
            )}
          </span>
          <span className="rounded-lg bg-slate-100 px-2.5 py-1">
            <span className="font-semibold text-slate-700">Category</span>:{' '}
            {categoryHref && rawCategory ? (
              <Link href={categoryHref} className="text-[#0B1F3A] hover:underline" aria-label={`Category: ${category}`}>
                {category}
              </Link>
            ) : (
              category
            )}
          </span>
          {series ? (
            <span className="rounded-lg bg-slate-100 px-2.5 py-1">
              <span className="font-semibold text-slate-700">Series</span>:{' '}
              <Link
                href={`/series/${seriesToSlug(series)}`}
                className="text-[#0B1F3A] hover:underline"
                aria-label={`Series: ${series}`}
              >
                {series}
              </Link>
            </span>
          ) : null}
        </div>

        <p className="mt-5 text-[15px] leading-7 text-slate-600">
          {product.description || `${partNumber} is available for global industrial sourcing with full QA and documentation support.`}
        </p>

        <p className="mt-6 text-sm font-medium text-slate-600">
          Fast response within minutes
        </p>

        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href={`/rfq?part_number=${encodeURIComponent(partNumber)}`}
            onClick={() => trackLead({ part_number: partNumber, source: 'product_hero_primary' })}
            className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#ff9b45] px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-orange-300/60 transition hover:scale-[1.03] hover:shadow-2xl hover:shadow-orange-300/70"
          >
            ⚡ Get Price in 2 Minutes
          </Link>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsApp({ part_number: partNumber, source: 'product_hero_whatsapp' })}
            className="inline-flex min-h-[52px] items-center gap-2 rounded-xl border border-[#0B1F3A]/30 bg-white px-6 py-3.5 text-base font-semibold text-[#0B1F3A] shadow-md transition hover:scale-[1.02] hover:border-[#0B1F3A] hover:bg-slate-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
            💬 Get Instant Price on WhatsApp
          </a>
          {datasheetUrl && (
            <a
              href={datasheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              <Download className="w-4 h-4" />
              Datasheet
            </a>
          )}
        </div>

        <a
          href="tel:01000629229"
          className="mt-4 inline-flex items-center text-sm font-semibold text-[#0B1F3A] underline-offset-2 hover:underline"
        >
          📞 Call Now: 01000629229
        </a>

        <div className="mt-4 space-y-1 text-sm text-slate-500">
          <p>✔ Fast delivery (24–72h)</p>
          <p>✔ 100% Original Parts</p>
          <p>✔ Engineering Support</p>
          <p>✔ Global Sourcing</p>
          <p className="pt-1 font-medium text-amber-700">Limited stock available</p>
        </div>

        <div className="mt-5 border-t border-slate-200 pt-4">
          <Link
            href={`${productBasePath}/${encodeURIComponent(partNumber)}`}
            className="text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            Verified product identity and traceability
          </Link>
        </div>
      </div>
    </motion.section>
  )
}

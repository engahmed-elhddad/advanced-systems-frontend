'use client'

import { useState, useCallback, useEffect } from 'react'
import { z } from 'zod'
import Link from 'next/link'
import { Zap, Download, Check, Plus } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { SafeImage } from '@/components/common/SafeImage'
import { useRFQSubmit } from '@/hooks/useRFQSubmit'
import { useUIStore } from '@/state/uiStore'
import { useRFQListStore } from '@/state/rfqListStore'

const rfqSchema = z.object({
  email: z.string().email('Valid email required'),
  quantity: z.number().min(1, 'Minimum 1'),
  company: z.string().optional(),
})

interface Props {
  partNumber: string
  brandName: string
  categoryName: string
  description: string
  series: string
  specs: Record<string, string>
  galleryImages: string[]
  datasheetUrl: string
  availability: string
}

export function ProductDetail({
  partNumber,
  brandName,
  categoryName,
  description,
  series,
  specs,
  galleryImages,
  datasheetUrl,
  availability,
}: Props) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState('1')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [stickyScrolled, setStickyScrolled] = useState(false)
  const { submit, isLoading, isSuccess, data, error, reset } = useRFQSubmit()
  const openRFQModal = useUIStore((s) => s.openRFQModal)
  const addItem = useRFQListStore((s) => s.addItem)
  const rfqListItems = useRFQListStore((s) => s.items)
  const isInRFQList = rfqListItems.some((i) => i.part_number === partNumber)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('rfq_email')
      const savedCompany = localStorage.getItem('rfq_company')
      if (savedEmail) setEmail(savedEmail)
      if (savedCompany) setCompany(savedCompany)
    }
  }, [])

  useEffect(() => {
    const onScroll = () => setStickyScrolled(window.scrollY > 120)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const specEntries = Object.entries(specs)
  const specColumns = [
    {
      key: 'spec',
      header: 'Specification',
      render: (row: Record<string, unknown>) => (
        <span className="text-[#6B7280] text-sm">{String(row.spec)}</span>
      ),
    },
    {
      key: 'value',
      header: 'Value',
      render: (row: Record<string, unknown>) => (
        <span className="font-mono text-sm text-[#1A1A1A] font-medium">{String(row.value)}</span>
      ),
    },
  ]
  const specData = specEntries.map(([spec, value]) => ({ spec, value }))

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setErrors({})
      const parsed = rfqSchema.safeParse({
        email,
        quantity: Number(quantity),
        company: company || undefined,
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
      submit({
        part_number: partNumber,
        quantity: parsed.data.quantity,
        email: parsed.data.email,
        company: parsed.data.company ?? '',
      })
    },
    [email, quantity, company, partNumber, submit],
  )

  const handleReset = useCallback(() => {
    reset()
    setQuantity('1')
    setErrors({})
  }, [reset])

  const isAvailable = availability === 'in_stock' || availability === 'available'

  return (
    <>
      <div className="lg:grid lg:grid-cols-[1fr_380px] gap-10">
        {/* Left column */}
        <div className="space-y-8">
          <div>
            <h1 className="font-mono text-2xl font-bold text-[#0072CE]">{partNumber}</h1>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {brandName && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-semibold uppercase tracking-wider bg-[#E8F4FD] text-[#0072CE] border border-[#0072CE]/20">
                  {brandName}
                </span>
              )}
              {categoryName && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-semibold uppercase tracking-wider bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB]">
                  {categoryName}
                </span>
              )}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-semibold uppercase tracking-wider ${
                isAvailable
                  ? 'bg-[#D1FAE5] text-[#065F46] border border-[#10B981]/30'
                  : 'bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/30'
              }`}>
                {isAvailable ? 'In Stock' : 'On Request'}
              </span>
            </div>
          </div>

          {description && (
            <p className="text-sm text-[#1A1A1A] leading-relaxed">{description}</p>
          )}

          {series && (
            <p className="text-sm text-[#6B7280]">Series: <span className="font-medium text-[#1A1A1A] font-mono">{series}</span></p>
          )}

          {galleryImages.length > 0 ? (
            <div className="space-y-3">
              <div className="aspect-[4/3] flex items-center justify-center bg-white border border-[#E5E7EB] rounded-[2px] overflow-hidden p-4">
                <SafeImage
                  src={galleryImages[selectedImage] ?? galleryImages[0]}
                  alt={partNumber}
                  className="max-h-full w-full object-contain transition-opacity duration-150"
                />
              </div>
              {galleryImages.length > 1 && (
                <div className="flex gap-2">
                  {galleryImages.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedImage(i)}
                      className={`w-16 h-16 border rounded-[2px] overflow-hidden flex items-center justify-center p-1 transition-all duration-150 ${
                        i === selectedImage ? 'border-[#0072CE] ring-1 ring-[#0072CE]/20' : 'border-[#E5E7EB] hover:border-[#0072CE]/40'
                      }`}
                      aria-label={`View image ${i + 1}`}
                    >
                      <SafeImage
                        src={url}
                        alt={`${partNumber} view ${i + 1}`}
                        className="max-h-full w-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-[4/3] flex items-center justify-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-[2px]">
              <span className="text-[#9CA3AF] text-sm">No image available</span>
            </div>
          )}

          {datasheetUrl && datasheetUrl.startsWith('http') && (
            <a
              href={datasheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[#0072CE] hover:text-[#005BA4] font-medium transition-colors duration-150"
            >
              <Download className="w-4 h-4" />
              Download Datasheet
            </a>
          )}

          {specEntries.length > 0 ? (
            <div>
              <h2 className="text-base font-semibold text-[#1A1A1A] mb-3">Specifications</h2>
              <DataTable
                columns={specColumns}
                data={specData}
                rowKey={(row) => String(row.spec)}
              />
            </div>
          ) : (
            <p className="text-sm text-[#9CA3AF]">Specifications not yet available</p>
          )}
        </div>

        {/* Right column — sticky RFQ form (desktop) */}
        <div className="mt-8 lg:mt-0 hidden lg:block">
          <div className={`sticky top-20 bg-white border border-[#E5E7EB] rounded-[2px] p-6 transition-shadow duration-150 ${stickyScrolled ? 'shadow-md' : 'shadow-sm'}`}>
            {isSuccess && data ? (
              <div className="text-center space-y-4 animate-fadeIn">
                <div className="w-14 h-14 mx-auto bg-[#D1FAE5] rounded-[2px] flex items-center justify-center">
                  <Check className="w-7 h-7 text-[#065F46]" />
                </div>
                <h3 className="text-base font-semibold text-[#1A1A1A]">Price request submitted</h3>
                <p className="font-mono text-lg text-[#0072CE] font-bold">{data.reference}</p>
                <p className="text-xs text-[#6B7280]">
                  We&apos;ll send pricing to your email.
                </p>
                <Link
                  href={`/account/rfqs/${data.reference}`}
                  className="inline-block text-sm text-[#0072CE] hover:text-[#005BA4] font-medium transition-colors duration-150"
                >
                  Track your quote &rarr;
                </Link>
                <Button variant="secondary" fullWidth onClick={handleReset}>
                  Request Another Price
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[#0072CE]" />
                    <h3 className="text-base font-semibold text-[#1A1A1A]">Get Price in 2 Hours</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => addItem({ part_number: partNumber, quantity: Math.max(1, Number(quantity) || 1) })}
                    disabled={isInRFQList}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] border text-xs font-medium transition-colors duration-150 ${
                      isInRFQList
                        ? 'border-[#10B981]/30 bg-[#D1FAE5] text-[#065F46]'
                        : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#0072CE]/40 hover:text-[#0072CE]'
                    }`}
                  >
                    {isInRFQList ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {isInRFQList ? 'In List' : 'Add to List'}
                  </button>
                </div>
                <Input
                  label="Part Number"
                  value={partNumber}
                  readOnly
                  className="bg-[#F9FAFB] font-mono"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                    placeholder="you@company.com"
                  />
                  <Input
                    label="Quantity"
                    type="number"
                    min={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    error={errors.quantity}
                  />
                </div>
                <Input
                  label="Company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Optional"
                />
                {error && (
                  <div className="text-sm text-[#EF4444] bg-[#FEF2F2] border border-[#EF4444]/20 rounded-[2px] px-3 py-2" role="alert">
                    Submission failed. Please try again or contact us directly.
                  </div>
                )}
                <Button type="submit" variant="primary" fullWidth loading={isLoading}>
                  {isLoading ? 'Submitting...' : 'Get Price in 2 Hours'}
                </Button>
                <p className="text-[10px] text-[#6B7280] text-center">
                  Typical response: 2–4 hours &middot; No commitment required
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom CTA */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white border-t border-[#E5E7EB] px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
        <button
          type="button"
          onClick={() => openRFQModal(partNumber)}
          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-[2px] bg-[#0072CE] hover:bg-[#005BA4] text-white font-semibold text-sm transition-colors duration-150 shadow-sm"
        >
          <Zap className="w-4 h-4" />
          Get Price Now
        </button>
        <p className="text-[10px] text-[#6B7280] text-center mt-1">
          Typical response: 2–4 hours &middot; No commitment required
        </p>
      </div>
    </>
  )
}

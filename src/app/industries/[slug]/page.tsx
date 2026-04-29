import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Flame, Apple, Mountain, FlaskConical, Droplets, Car, type LucideIcon } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { API_BASE_URL, SITE_URL } from '@/lib/constants'
import { ProductCard } from '@/components/products/ProductCard'

// ── Static config ─────────────────────────────────────────────────────────────

type IndustryConfig = {
  slug: string
  name: string
  description: string
  Icon: LucideIcon
  categories: string[]
}

const INDUSTRIES: IndustryConfig[] = [
  {
    slug: 'oil-gas',
    name: 'Oil & Gas',
    description: 'Reliable automation for upstream, midstream, and downstream operations in hazardous environments.',
    Icon: Flame,
    categories: ['sensors', 'drive', 'plc', 'safety-relay'],
  },
  {
    slug: 'food-beverage',
    name: 'Food & Beverage',
    description: 'Hygienic automation components for processing, packaging, and quality control lines.',
    Icon: Apple,
    categories: ['sensors', 'hmi', 'plc', 'soft-starter', 'power-supply'],
  },
  {
    slug: 'cement',
    name: 'Cement',
    description: 'Heavy-duty drives, PLCs, and monitoring systems built for harsh cement plant conditions.',
    Icon: Mountain,
    categories: ['drive', 'plc', 'sensors', 'safety-relay'],
  },
  {
    slug: 'pharma',
    name: 'Pharma',
    description: 'Precision automation and safety systems for GMP-compliant pharmaceutical manufacturing.',
    Icon: FlaskConical,
    categories: ['sensors', 'hmi', 'plc', 'safety-relay'],
  },
  {
    slug: 'water',
    name: 'Water',
    description: 'Robust control and monitoring solutions for water treatment and distribution networks.',
    Icon: Droplets,
    categories: ['sensors', 'drive', 'plc', 'power-supply'],
  },
  {
    slug: 'automotive',
    name: 'Automotive',
    description: 'High-speed automation, motion control, and vision systems for automotive assembly lines.',
    Icon: Car,
    categories: ['plc', 'drive', 'sensors', 'hmi'],
  },
]

const INDUSTRY_MAP = new Map(INDUSTRIES.map((i) => [i.slug, i]))

// ── Data fetching ─────────────────────────────────────────────────────────────

type ProductItem = {
  id: number
  part_number: string
  slug?: string
  description?: string
  image_url?: string
  price_usd?: number | null
  availability?: 'in_stock' | 'on_request'
  brand_name?: string
  brand_slug?: string
  brand_logo_url?: string
  category?: string
}

async function fetchIndustryProducts(categories: string[]): Promise<ProductItem[]> {
  const qs = categories.map((c) => `category=${encodeURIComponent(c)}`).join('&')
  try {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/products/?${qs}&size=24`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.items ?? []
  } catch {
    return []
  }
}

// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return INDUSTRIES.map(({ slug }) => ({ slug }))
}

// ── Metadata ──────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const industry = INDUSTRY_MAP.get(slug)
  if (!industry) return { title: 'Industry' }
  const title = `${industry.name} Automation Parts | Advanced Systems`
  return {
    title,
    description: industry.description,
    alternates: { canonical: `${SITE_URL}/industries/${slug}` },
    openGraph: { title, description: industry.description },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function IndustryPage({ params }: Props) {
  const { slug } = await params
  const industry = INDUSTRY_MAP.get(slug)
  if (!industry) notFound()

  const { name, description, Icon, categories } = industry
  const products = await fetchIndustryProducts(categories)

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="border-b border-[--border] bg-[--bg-elevated] px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[--accent]/15 border border-[--accent]/30">
              <Icon className="h-7 w-7 text-[--accent]" aria-hidden />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[--text-primary]">{name}</h1>
              <p className="mt-1 max-w-2xl text-sm text-[--text-secondary]">{description}</p>
            </div>
          </div>

          {/* Category pills */}
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/categories/${cat}`}
                className="rounded-full border border-[--border] bg-[--bg-surface] px-3 py-1 text-xs font-medium text-[--text-secondary] capitalize transition-colors hover:border-[--accent]/40 hover:text-[--accent]"
              >
                {cat.replace(/-/g, ' ')}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Product grid */}
      <section className="page-container py-10">
        {products.length === 0 ? (
          <p className="text-center text-sm text-[--text-secondary]">No products found for this industry yet.</p>
        ) : (
          <>
            <p className="mb-6 text-sm text-[--text-secondary]">{products.length} products found</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  slug={p.slug}
                  part_number={p.part_number}
                  brand={p.brand_name}
                  brand_name={p.brand_name}
                  brand_slug={p.brand_slug}
                  brand_logo_url={p.brand_logo_url}
                  description={p.description}
                  image_url={p.image_url}
                  price_usd={p.price_usd}
                  availability={p.availability}
                  variant="compact"
                />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  )
}

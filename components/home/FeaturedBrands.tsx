import Link from 'next/link'
import { getBrands } from '@/lib/api'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { getBrandHref } from '@/lib/brandUtils'
import { BrandLogo } from '@/components/ui/BrandLogo'

export async function FeaturedBrands() {
  let brands: { name: string; slug?: string; product_count?: number; count?: number }[] = []
  try {
    const data = await getBrands()
    brands = (Array.isArray(data) ? data : data?.brands || []).slice(0, 12)
  } catch {}

  if (!brands.length) return null

  return (
    <section>
      <SectionHeader title="Top Manufacturers" viewAllHref="/brands" viewAllLabel="View all manufacturers" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {brands.map((brand) => (
          <Link
            key={brand.name}
            href={getBrandHref(brand)}
            className="flex flex-col items-center gap-2 px-4 py-4 rounded-lg border border-slate-200 bg-white hover:border-primary-300 hover:bg-primary-50/30 transition-colors group"
          >
            <BrandLogo brand={brand.name} logoClassName="h-8 max-w-[80px] object-contain" />
            <span className="font-medium text-slate-900 text-sm group-hover:text-primary-600 truncate w-full text-center">
              {brand.name}
            </span>
            {(brand.product_count ?? brand.count ?? 0) > 0 && (
              <span className="text-xs text-slate-500">{(brand.product_count ?? brand.count)} products</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}

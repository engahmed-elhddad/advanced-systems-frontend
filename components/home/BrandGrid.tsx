'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { getBrandHref } from '@/lib/brandUtils'

export interface BrandGridProps {
  brands: Array<{ name: string; slug?: string; product_count?: number; count?: number }>
  title?: string
  viewAllHref?: string
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
}

export function BrandGrid({
  brands,
  title = 'Top Manufacturers',
  viewAllHref = '/brands',
}: BrandGridProps) {
  if (!brands?.length) return null

  return (
    <section className="bg-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          {title}
        </h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm font-medium text-accent-600 hover:text-accent-700 transition-colors"
          >
            View all
          </Link>
        )}
      </div>
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {brands.map((brand) => (
          <motion.div key={brand.name} variants={item}>
            <Link
              href={getBrandHref(brand)}
              className="flex flex-col items-center gap-2.5 p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-accent-300 hover:bg-accent-50/30 transition-all duration-200 group"
            >
              <div className="h-12 flex items-center justify-center">
                <BrandLogo
                  brand={brand.name}
                  logoClassName="h-10 max-w-[90px] object-contain opacity-90 group-hover:opacity-100"
                  badgeClassName="hidden"
                />
              </div>
              <span className="font-medium text-slate-800 text-sm group-hover:text-accent-700 truncate w-full text-center transition-colors">
                {brand.name}
              </span>
              {(brand.product_count ?? brand.count ?? 0) > 0 && (
                <span className="text-xs text-slate-500">
                  {(brand.product_count ?? brand.count)} products
                </span>
              )}
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

import Link from 'next/link'
import { ProductSlugNotFoundClient } from './ProductSlugNotFoundClient'

export default function ProductNotFound() {
  return (
    <div className="relative z-10 min-h-screen">
      <div className="pointer-events-none absolute left-1/2 top-24 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-orange-500/15 blur-[100px]" aria-hidden />
      <div className="page-container pb-24 pt-10 sm:pt-14">
        <nav className="mb-8 text-xs text-white/50" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="transition-colors hover:text-orange-300">
                Home
              </Link>
            </li>
            <li className="text-white/25" aria-hidden>
              /
            </li>
            <li>
              <Link href="/products" className="transition-colors hover:text-orange-300">
                Products
              </Link>
            </li>
            <li className="text-white/25" aria-hidden>
              /
            </li>
            <li className="font-medium text-white/80" aria-current="page">
              Not found
            </li>
          </ol>
        </nav>

        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300/90">404</p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Product not found</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/55">
            This part may have moved, or the link is outdated. Use search below or request a quote — we source
            thousands of SKUs.
          </p>
        </div>

        <ProductSlugNotFoundClient />
      </div>
    </div>
  )
}

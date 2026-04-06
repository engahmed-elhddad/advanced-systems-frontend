import { apiFetch } from '@/lib/api'
import Link from "next/link"
import { BRAND_MAP, BRAND_DESCRIPTIONS } from "@/app/lib/brands"
import { API_BASE_URL, SITE_URL } from "@/app/lib/constants"

export const metadata = {
  title: "All Brands | Advanced Systems – Industrial Automation",
  description:
    "Browse all industrial automation brands available at Advanced Systems including Siemens, ABB, Schneider Electric, Omron, and more.",
  alternates: { canonical: `${SITE_URL}/brands` },
}

const BRAND_CATEGORIES_FALLBACK: Record<string, string[]> = {
  "PLC & Automation": ["Siemens", "ABB", "Schneider Electric", "Omron", "Mitsubishi"],
  "Sensors & Safety": ["SICK", "IFM", "Balluff", "Pilz"],
  "Drives & Motion": ["Delta"],
}

async function fetchBrandsFromApi(): Promise<string[]> {
  try {
    const api = API_BASE_URL
    const res = await apiFetch(`${api}/brands`, { next: { revalidate: 3600 } })
    const data = await res.json()
    const list = data?.brands ?? data
    if (Array.isArray(list)) {
      return list.map((b: unknown) => (typeof b === "string" ? b : (b as { name?: string })?.name ?? "")).filter(Boolean)
    }
    return []
  } catch {
    return []
  }
}

function slugOf(brand: string): string {
  const entry = Object.entries(BRAND_MAP).find(([, v]) => v === brand)
  return entry ? entry[0] : brand.toLowerCase().replace(/\s+/g, "-")
}

function BrandCard({ brand }: { brand: string }) {
  const slug = slugOf(brand)
  const desc = BRAND_DESCRIPTIONS[brand] ?? ""
  return (
    <Link
      href={`/brand/${slug}`}
      className="card group p-6 flex flex-col items-center text-center"
    >
      <div className="w-16 h-16 mb-3 flex items-center justify-center rounded-xl bg-accent-50 text-2xl font-bold text-accent-600 group-hover:bg-accent-100 transition-colors">
        {brand.charAt(0)}
      </div>
      <span className="font-semibold text-gray-900 group-hover:text-accent-600 transition-colors">{brand}</span>
      {desc && (
        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-tight">{desc.slice(0, 80)}…</p>
      )}
      <span className="mt-3 text-xs font-medium text-accent-600 group-hover:underline">View Parts →</span>
    </Link>
  )
}

export default async function BrandsPage() {
  const apiBrands = await fetchBrandsFromApi()
  const ALL_BRANDS = apiBrands.length > 0 ? apiBrands : Object.values(BRAND_MAP)
  const BRAND_CATEGORIES =
    apiBrands.length > 0
      ? { "All Brands": ALL_BRANDS.slice(0, 24) }
      : BRAND_CATEGORIES_FALLBACK

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-gray-50 py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <span className="inline-flex items-center gap-2 text-accent-600 text-sm font-semibold uppercase tracking-widest mb-4">
            Industrial Manufacturers
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            Industrial Automation Brands
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Browse our catalog by manufacturer. We stock genuine parts from the world&apos;s leading industrial automation brands.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {[
            { label: "Manufacturers", value: `${ALL_BRANDS.length}+` },
            { label: "Products Listed", value: "400+" },
            { label: "Categories", value: "8+" },
            { label: "Years Experience", value: "15+" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-soft">
              <div className="text-2xl font-bold text-accent-600 mb-0.5">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {Object.entries(BRAND_CATEGORIES).map(([cat, brands]) => (
          <div key={cat} className="mb-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-gray-200" />
              <span>{cat}</span>
              <span className="h-px flex-1 bg-gray-200" />
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {(brands as string[]).map((brand) => (
                <BrandCard key={brand} brand={brand} />
              ))}
            </div>
          </div>
        ))}

        <div className="mt-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-gray-200" />
            <span>All Brands A–Z</span>
            <span className="h-px flex-1 bg-gray-200" />
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[...ALL_BRANDS].sort().map((brand) => (
              <Link
                key={brand}
                href={`/brand/${slugOf(brand)}`}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 hover:border-accent-300 hover:bg-accent-50 hover:text-accent-700 transition-all text-center truncate"
              >
                {brand}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Don&apos;t see your brand?</h2>
          <p className="text-gray-600 mb-5 max-w-md mx-auto">
            We can source parts from many more manufacturers. Submit an RFQ and our team will find it for you.
          </p>
          <Link
            href="/rfq"
            className="inline-flex items-center px-5 py-2.5 rounded-lg bg-accent-600 hover:bg-accent-700 text-white font-semibold text-sm transition-colors"
          >
            Submit RFQ →
          </Link>
        </div>
      </div>
    </div>
  )
}

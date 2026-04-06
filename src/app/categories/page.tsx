import { getCategories } from '@/lib/api'
import { CATEGORIES } from '@/app/lib/constants'
import { CategoryCard } from '@/components/ui/CategoryCard'
import { Container, Section, Input } from '@/components/ui'

const TOP_CATEGORY_SLUGS = [
  'plc',
  'sensors',
  'drive',
  'power-supply',
]

export const metadata = {
  title: 'Product Categories | Advanced Systems',
  description: 'Browse industrial automation parts by category: PLC, drives, sensors, HMI, and more.',
}

export default async function CategoriesPage() {
  let apiCategories: { name: string; slug?: string; product_count?: number }[] = []
  try {
    const data = await getCategories()
    apiCategories = Array.isArray(data) ? data : data?.categories || []
  } catch {}
  const categories =
    apiCategories.length > 0
      ? apiCategories.map((cat) => ({
          name: cat.name,
          slug: cat.slug,
          count: Number(cat.product_count ?? 0),
        }))
      : CATEGORIES.map((c) => ({ name: c.name, slug: c.slug, count: 0 }))

  const topCategories = categories.filter((cat) => TOP_CATEGORY_SLUGS.includes((cat.slug || '').toLowerCase()))
  const otherCategories = categories.filter((cat) => !TOP_CATEGORY_SLUGS.includes((cat.slug || '').toLowerCase()))

  return (
    <div className="min-h-screen bg-white">
      <Section className="relative overflow-hidden bg-[#0B1220] px-4" spacing="lg">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, rgba(0,114,206,0.35), transparent 35%), radial-gradient(circle at 80% 10%, rgba(14,165,233,0.25), transparent 35%)",
          }}
        />
        <Container className="relative flex w-full flex-col items-center text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Find Industrial Parts
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
            Search by part number, brand, or category
          </p>
          <form action="/search" className="mt-8 w-full max-w-3xl">
            <Input
              type="search"
              name="q"
              placeholder="Search by part number, brand, or category..."
              className="h-14 bg-white text-[15px] text-slate-900"
              aria-label="Search industrial parts"
            />
          </form>
        </Container>
      </Section>

      <Container className="py-14 sm:py-16">
        {topCategories.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Top Categories</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {topCategories.map((cat) => (
                <CategoryCard
                  key={`top-${cat.name}`}
                  name={cat.name}
                  slug={cat.slug}
                  count={cat.count}
                  variant="large"
                />
              ))}
            </div>
          </section>
        )}

        <div className="my-12 border-t border-slate-200" />

        <section>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">All Categories</h2>
          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 lg:gap-8">
            {otherCategories.map((cat) => (
              <CategoryCard
                key={cat.name}
                name={cat.name}
                slug={cat.slug}
                count={cat.count}
              />
            ))}
          </div>
        </section>
      </Container>
    </div>
  )
}

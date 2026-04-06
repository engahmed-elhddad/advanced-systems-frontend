'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useProductDetail } from '@/features/products/hooks/useProductDetail'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorBanner } from '@/components/shared/ErrorBanner'
import { Empty } from '@/components/shared/Empty'
import { Package } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { RFQButton } from '@/components/RFQButton'

export interface ProductDetailProps {
  slug: string
}

export function ProductDetail({ slug }: ProductDetailProps) {
  const router = useRouter()
  const { data, isLoading, isError, error, refetch } = useProductDetail(slug)

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton variant="rect" height={240} className="w-full" />
        <Skeleton variant="line" className="w-2/3" />
        <Skeleton variant="line" className="w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorBanner
        message={error instanceof Error ? error.message : 'Could not load product'}
        onRetry={() => void refetch()}
      />
    )
  }

  if (!data) {
    return (
      <Empty
        icon={<Package className="h-12 w-12" />}
        title="Product not found"
        description="This part may have been removed or the link is outdated."
        action={{ label: 'Browse products', onClick: () => router.push('/products') }}
      />
    )
  }

  const specs = data.specs && typeof data.specs === 'object' ? data.specs : {}

  return (
    <article className="page-container space-y-8 py-8">
      <header className="space-y-2">
        <p className="font-mono text-sm text-[var(--color-primary)]">{data.part_number}</p>
        <h1 className="text-3xl font-bold text-[var(--color-foreground)]">{data.name ?? data.part_number}</h1>
        <p className="text-[var(--color-foreground-muted)]">
          {[data.brand, data.category].filter(Boolean).join(' · ')}
        </p>
      </header>
      <div className="flex flex-wrap gap-3">
        <RFQButton partNumber={data.part_number} />
        <Link href="/rfq">
          <Button type="button" variant="outline">
            Full RFQ form
          </Button>
        </Link>
      </div>
      {Object.keys(specs).length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Specifications</h2>
          <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(specs).map(([k, v]) => (
                  <tr key={k} className="border-b border-[var(--color-border)] last:border-0">
                    <th className="bg-[var(--color-background-secondary)] px-3 py-2 text-left font-medium text-[var(--color-foreground-muted)]">
                      {k}
                    </th>
                    <td className="px-3 py-2 text-[var(--color-foreground)]">{String(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </article>
  )
}

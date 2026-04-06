import Link from 'next/link'

interface SectionHeaderProps {
  title: string
  viewAllHref?: string
  viewAllLabel?: string
}

export function SectionHeader({ title, viewAllHref, viewAllLabel = 'View all' }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="section-title">{title}</h2>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          {viewAllLabel} →
        </Link>
      )}
    </div>
  )
}

'use client'

import { FileText, Download } from 'lucide-react'

export interface ProductDatasheetProps {
  partNumber: string
  datasheetUrl?: string | null
  apiBase?: string
  className?: string
}

export function ProductDatasheet({
  partNumber,
  datasheetUrl,
  apiBase = '',
  className = '',
}: ProductDatasheetProps) {
  const fullUrl =
    typeof datasheetUrl === 'string' && datasheetUrl
      ? datasheetUrl.startsWith('http')
        ? datasheetUrl
        : `${apiBase}${datasheetUrl.startsWith('/') ? '' : '/'}${datasheetUrl}`
      : null

  return (
    <section aria-labelledby="datasheet-heading" className={className}>
      <h2 id="datasheet-heading" className="text-xl font-semibold text-gray-900 mb-4">
        Datasheet
      </h2>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="p-5">
          {fullUrl ? (
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 hover:bg-accent-50 hover:border-accent-200 hover:text-accent-700 font-medium text-sm transition-colors"
            >
              <FileText className="h-5 w-5 text-accent-600 shrink-0" />
              <span>Download Datasheet – {partNumber}</span>
              <Download className="h-4 w-4 shrink-0 opacity-70" />
            </a>
          ) : (
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <FileText className="h-5 w-5 text-gray-400 shrink-0" />
              <span>Datasheet not yet available for this product.</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

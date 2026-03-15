'use client'

import { motion } from 'framer-motion'
import { FileText, ExternalLink } from 'lucide-react'

export interface ProductDocumentationProps {
  partNumber: string
  datasheetUrl?: string | null
  apiBase?: string
  className?: string
}

export function ProductDocumentation({
  partNumber,
  datasheetUrl,
  apiBase = '',
  className = '',
}: ProductDocumentationProps) {
  const fullUrl =
    typeof datasheetUrl === 'string' && datasheetUrl
      ? datasheetUrl.startsWith('http')
        ? datasheetUrl
        : `${apiBase}${datasheetUrl.startsWith('/') ? '' : '/'}${datasheetUrl}`
      : null

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Documentation &amp; Downloads
      </h2>
      <div className="rounded-xl border border-gray-200 bg-white shadow-md overflow-hidden">
        <div className="p-5">
          {fullUrl ? (
            <motion.a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ x: 2 }}
              className="inline-flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 font-medium text-sm transition-colors"
            >
              <FileText className="h-5 w-5 text-blue-600 shrink-0" />
              <span>Datasheet – {partNumber}</span>
              <ExternalLink className="h-4 w-4 shrink-0 opacity-70" />
            </motion.a>
          ) : (
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <FileText className="h-5 w-5 text-gray-400 shrink-0" />
              <span>Datasheet not yet available for this product.</span>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  )
}

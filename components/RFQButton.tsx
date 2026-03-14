'use client'

import Link from 'next/link'
import { FileText } from 'lucide-react'

export interface RFQButtonProps {
  partNumber: string
  variant?: 'default' | 'outline' | 'sm'
  className?: string
}

export function RFQButton({ partNumber, variant = 'default', className = '' }: RFQButtonProps) {
  const href = `/rfq?part_number=${encodeURIComponent(partNumber)}`

  const base = 'inline-flex items-center justify-center gap-2 font-semibold transition-colors'
  const variants = {
    default:
      'px-5 py-2.5 rounded-lg bg-accent-600 hover:bg-accent-700 text-white text-sm shadow-sm',
    outline:
      'px-4 py-2 rounded-lg border border-accent-600 text-accent-600 hover:bg-accent-50 text-sm',
    sm:
      'px-3 py-1.5 rounded-lg bg-accent-600 hover:bg-accent-700 text-white text-xs',
  }

  return (
    <Link
      href={href}
      className={`${base} ${variants[variant]} ${className}`}
      aria-label={`Request quote for ${partNumber}`}
    >
      <FileText className={variant === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      RFQ
    </Link>
  )
}

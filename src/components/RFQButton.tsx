'use client'

import { Zap } from 'lucide-react'
import { useUIStore } from '@/state/uiStore'

export interface RFQButtonProps {
  partNumber: string
  variant?: 'default' | 'outline' | 'sm'
  className?: string
}

export function RFQButton({ partNumber, variant = 'default', className = '' }: RFQButtonProps) {
  const openRFQModal = useUIStore((s) => s.openRFQModal)

  const base = 'inline-flex items-center justify-center gap-1.5 font-semibold transition-colors duration-150'
  const variants = {
    default:
      'px-5 py-2.5 rounded-[2px] bg-[#0072CE] hover:bg-[#005BA4] text-white text-sm shadow-sm',
    outline:
      'px-4 py-2 rounded-[2px] border border-[#0072CE] text-[#0072CE] hover:bg-[#E8F4FD] text-sm',
    sm:
      'px-3 py-1.5 rounded-[2px] bg-[#0072CE] hover:bg-[#005BA4] text-white text-xs',
  }

  return (
    <button
      type="button"
      onClick={() => openRFQModal(partNumber)}
      className={`${base} ${variants[variant]} ${className}`}
      aria-label={`Get price for ${partNumber}`}
    >
      <Zap className={variant === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {variant === 'sm' ? 'Get Price' : 'Get Price in 2 Hours'}
    </button>
  )
}

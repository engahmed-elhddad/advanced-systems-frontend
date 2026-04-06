'use client'

import { useEffect, useMemo, useState } from 'react'
import { track } from '@/lib/analytics'

type Variant = 'A' | 'B'

const EXPERIMENT_KEY = 'cro_funnel_v1'
const SUB_VARIANT_KEY = 'cro_funnel_v1_sub'

function readOrAssignVariant(): Variant {
  if (typeof window === 'undefined') return 'A'
  const existing = localStorage.getItem(EXPERIMENT_KEY)
  if (existing === 'A' || existing === 'B') return existing
  const assigned: Variant = Math.random() < 0.5 ? 'A' : 'B'
  localStorage.setItem(EXPERIMENT_KEY, assigned)
  return assigned
}

function readOrAssignSubVariant(): number {
  if (typeof window === 'undefined') return 0
  const existing = Number(localStorage.getItem(SUB_VARIANT_KEY))
  if (Number.isInteger(existing) && existing >= 0 && existing <= 2) return existing
  const assigned = Math.floor(Math.random() * 3)
  localStorage.setItem(SUB_VARIANT_KEY, String(assigned))
  return assigned
}

export function useCroVariant(partNumber?: string) {
  const [variant, setVariant] = useState<Variant>('A')
  const [subVariant, setSubVariant] = useState(0)

  useEffect(() => {
    setVariant(readOrAssignVariant())
    setSubVariant(readOrAssignSubVariant())
  }, [])

  useEffect(() => {
    const normalized = (partNumber || '').trim() || 'global'
    track('ab_exposure', {
      experiment: 'cro_funnel_v1',
      variant,
      sub_variant: subVariant,
      part_number: normalized,
    })
  }, [partNumber, variant, subVariant])

  return useMemo(() => {
    const primaryB = ['Get Price Now', 'Check Availability', 'Get Price Now'][subVariant] || 'Get Price Now'
    const whatsappB = ['Chat Now', 'Get Instant Quote', 'Talk to Engineer'][subVariant] || 'Chat Now'

    if (variant === 'B') {
      return {
        variant,
        primaryText: primaryB,
        whatsappText: whatsappB,
        stickyPlacement: 'left',
        primaryButtonClass:
          'inline-flex items-center justify-center rounded-xl bg-[#0B1F3A] px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02] hover:bg-[#102a4f]',
      }
    }

    return {
      variant,
      primaryText: 'Request Quote',
      whatsappText: 'Get Instant Quote',
      stickyPlacement: 'right',
      primaryButtonClass:
        'inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#ff9b45] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-300/50 transition hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-300/60',
    }
  }, [subVariant, variant])
}

'use client'

import { useI18n } from '@/lib/i18n'

/** Resolve storefront locale for storefront client components. */
export function useLocale(): 'en' | 'ar' {
  const { locale } = useI18n()
  return locale
}

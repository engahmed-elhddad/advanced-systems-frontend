'use client'

import { usePathname } from 'next/navigation'

/** Resolve storefront locale for client components (spec 017 badges + future i18n). */
export function useLocale(): 'en' | 'ar' {
  const pathname = usePathname() || ''
  const seg = pathname.split('/').filter(Boolean)[0]
  if (seg === 'ar') return 'ar'
  if (typeof document !== 'undefined') {
    const c = document.cookie.match(/(?:^|; )locale=ar(?:;|$)/)
    if (c) return 'ar'
    const lang = (document.documentElement.lang || '').toLowerCase()
    if (lang.startsWith('ar')) return 'ar'
  }
  return 'en'
}

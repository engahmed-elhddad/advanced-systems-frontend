'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Locale = 'en' | 'ar'

type Messages = Record<string, { en: string; ar: string }>

const MESSAGES: Messages = {
  'nav.brands': { en: 'Brands', ar: 'العلامات التجارية' },
  'nav.categories': { en: 'Categories', ar: 'الفئات' },
  'nav.rfq': { en: 'RFQ Tool', ar: 'أداة طلب العرض' },
  'nav.trackOrder': { en: 'Track Order', ar: 'تتبع الطلب' },
  'nav.login': { en: 'Login', ar: 'تسجيل الدخول' },
  'nav.customerLogin': { en: 'Customer Login', ar: 'دخول العملاء' },
  'nav.adminLogin': { en: 'Admin Login', ar: 'دخول الإدارة' },
  'nav.myCompany': { en: 'My Company', ar: 'شركتي' },
  'nav.getPrice': { en: 'Get Price', ar: 'احصل على السعر' },
  'nav.searchPlaceholder': { en: 'Search parts, brands, or categories', ar: 'ابحث عن القطع أو العلامات أو الفئات' },
  'nav.mobileSearchPlaceholder': { en: 'Search parts, brands…', ar: 'ابحث عن القطع والعلامات…' },
  'nav.utilityTagline': { en: 'Industrial Automation Parts & Components', ar: 'قطع ومكونات الأتمتة الصناعية' },
  'nav.langToggle': { en: 'EN | عربي', ar: 'EN | عربي' },
  'nav.themeToggle': { en: 'Toggle theme', ar: 'تبديل المظهر' },
  'nav.theme': { en: 'Theme', ar: 'المظهر' },
  'nav.openMenu': { en: 'Open menu', ar: 'فتح القائمة' },
  'nav.closeMenu': { en: 'Close menu', ar: 'إغلاق القائمة' },

  'cart.title': { en: 'Quote cart', ar: 'سلة التسعير' },
  'cart.loading': { en: 'Loading cart…', ar: 'جاري تحميل السلة…' },
  'cart.empty': { en: 'Your quote cart is empty', ar: 'سلة التسعير فارغة' },
  'cart.browse': { en: 'Browse search', ar: 'تصفح البحث' },
  'cart.hs': { en: 'HS', ar: 'رمز HS' },
  'cart.subtotal': { en: 'Subtotal', ar: 'الإجمالي الفرعي' },
  'cart.vat': { en: 'VAT 14%', ar: 'ضريبة القيمة المضافة 14%' },
  'cart.total': { en: 'Total', ar: 'الإجمالي' },
  'cart.proceed': { en: 'Proceed to checkout', ar: 'المتابعة إلى الدفع' },

  'checkout.title': { en: 'Checkout', ar: 'إتمام الشراء' },
  'checkout.subtitle': { en: 'VAT 14% and dual-currency totals are shown before confirmation.', ar: 'تُعرض ضريبة 14% والإجماليات بالعملتين قبل التأكيد.' },
  'checkout.confirmed': { en: 'Order confirmed', ar: 'تم تأكيد الطلب' },
  'checkout.approvalRequested': { en: 'Approval requested', ar: 'تم إرسال طلب موافقة' },
  'checkout.paymentMethod': { en: 'Payment method', ar: 'طريقة الدفع' },
  'checkout.orderSummary': { en: 'Order summary', ar: 'ملخص الطلب' },
  'checkout.confirmAction': { en: 'Confirm checkout', ar: 'تأكيد الشراء' },
  'checkout.processing': { en: 'Processing checkout...', ar: 'جاري تنفيذ الطلب...' },
  'checkout.continueShopping': { en: 'Continue shopping', ar: 'متابعة التسوق' },
  'checkout.paymentCard': { en: 'Card payment (Paymob)', ar: 'الدفع بالبطاقة (Paymob)' },
  'checkout.paymentBank': { en: 'Bank transfer', ar: 'تحويل بنكي' },
  'checkout.paymentNet30': { en: 'Net-30 (approved B2B only)', ar: 'صافي 30 (لشركات B2B المعتمدة فقط)' },

  'search.popular.1': { en: 'Siemens PLC', ar: 'سيمنس PLC' },
  'search.popular.2': { en: 'ABB Drive', ar: 'ABB درايف' },
  'search.popular.3': { en: 'Omron Sensor', ar: 'حساس أومرون' },
  'search.popular.4': { en: 'SICK photoelectric', ar: 'حساس ضوئي SICK' },
}

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, fallbackEn?: string, fallbackAr?: string) => string
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (key, fallbackEn, fallbackAr) => fallbackEn ?? fallbackAr ?? key,
})

function readInitialLocale(): Locale {
  if (typeof document === 'undefined') return 'en'
  const cookieAr = document.cookie.match(/(?:^|; )locale=ar(?:;|$)/)
  if (cookieAr) return 'ar'
  const htmlLang = (document.documentElement.lang || '').toLowerCase()
  if (htmlLang.startsWith('ar')) return 'ar'
  return 'en'
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    setLocaleState(readInitialLocale())
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.cookie = `locale=${locale}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`
    document.documentElement.lang = locale
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  }, [locale])

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale: (l) => setLocaleState(l),
      t: (key, fallbackEn, fallbackAr) => {
        const row = MESSAGES[key]
        if (row) return row[locale]
        if (locale === 'ar') return fallbackAr ?? fallbackEn ?? key
        return fallbackEn ?? key
      },
    }),
    [locale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}

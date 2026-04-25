import Link from 'next/link'
import { Zap, Mail, Phone, MapPin, Shield } from 'lucide-react'
import {
  COMPANY_BRAND_SHORT,
  COMPANY_DESCRIPTION,
  COMPANY_LOCATION_LINES,
  COMPANY_NAME_EN,
  COMPANY_TRUST_STATEMENTS,
} from '@/lib/company'
import { CONTACT_EMAIL, supportPhoneDisplay, supportPhoneTelHref } from '@/lib/constants'

const COPYRIGHT_YEAR = 2026

export function Footer() {
  const tel = supportPhoneTelHref()
  const phoneLabel = supportPhoneDisplay() || 'Contact us'

  return (
    <footer className="mt-auto border-t border-white/10" style={{ backgroundColor: '#0E1116' }}>
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-12">
          <div className="md:col-span-1">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF7A00] to-[#FF5500] shadow-lg shadow-orange-500/30">
                <Zap size={16} className="text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                Advanced<span className="text-orange-300">Systems</span>
              </span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/45">{COMPANY_NAME_EN}</p>
            <p className="mt-3 text-sm leading-relaxed text-white/55">{COMPANY_DESCRIPTION}</p>
            <ul className="mt-4 space-y-1.5 text-xs text-white/45">
              {COMPANY_TRUST_STATEMENTS.map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <Shield size={12} className="mt-0.5 shrink-0 text-emerald-400/70" aria-hidden />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/45">Products</h3>
            <ul className="space-y-2.5 text-sm text-white/55">
              {['PLCs', 'Drives & Inverters', 'Sensors', 'HMI Panels', 'Safety Systems'].map((item) => (
                <li key={item}>
                  <Link href="/products" className="transition-colors hover:text-orange-200">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/45">Services</h3>
            <ul className="space-y-2.5 text-sm text-white/55">
              {[
                { label: 'Request a Quote', href: '/rfq' },
                { label: 'Product Search', href: '/search' },
                { label: 'Brands', href: '/brands' },
                { label: 'Categories', href: '/categories' },
                { label: 'About', href: '/about' },
                { label: 'Contact', href: '/contact' },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition-colors hover:text-orange-200">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/45">Contact</h3>
            <ul className="space-y-3 text-sm text-white/55">
              <li className="flex items-start gap-2">
                <Mail size={14} className="mt-0.5 shrink-0 text-orange-400" aria-hidden />
                <a href={`mailto:${CONTACT_EMAIL}`} className="break-all transition-colors hover:text-orange-200">
                  {CONTACT_EMAIL}
                </a>
              </li>
              {tel ? (
                <li className="flex items-center gap-2">
                  <Phone size={14} className="shrink-0 text-orange-400" aria-hidden />
                  <a href={tel} className="transition-colors hover:text-orange-200">
                    {phoneLabel}
                  </a>
                </li>
              ) : null}
              <li className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 shrink-0 text-orange-400" aria-hidden />
                <span className="leading-relaxed">
                  {COMPANY_LOCATION_LINES.map((line, i) => (
                    <span key={line}>
                      {i > 0 ? <br /> : null}
                      {line}
                    </span>
                  ))}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-10 md:flex-row">
          <p className="text-sm text-white/40">
            © {COPYRIGHT_YEAR} {COMPANY_BRAND_SHORT}. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-white/40">
            <Link href="/sitemap.xml" className="transition-colors hover:text-white/70">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

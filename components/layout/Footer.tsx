import Link from 'next/link'
import { Zap, Mail, Search, FileText } from 'lucide-react'
import { CONTACT_EMAIL } from '@/app/lib/constants'
import { Container } from '@/components/ui/Container'

export function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 mt-16">
      <Container className="py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900 text-lg">
                Advanced<span className="text-primary-600">Systems</span>
              </span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed max-w-sm mb-4">
              The industrial parts search engine. Find PLCs, drives, sensors and automation components from 500+ manufacturers.
            </p>
            <Link href="/search" className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700">
              <Search className="w-4 h-4" />
              Search parts
            </Link>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 text-sm mb-3">Parts by Category</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/categories" className="hover:text-primary-600">All categories</Link></li>
              <li><Link href="/search?q=PLC" className="hover:text-primary-600">PLCs</Link></li>
              <li><Link href="/search?q=Drive" className="hover:text-primary-600">Drives</Link></li>
              <li><Link href="/search?q=Sensor" className="hover:text-primary-600">Sensors</Link></li>
              <li><Link href="/search" className="hover:text-primary-600">Advanced search</Link></li>
              <li><Link href="/product-finder" className="hover:text-primary-600">Product Finder</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 text-sm mb-3">Parts by Manufacturer</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/brands" className="hover:text-primary-600">All manufacturers</Link></li>
              <li><Link href="/search?q=Siemens" className="hover:text-primary-600">Siemens</Link></li>
              <li><Link href="/search?q=ABB" className="hover:text-primary-600">ABB</Link></li>
              <li><Link href="/search?q=Omron" className="hover:text-primary-600">Omron</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 text-sm mb-3">Services</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/rfq" className="hover:text-primary-600 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Request quote</Link></li>
              <li><Link href="/rfq/instant" className="hover:text-primary-600">Instant RFQ</Link></li>
              <li><Link href="/rfq/dashboard" className="hover:text-primary-600">Track RFQs</Link></li>
              <li><Link href="/bom-analyzer" className="hover:text-primary-600">BOM Analyzer</Link></li>
              <li><Link href="/tools" className="hover:text-primary-600">Engineering Tools</Link></li>
              <li><Link href="/en/news" className="hover:text-primary-600">Industrial News</Link></li>
              <li><Link href="/panel-builder" className="hover:text-primary-600">Panel Builder</Link></li>
              <li><Link href="/ai-assistant" className="hover:text-primary-600">AI Assistant</Link></li>
              <li><Link href="/knowledge" className="hover:text-primary-600">Knowledge Hub</Link></li>
              <li><Link href="/suppliers" className="hover:text-primary-600">Suppliers</Link></li>
              <li><a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-primary-600 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Advanced Systems. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/sitemap.xml" className="hover:text-primary-600">Sitemap</Link>
            <Link href="/rfq" className="hover:text-primary-600">RFQ</Link>
          </div>
        </div>
      </Container>
    </footer>
  )
}

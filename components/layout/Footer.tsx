import Link from 'next/link'
import { Zap, Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-24">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 text-xl">
                Advanced<span className="text-primary-600">Systems</span>
              </span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed max-w-sm">
              Professional industrial automation marketplace. Sourcing PLCs, drives, sensors,
              and automation components from 500+ manufacturers worldwide.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm mb-4">Catalog</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/products" className="hover:text-primary-600 transition-colors">All Products</Link></li>
              <li><Link href="/brands" className="hover:text-primary-600 transition-colors">Brands</Link></li>
              <li><Link href="/categories" className="hover:text-primary-600 transition-colors">Categories</Link></li>
              <li><Link href="/search" className="hover:text-primary-600 transition-colors">Advanced Search</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/rfq" className="hover:text-primary-600 transition-colors">Request a Quote</Link></li>
              <li><Link href="/suppliers" className="hover:text-primary-600 transition-colors">Suppliers</Link></li>
              <li><a href="mailto:info@advancedsystems-int.com" className="hover:text-primary-600 transition-colors inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Contact Us</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Advanced Systems International. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/sitemap.xml" className="hover:text-primary-600 transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

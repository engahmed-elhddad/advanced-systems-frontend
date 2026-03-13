import Link from "next/link";
import { Zap, Mail, Globe, Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-industrial-950 border-t border-industrial-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Zap size={16} className="text-white" />
              </div>
              <span className="font-bold text-lg">Advanced<span className="text-primary-400">Systems</span></span>
            </div>
            <p className="text-industrial-400 text-sm leading-relaxed">
              Industrial automation marketplace. Sourcing PLCs, drives, sensors, and automation components worldwide.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Products</h3>
            <ul className="space-y-2 text-sm text-industrial-400">
              {["PLCs", "Drives & Inverters", "Sensors", "HMI Panels", "Safety Systems"].map((item) => (
                <li key={item}><Link href="/products" className="hover:text-primary-400 transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Services</h3>
            <ul className="space-y-2 text-sm text-industrial-400">
              {[
                { label: "Request a Quote", href: "/rfq" },
                { label: "Product Search", href: "/search" },
                { label: "Brands", href: "/brands" },
                { label: "Categories", href: "/categories" },
              ].map((item) => (
                <li key={item.href}><Link href={item.href} className="hover:text-primary-400 transition-colors">{item.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-industrial-400">
              <li className="flex items-center gap-2"><Mail size={14} className="text-primary-400" /> info@advanced-systems.com</li>
              <li className="flex items-center gap-2"><Globe size={14} className="text-primary-400" /> Worldwide Sourcing</li>
              <li className="flex items-center gap-2"><Shield size={14} className="text-primary-400" /> Genuine Parts Guaranteed</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-industrial-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-industrial-500 text-sm">© 2024 Advanced Systems. All rights reserved.</p>
          <div className="flex gap-4 text-sm text-industrial-500">
            <Link href="/sitemap.xml" className="hover:text-industrial-300 transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

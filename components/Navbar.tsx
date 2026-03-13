"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"

/* ─── Data ─────────────────────────────────────────────── */

const productCategories = [
  { label: "PLC",           href: "/products?category=plc" },
  { label: "Drives",        href: "/products?category=drives" },
  { label: "HMI",           href: "/products?category=hmi" },
  { label: "Sensors",       href: "/products?category=sensors" },
  { label: "Power Supply",  href: "/products?category=power-supply" },
  { label: "Safety Relay",  href: "/products?category=safety-relay" },
  { label: "Soft Starters", href: "/products?category=soft-starters" },
  { label: "Servo",         href: "/products?category=servo" },
]

const brandLinks = [
  { label: "Siemens",            href: "/brand/siemens" },
  { label: "Schneider Electric", href: "/brand/schneider" },
  { label: "ABB",                href: "/brand/abb" },
  { label: "Omron",              href: "/brand/omron" },
  { label: "Mitsubishi",         href: "/brand/mitsubishi" },
  { label: "SICK",               href: "/brand/sick" },
  { label: "IFM",                href: "/brand/ifm" },
  { label: "Pilz",               href: "/brand/pilz" },
  { label: "Balluff",            href: "/brand/balluff" },
  { label: "Delta",              href: "/brand/delta" },
]

/* ─── Icons ────────────────────────────────────────────── */

function CircuitIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`text-green-600 shrink-0`}
    >
      <rect x="7" y="7" width="10" height="10" rx="1" />
      <line x1="12" y1="2" x2="12" y2="7" />
      <line x1="12" y1="17" x2="12" y2="22" />
      <line x1="2" y1="12" x2="7" y2="12" />
      <line x1="17" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="4.93" x2="7" y2="7" />
      <line x1="17" y1="17" x2="19.07" y2="19.07" />
      <line x1="4.93" y1="19.07" x2="7" y2="17" />
      <line x1="17" y1="7" x2="19.07" y2="4.93" />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function ChevronDown({ open }: { open?: boolean }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`opacity-60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

/* ─── Navbar component ─────────────────────────────────── */

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false)
  const [mobileBrandsOpen, setMobileBrandsOpen] = useState(false)
  const [productsOpen, setProductsOpen] = useState(false)
  const [brandsOpen, setBrandsOpen] = useState(false)
  const productsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const brandsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openProducts = () => {
    if (productsTimer.current) clearTimeout(productsTimer.current)
    setProductsOpen(true)
  }
  const closeProducts = () => {
    productsTimer.current = setTimeout(() => setProductsOpen(false), 200)
  }
  const openBrands = () => {
    if (brandsTimer.current) clearTimeout(brandsTimer.current)
    setBrandsOpen(true)
  }
  const closeBrands = () => {
    brandsTimer.current = setTimeout(() => setBrandsOpen(false), 200)
  }

  // Clean up timers on unmount to prevent state updates after unmount
  useEffect(() => {
    return () => {
      if (productsTimer.current) clearTimeout(productsTimer.current)
      if (brandsTimer.current) clearTimeout(brandsTimer.current)
    }
  }, [])

  const closeMobile = () => {
    setMobileOpen(false)
    setMobileProductsOpen(false)
    setMobileBrandsOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      {/* Green accent line */}
      <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-80" />

      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        {/* ── Desktop bar ── */}
        <div className="flex items-center gap-4 h-16">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 text-gray-900 hover:text-green-600 transition-colors duration-200 group"
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
          >
            <CircuitIcon />
            <span className="text-lg font-bold tracking-tight leading-none">
              Advanced
              <span className="text-green-600 group-hover:text-green-700 transition-colors duration-200">
                Systems
              </span>
            </span>
          </Link>

          {/* Search bar — centre */}
          <form
            method="GET"
            action="/products"
            className="hidden md:flex flex-1 max-w-xl mx-auto"
          >
            <div className="relative w-full group">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-green-600 transition-colors duration-200" />
              <input
                type="search"
                name="q"
                placeholder="Search part numbers, models…"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-full bg-gray-100 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200 hover:border-gray-300"
              />
            </div>
          </form>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1 ml-auto shrink-0">

            {/* Home */}
            <Link
              href="/"
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-150"
            >
              Home
            </Link>

            {/* Products dropdown */}
            <div
              className="relative"
              onMouseEnter={openProducts}
              onMouseLeave={closeProducts}
            >
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-150"
              >
                Products
                <ChevronDown open={productsOpen} />
              </button>
              {productsOpen && (
                <div
                  className="absolute top-full left-0 pt-1.5 w-52 z-50"
                  onMouseEnter={openProducts}
                  onMouseLeave={closeProducts}
                >
                  <div className="animate-slide-down bg-white border border-gray-200 rounded-xl shadow-lg p-1.5 transition-all duration-200 ease-out">
                    {productCategories.map((cat) => (
                      <Link
                        key={cat.href}
                        href={cat.href}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 opacity-70 shrink-0" />
                        {cat.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Brands dropdown */}
            <div
              className="relative"
              onMouseEnter={openBrands}
              onMouseLeave={closeBrands}
            >
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-150"
              >
                Brands
                <ChevronDown open={brandsOpen} />
              </button>
              {brandsOpen && (
                <div
                  className="absolute top-full left-0 pt-1.5 w-52 z-50"
                  onMouseEnter={openBrands}
                  onMouseLeave={closeBrands}
                >
                  <div className="animate-slide-down bg-white border border-gray-200 rounded-xl shadow-lg p-1.5 transition-all duration-200 ease-out">
                    {brandLinks.map((brand) => (
                      <Link
                        key={brand.href}
                        href={brand.href}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 opacity-70 shrink-0" />
                        {brand.label}
                      </Link>
                    ))}
                    <div className="border-t border-gray-100 my-1" />
                    <Link
                      href="/brands"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-green-700 hover:bg-green-50 transition-colors duration-150"
                    >
                      View All Brands →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Suppliers */}
            <Link
              href="/suppliers"
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-150"
            >
              Suppliers
            </Link>

            {/* Contact */}
            <Link
              href="/contact"
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-150"
            >
              Contact
            </Link>

            {/* Request Quote CTA */}
            <Link
              href="/rfq"
              className="ml-2 btn-primary text-xs py-2 px-4"
            >
              Request Quote
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden ml-auto flex flex-col justify-center gap-[5px] w-9 h-9 cursor-pointer rounded-lg hover:bg-gray-100 transition-colors duration-150 p-2"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {/* Animated hamburger → X */}
            <span
              className={`block w-full h-[2px] rounded bg-gray-600 transition-transform duration-300 origin-center ${
                mobileOpen ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`block w-full h-[2px] rounded bg-gray-600 transition-opacity duration-300 ${
                mobileOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-full h-[2px] rounded bg-gray-600 transition-transform duration-300 origin-center ${
                mobileOpen ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>

        {/* ── Mobile menu panel ── */}
        <div
          id="mobile-menu"
          className={`md:hidden flex-col gap-1 pb-4 border-t border-gray-200 pt-3 transition-all duration-200 overflow-hidden ${
            mobileOpen ? "flex" : "hidden"
          }`}
        >
          {/* Mobile search */}
          <form method="GET" action="/products" className="mb-3">
            <div className="relative">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                name="q"
                placeholder="Search part numbers, models…"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-full bg-gray-100 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
              />
            </div>
          </form>

          <Link
            href="/"
            onClick={closeMobile}
            className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150"
          >
            Home
          </Link>

          {/* Mobile Products collapsible */}
          <div>
            <button
              type="button"
              onClick={() => setMobileProductsOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150"
            >
              Products
              <ChevronDown open={mobileProductsOpen} />
            </button>
            {mobileProductsOpen && (
              <div className="ml-3 mt-0.5 border-l border-gray-200 pl-3 flex flex-col gap-0.5">
                {productCategories.map((cat) => (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    onClick={closeMobile}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 opacity-70 shrink-0" />
                    {cat.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Brands collapsible */}
          <div>
            <button
              type="button"
              onClick={() => setMobileBrandsOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150"
            >
              Brands
              <ChevronDown open={mobileBrandsOpen} />
            </button>
            {mobileBrandsOpen && (
              <div className="ml-3 mt-0.5 border-l border-gray-200 pl-3 flex flex-col gap-0.5">
                {brandLinks.map((brand) => (
                  <Link
                    key={brand.href}
                    href={brand.href}
                    onClick={closeMobile}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 opacity-70 shrink-0" />
                    {brand.label}
                  </Link>
                ))}
                <Link
                  href="/brands"
                  onClick={closeMobile}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium text-green-700 hover:bg-green-50 transition-colors duration-150"
                >
                  View All Brands →
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/suppliers"
            onClick={closeMobile}
            className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150"
          >
            Suppliers
          </Link>

          <Link
            href="/contact"
            onClick={closeMobile}
            className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150"
          >
            Contact
          </Link>

          <Link
            href="/rfq"
            onClick={closeMobile}
            className="mt-2 btn-primary justify-center text-sm"
          >
            Request Quote
          </Link>
        </div>
      </nav>
    </header>
  )
}

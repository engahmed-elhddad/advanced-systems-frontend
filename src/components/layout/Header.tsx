"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Menu, X, ChevronDown, Zap, Phone } from "lucide-react";
import { searchApi } from "@/lib/api";
import type { SearchResult } from "@/types";

export function Header() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await searchApi.autocomplete(query);
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
    }, 300);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
    }
  };

  const navLinks = [
    { label: "Products", href: "/products" },
    { label: "Brands", href: "/brands" },
    { label: "Categories", href: "/categories" },
    { label: "RFQ", href: "/rfq" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-industrial-950/95 backdrop-blur border-b border-industrial-800">
      {/* Top bar */}
      <div className="bg-primary-900 py-1.5 px-4 text-center text-xs text-primary-200">
        <span className="flex items-center justify-center gap-2">
          <Phone size={12} />
          Industrial Automation Parts — Worldwide Sourcing
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg hidden sm:block">
            Advanced<span className="text-primary-400">Systems</span>
          </span>
        </Link>

        {/* Search */}
        <div className="flex-1 relative">
          <form onSubmit={handleSearch} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Search by part number, brand, or description..."
              className="w-full bg-industrial-800 border border-industrial-600 rounded-xl pl-4 pr-12 py-2.5 text-sm text-white placeholder-industrial-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-industrial-400 hover:text-primary-400 transition-colors">
              <Search size={18} />
            </button>
          </form>

          {/* Autocomplete */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-industrial-900 border border-industrial-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
              {suggestions.map((s) => (
                <Link
                  key={s.id}
                  href={`/products/${s.slug}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-industrial-800 transition-colors"
                  onClick={() => setShowSuggestions(false)}
                >
                  {s.primary_image && (
                    <img src={s.primary_image} alt={s.name} className="w-8 h-8 object-cover rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-primary-400 truncate">{s.part_number}</p>
                    <p className="text-xs text-industrial-400 truncate">{s.name}</p>
                  </div>
                  {s.brand_name && (
                    <span className="text-xs text-industrial-500 shrink-0">{s.brand_name}</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="px-3 py-2 text-sm font-medium text-industrial-300 hover:text-white hover:bg-industrial-800 rounded-lg transition-all">
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Mobile menu */}
        <button className="lg:hidden p-2 text-industrial-400 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="lg:hidden bg-industrial-900 border-t border-industrial-800 px-4 py-2 animate-fade-in">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="block py-3 text-industrial-300 hover:text-white border-b border-industrial-800 last:border-0" onClick={() => setMenuOpen(false)}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

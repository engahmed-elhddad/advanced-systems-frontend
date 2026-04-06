"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Zap, MessageCircle } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { searchProductsSimple } from "@/lib/api";
import { track } from "@/lib/analytics";
import { useUIStore } from "@/state/uiStore";
import { SafeImage } from "@/components/common/SafeImage";

type SearchItem = {
  part_number: string;
  name?: string;
  brand_name?: string;
  brand?: string | { name?: string };
  image_url?: string;
};

function normalizeResults(payload: unknown): SearchItem[] {
  if (payload === null || typeof payload !== "object") return [];
  const o = payload as Record<string, unknown>;
  const raw = o.results ?? o.items ?? o.products ?? o.hits ?? [];
  if (!Array.isArray(raw)) return [];
  return raw.filter((item) => {
    if (typeof item !== "object" || item === null) return false;
    return typeof (item as Record<string, unknown>).part_number === "string";
  }) as SearchItem[];
}

function normalizePartNumber(value: string): string {
  return value.trim();
}

function toBrandName(item: SearchItem): string {
  if (typeof item.brand_name === "string" && item.brand_name.trim()) return item.brand_name;
  if (typeof item.brand === "string" && item.brand.trim()) return item.brand;
  if (item.brand && typeof item.brand === "object" && item.brand.name) return item.brand.name;
  return "-";
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = useMemo(() => searchParams?.get("q") ?? "", [searchParams]);
  const openRFQModal = useUIStore((s) => s.openRFQModal);

  const [query, setQuery] = useState(initialQ);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [retryTick, setRetryTick] = useState(0);
  const [similarItems, setSimilarItems] = useState<SearchItem[]>([]);
  const lastTrackedQuery = useRef<string | null>(null);
  const lastFetchedQuery = useRef<string | null>(null);
  const currentUrlQuery = useMemo(() => (searchParams?.get("q") ?? "").trim(), [searchParams]);

  useEffect(() => {
    setQuery(initialQ);
  }, [initialQ]);

  useEffect(() => {
    const trimmed = query.trim();
    const handle = window.setTimeout(async () => {
      if (trimmed !== currentUrlQuery) {
        const params = new URLSearchParams(searchParams?.toString() ?? "");
        if (trimmed) params.set("q", trimmed);
        else params.delete("q");
        router.replace(`/search${params.toString() ? `?${params.toString()}` : ""}`);
      }

      if (!trimmed) {
        setResults([]);
        setError(null);
        setLoading(false);
        lastTrackedQuery.current = null;
        lastFetchedQuery.current = null;
        return;
      }
      if (trimmed === lastFetchedQuery.current) return;

      setLoading(true);
      setError(null);
      try {
        if (trimmed !== lastTrackedQuery.current) {
          track("search", { query: trimmed });
          lastTrackedQuery.current = trimmed;
        }
        const v1Data = await searchProductsSimple(trimmed, 24, 1);
        lastFetchedQuery.current = trimmed;
        const normalized = normalizeResults(v1Data);
        setResults(normalized);

        if (normalized.length === 0 && trimmed.length >= 4) {
          const prefix = trimmed.slice(0, Math.min(trimmed.length - 2, 8));
          try {
            const prefixData = await searchProductsSimple(prefix, 4, 1);
            setSimilarItems(normalizeResults(prefixData));
          } catch {
            setSimilarItems([]);
          }
        } else {
          setSimilarItems([]);
        }
      } catch {
        setError("Something went wrong");
        setResults([]);
        setSimilarItems([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(handle);
  }, [query, router, searchParams, currentUrlQuery, retryTick]);

  return (
    <div className="page-container py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Search Parts</h1>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by part number or name"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-red-700">
          <p>{error}</p>
          <button
            type="button"
            className="mt-3 inline-flex rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            onClick={() => setRetryTick((n) => n + 1)}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && query.trim() && results.length === 0 && (
        <div className="animate-fadeIn">
          <div className="rounded-[2px] border border-[#E5E7EB] bg-white p-8 text-center">
            <div className="max-w-md mx-auto">
              <p className="font-mono text-lg font-bold text-[#0072CE] tracking-tight">{query.trim()}</p>
              <h3 className="text-xl font-semibold text-[#1A1A1A] mt-3">
                We don&apos;t list this part yet
              </h3>
              <p className="text-sm text-[#6B7280] mt-1.5 leading-relaxed">
                But we can source it for you. Get pricing within 2 hours — no commitment required.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => openRFQModal(query.trim())}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[2px] bg-[#0072CE] hover:bg-[#005BA4] text-white font-semibold text-sm shadow-sm transition-colors duration-150"
                >
                  <Zap className="w-4 h-4" />
                  Get Price in 2 Hours
                </button>
                <a
                  href={`https://wa.me/201000629229?text=${encodeURIComponent(`I need pricing for ${query.trim()}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[2px] border border-[#E5E7EB] text-[#1A1A1A] font-medium text-sm hover:bg-[#F9FAFB] transition-colors duration-150"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  Message on WhatsApp
                </a>
              </div>

              <div className="flex items-center justify-center gap-3 mt-4 text-xs text-[#6B7280]">
                <Link href="/categories" className="hover:text-[#0072CE] transition-colors duration-150">Browse Categories</Link>
                <span>·</span>
                <Link href="/brands" className="hover:text-[#0072CE] transition-colors duration-150">Browse Brands</Link>
              </div>
            </div>
          </div>

          {similarItems.length > 0 && (
            <div className="mt-8 animate-fadeIn" style={{ animationDelay: "100ms" }}>
              <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">Similar parts you may consider</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {similarItems.map((item) => (
                  <Link
                    key={item.part_number}
                    href={`/products/${encodeURIComponent(normalizePartNumber(item.part_number))}`}
                    className="group rounded-[2px] border border-[#E5E7EB] bg-white p-4 transition-all duration-150 hover:border-[#0072CE]/40 hover:shadow-sm hover:-translate-y-px"
                  >
                    <SafeImage
                      src={item.image_url}
                      alt={item.part_number}
                      className="mb-3 h-28 w-full rounded-[2px] object-contain bg-[#F9FAFB]"
                    />
                    <p className="font-mono text-sm font-semibold text-[#1A1A1A] group-hover:text-[#0072CE] transition-colors duration-150">{item.part_number}</p>
                    <p className="mt-0.5 text-xs text-[#6B7280]">{toBrandName(item)}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((item) => (
            <Link
              key={item.part_number}
              href={`/products/${encodeURIComponent(normalizePartNumber(item.part_number))}`}
              className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-primary-300 hover:shadow-sm"
            >
              <SafeImage
                src={item.image_url}
                alt={item.part_number}
                className="mb-3 h-36 w-full rounded-md object-contain bg-gray-50"
              />
              <p className="font-mono text-sm font-semibold text-gray-900">{item.part_number}</p>
              <p className="mt-1 text-sm text-gray-800">{item.name || "N/A"}</p>
              <p className="mt-1 text-xs text-gray-500">{toBrandName(item)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="page-container py-12 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}

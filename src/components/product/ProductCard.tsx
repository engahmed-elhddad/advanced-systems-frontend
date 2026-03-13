"use client";
import Link from "next/link";
import { ShoppingCart, FileText } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import type { Product } from "@/types";
import clsx from "clsx";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function imageUrl(url?: string) {
  if (!url) return "/placeholder-product.png";
  return url.startsWith("http") ? url : `${BACKEND}${url}`;
}

function AvailabilityBadge({ status }: { status: string }) {
  return (
    <span className={clsx(
      "text-xs font-semibold px-2 py-0.5 rounded-full border",
      status === "available" && "bg-green-900/50 text-green-400 border-green-700",
      status === "limited" && "bg-yellow-900/50 text-yellow-400 border-yellow-700",
      status === "unavailable" && "bg-red-900/50 text-red-400 border-red-700",
    )}>
      {status === "available" ? "In Stock" : status === "limited" ? "Limited" : "Out of Stock"}
    </span>
  );
}

interface Props {
  product: Product;
  onRFQ?: (product: Product) => void;
}

export function ProductCard({ product, onRFQ }: Props) {
  const { format } = useCurrency();
  const primaryImage = product.images?.find((i) => i.is_primary) || product.images?.[0];

  return (
    <div className="card group hover:border-primary-700 hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="relative block overflow-hidden bg-industrial-800 aspect-square">
        <img
          src={imageUrl(primaryImage?.url)}
          alt={primaryImage?.alt_text || product.name}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {product.is_featured && (
          <span className="absolute top-2 left-2 bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            Featured
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        {/* Brand & Category */}
        <div className="flex items-center justify-between gap-2">
          {product.brand && (
            <Link href={`/brands/${product.brand.slug}`} className="text-primary-400 text-xs font-semibold hover:text-primary-300 uppercase tracking-wide">
              {product.brand.name}
            </Link>
          )}
          <AvailabilityBadge status={product.availability} />
        </div>

        {/* Part Number */}
        <p className="font-mono text-xs text-industrial-400">{product.part_number}</p>

        {/* Name */}
        <Link href={`/products/${product.slug}`} className="text-sm font-semibold text-white hover:text-primary-400 transition-colors line-clamp-2 flex-1">
          {product.name}
        </Link>

        {/* Price */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-industrial-800">
          <div>
            {product.price_usd ? (
              <span className="text-lg font-bold text-white">{format(product.price_usd)}</span>
            ) : (
              <span className="text-sm text-industrial-400 italic">Contact for price</span>
            )}
          </div>
          <button
            onClick={() => onRFQ?.(product)}
            className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
          >
            <FileText size={12} />
            RFQ
          </button>
        </div>
      </div>
    </div>
  );
}

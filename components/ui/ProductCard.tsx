"use client"

import React from "react";
import Link from "next/link";
import { rfqMailtoHref } from "@/app/lib/constants";
import { MailIcon } from "@/components/ui/MailIcon";
import { BrandLogo } from "@/components/ui/BrandLogo";

export type ProductCardProps = {
  partNumber: string;
  brand?: string;
  description?: string;
  imageUrl: string;
  inStock?: boolean;
};

function stockBadge(inStock: boolean | undefined): { className: string; label: string } {
  if (inStock === true) return { className: "bg-emerald-500/15 text-emerald-400", label: "In Stock" };
  if (inStock === false) return { className: "bg-slate-500/15 text-slate-400", label: "Out of Stock" };
  return { className: "bg-amber-500/15 text-amber-400", label: "On Request" };
}

export const ProductCard: React.FC<ProductCardProps> = ({
  partNumber,
  brand,
  description,
  imageUrl,
  inStock,
}) => {
  const rfqHref = rfqMailtoHref(partNumber);
  const { className: badgeClass, label: badgeLabel } = stockBadge(inStock);

  return (
    <div className="card-hover group flex flex-col rounded-xl border border-[#1e2d4f] bg-[#131d35] overflow-hidden h-full transition-all duration-300 hover:-translate-y-1.5 hover:border-sky-500/50 hover:shadow-xl hover:shadow-sky-500/10">
      {/* ── Product image ── */}
      <Link href={`/product/${partNumber}`} className="block relative">
        <div className="aspect-square flex items-center justify-center p-4 bg-[#0f1629] border-b border-[#1e2d4f] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={partNumber}
            loading="lazy"
            className="max-h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "/products/no-product-image.jpg";
            }}
          />
        </div>
        {/* Quick View overlay */}
        <div className="absolute inset-0 bg-[#0a0f1a]/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-white text-xs font-semibold tracking-wider uppercase bg-sky-500/90 px-4 py-2 rounded-lg">
            Quick View
          </span>
        </div>
      </Link>

      <div className="flex-1 flex flex-col p-4">
        <div className="flex items-center justify-between mb-1.5">
          {brand ? (
            <BrandLogo brand={brand} />
          ) : (
            <span />
          )}
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badgeClass}`}>
            {badgeLabel}
          </span>
        </div>
        <Link
          href={`/product/${partNumber}`}
          className="text-sky-300 font-bold text-sm hover:text-sky-200 transition truncate"
          title={partNumber}
        >
          {partNumber}
        </Link>

        {/* Description */}
        {description && (
          <p className="text-slate-400 text-xs line-clamp-2 leading-snug flex-1">
            {description}
          </p>
        )}

        {/* RFQ button */}
        <a
          href={rfqHref}
          className="mt-auto inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white text-xs font-semibold transition-all duration-200 hover:shadow-md hover:shadow-sky-500/30"
          onClick={(e) => e.stopPropagation()}
        >
          <MailIcon />
          Request Quote
        </a>
      </div>
    </div>
  );
};

export default ProductCard;

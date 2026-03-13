"use client";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/types";
import { useState } from "react";
import { RFQModal } from "@/components/rfq/RFQModal";

interface Props {
  products: Product[];
  loading?: boolean;
}

export function ProductGrid({ products, loading }: Props) {
  const [rfqProduct, setRFQProduct] = useState<Product | null>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="aspect-square bg-industrial-800" />
            <div className="p-4 space-y-3">
              <div className="h-3 bg-industrial-800 rounded w-1/2" />
              <div className="h-4 bg-industrial-800 rounded" />
              <div className="h-4 bg-industrial-800 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onRFQ={setRFQProduct} />
        ))}
      </div>
      {rfqProduct && (
        <RFQModal product={rfqProduct} onClose={() => setRFQProduct(null)} />
      )}
    </>
  );
}

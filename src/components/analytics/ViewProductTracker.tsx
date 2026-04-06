"use client";

import { useEffect, useRef } from "react";
import { trackProductView } from "@/lib/analytics";

export function ViewProductTracker({ partNumber }: { partNumber: string }) {
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    const normalized = (partNumber || "").trim();
    if (!normalized) return;
    if (trackedRef.current === normalized) return;
    trackProductView(normalized);
    trackedRef.current = normalized;
  }, [partNumber]);

  return null;
}

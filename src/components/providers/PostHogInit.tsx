"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export function PostHogInit() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).POSTHOG_INITIALIZED) return;

    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    if (!key || !host) return;

    posthog.init(key, { api_host: host });
    (window as any).posthog = posthog;
    (window as any).POSTHOG_INITIALIZED = true;
  }, []);

  return null;
}

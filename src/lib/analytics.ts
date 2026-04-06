const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000";
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "";
const GOOGLE_ADS_LEAD_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL || "";
const GOOGLE_ADS_WHATSAPP_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_LABEL || "";

type BackendEventType = "visit" | "product_view" | "quote_click" | "whatsapp_click";
type QueuedEvent = { type: BackendEventType; part_number?: string };

const EVENT_ENDPOINT = `${API_BASE}/api/v1/analytics/event`;
const EVENT_BATCH_SIZE = 10;
const EVENT_FLUSH_MS = 2000;

let queue: QueuedEvent[] = [];
let flushTimer: number | null = null;

function sendEventToBackend(event: QueuedEvent) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify(event);
  const asBlob = new Blob([payload], { type: "application/json" });
  if (navigator.sendBeacon) {
    navigator.sendBeacon(EVENT_ENDPOINT, asBlob);
    return;
  }
  fetch(EVENT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}

function flushQueue() {
  const pending = queue.splice(0, EVENT_BATCH_SIZE);
  if (!pending.length) return;
  for (const event of pending) sendEventToBackend(event);
  if (queue.length) scheduleFlush();
}

function scheduleFlush() {
  if (typeof window === "undefined") return;
  if (flushTimer != null) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    flushQueue();
  }, EVENT_FLUSH_MS);
}

function queueBackendEvent(type: BackendEventType, partNumber?: string) {
  if (typeof window === "undefined") return;
  queue.push({ type, ...(partNumber ? { part_number: partNumber } : {}) });
  if (queue.length >= EVENT_BATCH_SIZE) {
    flushQueue();
    return;
  }
  scheduleFlush();
}

function getUtmContext() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const payload: Record<string, string> = {};
  for (const key of keys) {
    const value = params.get(key);
    if (value) payload[key] = value;
  }
  return payload;
}

export function track(event: string, data?: Record<string, any>) {
  if (typeof window === "undefined") return;
  const payload = { ...getUtmContext(), ...(data || {}) };
  const posthog = (window as any).posthog;
  if (posthog && typeof posthog.capture === "function") {
    posthog.capture(event, payload);
  }

  const gtag = (window as any).gtag;
  if (typeof gtag === "function") {
    gtag("event", event, payload);
  }

  const fbq = (window as any).fbq;
  if (typeof fbq === "function") {
    fbq("trackCustom", event, payload);
  }
}

export function trackLead(data?: Record<string, any>) {
  track("lead", data);
  queueBackendEvent("quote_click", data?.part_number);
  if (typeof window === "undefined") return;
  const payload = { ...getUtmContext(), ...(data || {}) };
  const gtag = (window as any).gtag;
  if (typeof gtag === "function") {
    gtag("event", "generate_lead", payload);
    if (GOOGLE_ADS_ID && GOOGLE_ADS_LEAD_LABEL) {
      gtag("event", "conversion", {
        ...payload,
        send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_LEAD_LABEL}`,
      });
    }
  }
  const fbq = (window as any).fbq;
  if (typeof fbq === "function") fbq("track", "Lead", payload);
}

export function trackWhatsApp(data?: Record<string, any>) {
  track("whatsapp_click", data);
  queueBackendEvent("whatsapp_click", data?.part_number);
  if (typeof window === "undefined") return;
  const payload = { ...getUtmContext(), ...(data || {}) };
  const gtag = (window as any).gtag;
  if (typeof gtag === "function") {
    gtag("event", "whatsapp_click", payload);
    if (GOOGLE_ADS_ID && GOOGLE_ADS_WHATSAPP_LABEL) {
      gtag("event", "conversion", {
        ...payload,
        send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_WHATSAPP_LABEL}`,
      });
    }
  }
  const fbq = (window as any).fbq;
  if (typeof fbq === "function") fbq("track", "Contact", payload);
}

export function trackVisit() {
  track("visit");
  queueBackendEvent("visit");
}

export function trackProductView(partNumber: string) {
  if (typeof window === "undefined") return;
  const normalized = (partNumber || "").trim();
  if (!normalized) return;
  const payload = { ...getUtmContext(), part_number: normalized };
  track("product_view", payload);
  const gtag = (window as any).gtag;
  if (typeof gtag === "function") {
    gtag("event", "view_item", {
      ...payload,
      items: [{ item_id: normalized }],
    });
  }
  const fbq = (window as any).fbq;
  if (typeof fbq === "function") {
    fbq("track", "ViewContent", {
      ...payload,
      content_ids: [normalized],
      content_type: "product",
    });
  }
  queueBackendEvent("product_view", normalized);
}

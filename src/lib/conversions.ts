/**
 * Named conversion events for GTM / dataLayer / internal docs.
 * Actual firing lives in `@/lib/analytics` (gtag, PostHog, Meta, first-party API).
 */
export const ConversionEvents = {
  RFQ_SUBMIT: "rfq_submit",
  RFQ_CTA_CLICK: "rfq_cta_click",
  LEAD_INTENT: "lead",
  WHATSAPP_CLICK: "whatsapp_click",
  PRODUCT_VIEW: "product_view",
  PAGE_VIEW: "page_view",
  SEARCH: "search",
  VISIT: "visit",
  CATEGORY_VIEW: "category_view",
  ADD_TO_RFQ: "add_to_rfq",
  CLICK_PRODUCT: "click_product",
} as const

export type ConversionEventName = (typeof ConversionEvents)[keyof typeof ConversionEvents]

export {
  track,
  trackEvent,
  trackRfqSubmit,
  trackRfqCtaClick,
  trackLead,
  trackWhatsApp,
  trackProductView,
  trackCategoryView,
  trackAddToRfq,
  trackClickProduct,
  trackVisit,
  trackPageView,
  trackSearch,
} from "@/lib/analytics";

export type {
  RfqSubmitTrackPayload,
  RfqCtaTrackPayload,
  TrackingEventName,
  ProductViewPayload,
  CategoryViewPayload,
  AddToRfqPayload,
  ClickProductPayload,
} from "@/lib/analytics";

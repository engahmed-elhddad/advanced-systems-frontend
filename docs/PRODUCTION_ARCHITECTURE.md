# Production Architecture – Industrial Automation Marketplace MVP

**Stack:** Next.js (App Router), TypeScript, TailwindCSS, TanStack Query | FastAPI, PostgreSQL, MeiliSearch | Cloudflare R2

---

## 1. Search System

- **Frontend:** `SearchBar` debounces and calls `GET /search/suggest`; on submit navigates to `/search?q=...`. Search page reads `q`, filters (category, brand, series, etc.), calls `GET /search/filter-options` and `GET /search` (or `/api/search`) with filters and pagination. Results rendered via `ProductGrid` + `ProductCard`.
- **Backend:** MeiliSearch for full-text and filters. `GET /search` (main.py + api/search.py), `GET /search/suggest`, `GET /search/filter-options`. Filters: brand, category, series, voltage, current, mounting_type; `ingestion_status = "approved"` applied.

## 2. Product Pages

- **Routes:** Primary: `app/product/[part_number]/page.tsx`. Aliases: `part-number/[partNumber]`, `p/[part_number]`. Data: `getProductByPartNumber` / `getProductOrGenerate` → `GET /product/{part_number}` or v1 `/part/{part_number}/or-generate`.
- **Components:** `ProductDetail` → `ProductHero`, ProductSpecs, ProductDatasheet, CrossReferences, RelatedProducts, RfqForm. Image: resolved via `resolveProductImageUrl`; fallback placeholder.

## 3. Image System

- **Resolver:** `app/lib/constants.ts` → `resolveProductImageUrl(p, api)`. Priority: (1) `p.image_url` or `p.images[0]` (full URL or relative), (2) `{api}/uploads/products/{part_number}.jpg` or `.../image.jpg`, (3) `/images/product-placeholder.png`. R2: backend sets `image_url` from CDN; frontend uses as-is when `http`.
- **Usage:** ProductCard, ProductHero, search results use resolved URL; `onError` switches to placeholder so layout never breaks.

## 4. RFQ Flow

- **Buttons:** `RFQButton` (link to `/rfq?part_number=...`) used on ProductCard, ProductHero, product page.
- **Forms:** Full RFQ: `app/rfq/page.tsx` → `POST /api/v1/rfq`. Instant RFQ: `app/rfq/instant/page.tsx` and inline `RfqForm` → `POST /api/rfq/instant` (part_number, quantity, email, company, message).
- **Backend:** `POST /api/rfq/instant` in main.py; `GET /api/rfq/my?email=`.

## 5. Admin System

- **Frontend:** `app/admin/layout.tsx` protects routes with `localStorage` admin_token; redirect to `/admin/login`. Dashboard, RFQ list, import, image manager, pattern rules, SEO engine, knowledge graph, etc.
- **Backend:** Admin routes under `/admin/*`; `verify_admin` dependency; key endpoints for expand-series, extract-datasheet, filters refresh, etc.

## 6. Homepage & Dynamic Data

- **Sections:** HeroSection, TrustedBrands, TopCategories, FeaturedProducts, RFQBanner. Data must come from APIs: brands/categories from `GET /brands`, `GET /categories` or filter-options; featured from `GET /api/v1/featured` or search.
- **Brands/Categories pages:** Should use `GET /brands`, `GET /categories` (or filter-options); no hardcoded lists only.

## 7. Key File Map

| Area        | Frontend | Backend |
|------------|----------|---------|
| Search      | app/search/page.tsx, components/search/SearchBar.tsx | main.py (/search, /search/suggest, /search/filter-options), api/search.py |
| Product     | app/product/[part_number]/page.tsx, ProductDetail.tsx, ProductHero.tsx, ProductCard.tsx | main.py GET /product/{part_number} |
| Images      | app/lib/constants.ts (resolveProductImageUrl), productMappers.ts | main.py _product_image_url, image_pipeline |
| RFQ         | app/rfq/instant/page.tsx, components/rfq/RfqForm.tsx, RFQButton.tsx | main.py POST /api/rfq/instant |
| Home        | app/page.tsx, components/home/* | GET /brands, /categories, /api/v1/featured, /search |

---

## Production launch checklist (MVP)

- [x] **Images:** Single resolver `resolveProductImageUrl` → image_url → `/uploads/products/{part_number}.jpg` → placeholder. ProductCard, ProductHero, ProductDetail use it; `onError` falls back to placeholder so layout never breaks.
- [x] **Dynamic data:** Home (TrustedBrands, TopCategories, FeaturedProducts) from APIs. Brands page fetches `/brands` first, fallback to static. Categories from `getCategories()`. Products from `getProducts()`.
- [x] **Hero:** Industrial headline, subtext, large SearchBar, Browse Products + Request Quote, quick brands from API. Dark/gray/blue palette (slate-900, gradient, grid).
- [x] **Search:** Filter options from `GET /search/filter-options`. Loading skeleton, empty state with “Did you mean” suggestions from `GET /search/suggest` when no results.
- [x] **Product page:** ProductHero, specs/datasheet/alternatives/related tabs, virtual product via getProductOrGenerate. Metadata (title, description, OG, canonical) and JSON-LD in ProductDetail.
- [x] **RFQ:** RFQButton everywhere; RfqForm (part_number, quantity, company, email, message) → `POST /api/rfq/instant`.
- [x] **Reusable components:** Navbar, Footer, ProductCard, ProductGrid, SearchBar, HeroSection, TrustedBrands, TopCategories, FeaturedProducts, RFQBanner in layout/home/products/search.
- [x] **No debug logs:** Removed console.log from lib/api.ts in production path.
- [ ] **Env:** Set `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CDN_URL` for production. Ensure placeholder exists at `public/images/product-placeholder.png`.

*Document generated for MVP production launch. Do not remove existing APIs; improve structure and stability.*

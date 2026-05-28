# efruze — atelier e-commerce

A Next.js 16 + TypeScript + Prisma e-commerce platform for **efruze**, a Turkish atelier brand selling hand-marbled (ebru) silks, ceramics, paper, glassware, and decorative pieces.

> _Su üstüne çizilen — drawn upon water._

## What ships in M1 + M2

**M1 — storefront skeleton:**

- Editorial **homepage** — parallax ebru video bed, eyebrow hero, marquee ribbon, 6-col collection grid, story/maison split, events list, newsletter card, dark footer with EN·TR locale switcher
- **Product listing** (`/shop`) with category filter chips
- **Product detail** (`/shop/[slug]`) with `<model-viewer>` 3D lazy-load (CDN), gallery fallback, variant selector, add-to-bag
- **Cart drawer** (Radix Sheet) — cookie-bound DB cart, server-state only
- **i18n** (Turkish default, English secondary) via `next-intl` 4 with cookie-based locale
- Pixel-faithful design tokens — Cormorant Garamond + Tenor Sans + DM Sans, cream/ink/firuze/gold palette, 1320px max width

**M8 — launch readiness:**

- **Real client IP for PayTR** — `placeOrderAction` and `retryPayTRTokenAction` read `x-forwarded-for` / `x-real-ip` via `headers()` and plumb it through `OrderService.createFromCart → PaymentService.initiate → PayTRProvider.initiate`. PayTR sees the actual customer IP instead of `127.0.0.1`.
- **Cloudinary asset cleanup on product delete** — `deleteProductAction` collects the product's image `publicId`s + 3D model `publicId` and calls `cloudinary.uploader.destroy` for each (fail-soft, never blocks the soft-delete). `lib/cloudinary.ts` is the typed wrapper around the SDK; no-ops gracefully when env vars are unset.
- **Stock restoration on order cancel** — added `Order.stockRestored Boolean` to the Prisma schema. `OrderService.transitionStatus` now atomically re-increments each `ProductVariant.stock` inside the same transaction that flips status to `CANCELLED`, gated by `stockRestored` so retries are idempotent.
- **Per-product OG image** — `app/(storefront)/shop/[slug]/opengraph-image.tsx` (Node runtime) renders a product-specific 1200×630 card with eyebrow / name / tagline / price. Used as a fallback; the storefront product page's explicit `generateMetadata` prefers the real product image when available so social shares show the actual marbling.
- **A11y** — `:focus-visible` ring (gold) on all interactive elements; skip-to-content link in the root layout; `<main id="main" role="main">` on storefront + admin layouts; `prefers-reduced-motion` honored globally (cuts animation durations to 0.01ms).
- **Strict CSP + security headers** — `next.config.ts` now emits `Content-Security-Policy` allowing only `res.cloudinary.com` images, `ajax.googleapis.com` model-viewer script, `va.vercel-scripts.com` analytics, and `www.paytr.com` iframe. Plus `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy: same-origin`, `Permissions-Policy: ..., interest-cohort=()`. Dev runtime relaxes connect/script for HMR; production stays tight.
- **Production env validation** — `lib/env.ts` now uses `superRefine` to require `DATABASE_URL` (not localhost), `AUTH_SECRET`, and `NEXT_PUBLIC_SITE_URL` when `NODE_ENV=production`. The app refuses to boot with missing or default-localhost values in production.

**M7 — search & discovery:**

- **Storefront search bar** — `NavSearch.tsx` opens a top Sheet with an oversized italic input. On submit navigates to `/shop?q=…` so URLs are shareable. Mobile + desktop use the same Sheet.
- **`ProductService.list` extended** — accepts `q`, `priceMin`, `priceMax`, `inStock`, and `sort` alongside `category` and `page`. Search uses locale-scoped Prisma ILIKE on `ProductTranslation.name` and `description` (case-insensitive). Sort options: `newest` (default), `priceAsc`, `priceDesc`.
- **`ShopFilters.tsx` sidebar** — sticky filter panel on `/shop` with categories (links), price range (min/max inputs), in-stock checkbox, and Apply/Clear actions. All state lives in URL search params so filtered views are bookmarkable. `ShopSort` dropdown sits at the top of the grid.
- **`/shop` redesign** — two-column on lg+ (filters + grid), search-result header shows the query and a "Clear search" link.
- **`safeListProducts`** mirrors the new filter pipeline against `lib/mock-products` so dev-without-DB still surfaces realistic results.
- **`app/sitemap.ts`** — enumerates static paths + every published product + active category with `hreflang` alternates for tr/en; lastModified pulled from `updatedAt`. Fails soft when DB is down.
- **`app/robots.ts`** — allows `/`; disallows `/admin`, `/api`, `/account`, `/checkout`, `/orders`, `/sign-in`, `/sign-up`. Includes sitemap reference.
- **`app/opengraph-image.tsx`** — Edge-runtime `ImageResponse` generates a 1200×630 brand card (cream background, italic Cormorant wordmark, blue tagline, gold "atelier · karaköy" caps) for the default OG image.
- **Vercel Analytics** — `<Analytics />` from `@vercel/analytics/next` mounted in root layout. Lazy-loaded, no PII, page views only.

**M6 — admin polish (uploads + coupons):**

- **Cloudinary signed direct-upload** — `app/api/upload/cloudinary-sign/route.ts` issues admin-gated signatures; `lib/cloudinary-upload.ts` is a typed client helper that POSTs files straight from the browser with progress tracking. No file bytes pass through our server.
- **`CloudinaryImageList.tsx`** — drag-drop zone or file picker for multiple images, inline progress, HTML5 drag-to-reorder, alt-text inline edit, first-is-primary. Persists `secure_url` + `public_id` per image.
- **`CloudinaryGLBUpload.tsx`** — single `.glb`/`.gltf` upload (raw resource type, 25 MB cap), optional USDZ + poster URLs for the model-viewer fallback.
- **Product 3D model integration** — `ProductForm` now has a "3D model" section. Updates persist via `ProductModel3D` with a delete/recreate sync (one model per product in v1).
- **Coupon CRUD** — `/admin/coupons` list + new/edit forms covering code, PERCENT/FIXED type, value, minSubtotal, startsAt/endsAt windows, usageLimit, isActive. `CouponService.validate(code, subtotal)` returns a typed result with discount or reason.
- **Coupon application at checkout** — review step gets a "Discount code" input that calls `applyCouponAction` for eager preview. `OrderService.createFromCart` re-validates atomically inside the same transaction that creates the order, applies the discount, and increments `Coupon.usedCount` — so a `usageLimit: 1` coupon can never be redeemed twice.
- **i18n** — full `checkout.couponErrors.*` namespace (NOT_FOUND/EXPIRED/MIN_SUBTOTAL/etc.) in TR + EN.

To enable Cloudinary uploads locally:
1. Sign up at cloudinary.com — the free tier is plenty for development.
2. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in `.env`.
3. The upload widgets activate automatically; the signing endpoint returns 503 if unconfigured.

**M5 — PayTR online card payments:**

- `PayTRProvider` (`server/payments/paytr.provider.ts`) — real implementation of `PaymentProvider`. `initiate()` POSTs to `https://www.paytr.com/odeme/api/get-token` with HMAC-SHA256 signed body (`merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode + merchant_salt` signed with `merchant_key`). Returns `iframe-token` redirect.
- `verifyWebhook()` recomputes HMAC over `merchant_oid + merchant_salt + status + total_amount` and constant-time compares with `timingSafeEqual`.
- **Env gating** — PayTR option only appears in checkout when all three of `PAYTR_MERCHANT_ID` / `PAYTR_MERCHANT_KEY` / `PAYTR_MERCHANT_SALT` are set (see `enabledPaymentMethods()` / `isPayTREnabled()`). `PAYTR_TEST_MODE` defaults to `"1"` (sandbox) — only flip to `"0"` after sandbox-passing live runs.
- **Checkout routing** — when the customer picks PayTR, `placeOrderAction` redirects to `/checkout/paytr/[reference]` instead of the thanks page. The iframe page reads the token from `Payment.providerPayload`, renders the PayTR iframe full-width, and exposes a "Refresh token" action that re-initiates if the customer leaves the page for too long.
- **Webhook** — `app/api/webhooks/paytr/route.ts` receives form-encoded POSTs, verifies HMAC, idempotently flips Payment → SUCCEEDED + Order → PAID (or FAILED + CANCELLED), fires `OrderConfirmedEmail`, and returns literal text `OK` (PayTR retries for ~24h otherwise). Already-settled payments just acknowledge and skip work.
- **Thanks page** — when the user lands at `/orders/[orderNumber]/thanks` from PayTR and the webhook hasn't arrived yet, the page shows a "Verifying payment…" banner with `<meta http-equiv="refresh" content="3">` until `Payment.status` transitions.
- **PayTR specifics handled**: `merchant_oid` strips dashes from our order number (alphanumeric requirement), `payment_amount` converts to kuruş (×100), `currency` sent as `"TL"` (not `"TRY"`), `user_basket` is base64-encoded JSON array, `lang` follows the user's locale.

To enable PayTR locally:
1. Sign up at paytr.com and grab `merchant_id`, `merchant_key`, `merchant_salt` from the merchant panel.
2. Set the three env vars + leave `PAYTR_TEST_MODE="1"` for sandbox.
3. Configure the merchant panel callback URL to `<your-site>/api/webhooks/paytr`.
4. Restart the dev server. The "Card payment (PayTR)" option appears at checkout step 3.

**M4 — admin panel:**

- `/admin/*` route group gated by session check + role check (`ADMIN` or `SUPER_ADMIN`) at the layout level — anonymous users get 307 → `/sign-in?callbackUrl=/admin`, non-admin users get 307 → `/account`.
- **Dashboard** — orders today, revenue today, awaiting-payment count, low-stock variants, recent 5 orders.
- **Product CRUD** — list with stock + status, create/edit form with TR/EN translation tabs, variant inline editor (SKU, stock, price override, default selector), image URL list with primary-flag, edition/featured/published toggles, SEO fields. Soft-deletes on remove.
- **Category CRUD** — list with parent/child + product counts, create/edit form with TR/EN translations.
- **Order management** — list with status filter chips, detail page with items + addresses + customer note + admin action panel (confirm bank transfer / mark processing / ship with tracking + email / mark delivered / cancel) + admin note field.
- **Bank transfers queue** — `/admin/bank-transfers` filters to `AWAITING_PAYMENT` orders for quick triage.
- **Bank accounts CRUD** + **Store settings** (brand, tagline TR/EN, contact, shipping rates).
- **Customer list** — registered users with role, signup date, order count, lifetime spend.
- **Three new emails** — `OrderConfirmedEmail` (after bank transfer confirmed), `OrderShippedEmail` (with optional tracking), all React Email templates.

To make yourself an admin: sign up via `/sign-up` first, then run `npm run db:make-admin -- your@email.com`.

**M3 — auth & account:**

- **NextAuth v5 (Auth.js)** + Prisma adapter — credentials provider with bcryptjs, optional Google OAuth (button auto-hides when env vars unset), JWT session strategy.
- **Anonymous → user cart merge** wired in `events.signIn`. Sums quantities by variant, caps at stock, deletes the anonymous cart row.
- **`/sign-in` + `/sign-up`** with shared editorial form styling. Sign-up creates User + Customer rows, hashes password, fires a `WelcomeEmail`, then auto-signs-in.
- **`/account` area** — `requireUser` guard via session check + redirect. Overview (recent orders), orders list, order detail (with bank instructions if applicable), addresses CRUD.
- **Orders surfaced by both `userId` and `email`** — guest orders placed before signup show up automatically once the same email signs in.
- **`server/auth/guards.ts`** — `requireUser()`, `requireAdmin()` helpers; M4 will use them on `/admin/*`.

**M2 — checkout, payment, email, static pages:**

- **Multi-step checkout** (`/checkout`) — Contact → Shipping → Payment → Review, with editable previous steps, sticky order summary, Zod-validated per-step
- **Transactional order creation** — stock decrement, address persistence, payment row, cart-items clear, all in `prisma.$transaction`
- **Bank Transfer flow** — `BankTransferProvider` generates a unique reference (`EFR-YYYY-XXXXXX-NNNN`, Crockford base32), looks up active `BankAccount` rows, returns instructions
- **Order success page** (`/orders/[orderNumber]/thanks`) — bank instructions panel with copy-to-clipboard for reference and IBANs, order summary, shipping address recap
- **Resend + React Email** — `OrderPlacedEmail`, `BankTransferInstructionsEmail`, `AdminNewOrderEmail` templates; service falls back to `console.log` when `RESEND_API_KEY` is unset
- **Static pages** — `/maison` (artisan story, process, artisans), `/faq` (8 Q&A items, TR/EN), `/contact` (info + form), `/terms`, `/privacy` (KVKK/GDPR templates)
- **Payment provider abstraction** — `PaymentProvider` interface, `getPaymentProvider(method)` registry. `PayTRProvider` is a stub that throws; M5 will implement the iframe-token flow.

Out of scope (see milestones): customer accounts (M3), admin panel (M4), PayTR online card payments (M5).

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The storefront renders immediately with **mock product data** as a graceful fallback — the database is optional for first-run.

### To enable the real database

1. Provision PostgreSQL (Neon, Supabase, or local Docker)
2. Copy `.env.example` to `.env` and set `DATABASE_URL`
3. Run migrations + seed:

   ```bash
   npm run db:migrate -- --name init
   npm run db:seed
   ```

Once seeded, the safe-fetchers in `server/services/catalog.ts` will hit the real DB; no code changes needed.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run the built app |
| `npm run typecheck` | `tsc --noEmit` strict check |
| `npm run lint` | ESLint |
| `npm run db:generate` | Regenerate Prisma client after schema edits |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema without a migration (dev only) |
| `npm run db:seed` | Seed 6 categories + 6 products + store settings |
| `npm run db:make-admin -- <email>` | Elevate an existing user to ADMIN role |
| `npm run db:studio` | Open Prisma Studio |
| `npm run format` | Prettier |

## Architecture

```
app/
  (storefront)/      public site — homepage, shop, product detail, cart drawer
  layout.tsx         root (fonts + NextIntlClientProvider + global metadata)
  globals.css        Tailwind v4 + @theme + design tokens
components/
  ui/                shadcn-style primitives (Sheet)
  storefront/        all storefront UI — see plan §15
server/
  db/                Prisma client singleton + per-aggregate queries
  services/          framework-agnostic business logic
  types/             Zod schemas + DTOs
lib/                 env, cn, format, slug, prisma-extensions, mock-products
prisma/              schema.prisma + seed.ts
i18n/                next-intl routing/request/navigation
messages/            tr.json, en.json
styles/              tokens.css (design tokens)
public/              ebru-bg.mp4, ebru-detail.png, ebru-poster.jpg, etc.
```

Strict one-way dependency: **UI → server actions → services → db**. UI never touches Prisma; services are framework-agnostic (no `next/headers`).

## Design tokens (matching the prototype)

| Token | Value |
|---|---|
| `--color-bg` | `#f3ece0` (warm cream) |
| `--color-ink` | `#1a2330` (deep ink) |
| `--color-blue-deep` | `#3e5d72` (firuze accent) |
| `--color-gold` | `#b08a4b` |
| `--font-serif` | Cormorant Garamond |
| `--font-caps` | Tenor Sans |
| `--font-sans` | DM Sans |
| `--maxw` | `1320px` |
| `--pad` | `clamp(20px, 4vw, 56px)` |

Fonts are loaded via `next/font/google` (downloaded at build time, self-hosted from the app's own origin).

## Roadmap

The full architecture and implementation plan is at `C:\Users\tarik\.claude\plans\you-are-a-senior-validated-globe.md`. M2 through M8:

| Milestone | Scope |
|---|---|
| **M1 ✓** | Storefront skeleton (home, listing, detail, cart) |
| **M2 ✓** | Checkout (multi-step) + Bank Transfer flow + Resend emails + static pages (Maison, FAQ, Contact, Terms, Privacy) |
| **M3 ✓** | Auth (NextAuth v5 + credentials + optional Google) + `/account` area (overview, orders, addresses, cart-merge on sign-in) |
| **M4 ✓** | Admin panel — dashboard, product/category CRUD, order management (bank-transfer confirmation + status transitions + tracking), bank account CRUD, store settings, customer list |
| **M5 ✓** | **PayTR** integration — iframe-token get-token flow, HMAC-signed webhook, env-gated activation, retry on expired token, polling thanks page |
| **M6 ✓** | Cloudinary signed image+GLB uploads with drag-to-reorder; full Coupon CRUD + checkout application with atomic usedCount; 3D model management on products |
| **M7 ✓** | Storefront search (locale-aware ILIKE) + faceted filters (category / price range / in-stock / sort); sitemap.xml with hreflang; robots.txt; next/og opengraph-image; Vercel Analytics |
| **M8 ✓** | Launch readiness — real client IP for PayTR; Cloudinary asset cleanup on product delete; stock restoration on order cancel; per-product OG images; A11y (skip link, focus-visible, reduced-motion); strict CSP + security headers; production env validation |

## Launch checklist

Before the first real customer order:

1. **Database** — provision Postgres (Neon, Supabase, or managed PG), set `DATABASE_URL`, then:
   ```bash
   npm run db:migrate -- --name init
   npm run db:seed
   npm run db:make-admin -- you@example.com
   ```
2. **Required env** — `DATABASE_URL`, `AUTH_SECRET` (`openssl rand -base64 32`), `NEXT_PUBLIC_SITE_URL` (absolute https URL). In production `NODE_ENV=production`, `lib/env.ts` will fail boot if any of these are missing or still pointing at localhost.
3. **Cloudinary** — sign up + set `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET`. Without them the upload widgets show "not configured" and product/3D images stay as URL placeholders.
4. **Resend** — set `RESEND_API_KEY` to send real emails. Without it, the email service falls back to `console.log` (fine for dev, unsuitable for production).
5. **PayTR** — set `PAYTR_MERCHANT_ID` / `_KEY` / `_SALT` from the merchant panel. Keep `PAYTR_TEST_MODE=1` and run sandbox transactions until everything settles correctly (Payment → SUCCEEDED, Order → PAID, confirmation email arrives). Only then flip to `PAYTR_TEST_MODE=0`. Configure the merchant panel callback URL to `<NEXT_PUBLIC_SITE_URL>/api/webhooks/paytr`.
6. **Bank accounts** — in `/admin/banks`, add real IBAN entries. Customers see these on the success page after a bank-transfer order.
7. **Store settings** — at `/admin/settings`, set the real brand name, taglines (TR + EN), contact email, shipping flat rate, free-shipping threshold.
8. **Legal pages** — `/terms` and `/privacy` ship as templates. Review with counsel before launch; the marked notice at the top of each page is a reminder.
9. **Smoke test** — place a real bank-transfer order end-to-end, confirm the email arrives, manually confirm the order in admin, watch status flip to PAID. Then repeat with a PayTR sandbox card.
10. **SEO** — confirm `<NEXT_PUBLIC_SITE_URL>/sitemap.xml` and `/robots.txt` resolve. Submit the sitemap in Google Search Console once live.
11. **Optional** — wire Sentry (`@sentry/nextjs`) for production error tracking; configure Vercel project, custom domain, and PR previews.

## Known caveats / future work

- **`localePrefix: 'never'`** — locale is cookie-based (no `/tr`, `/en` URLs). M7 will restructure under `app/[locale]/(storefront)/...` for per-locale URLs and full `hreflang` SEO.
- **`<model-viewer>` from CDN** — keeps three.js out of the bundle. If you want bundled control, swap to React Three Fiber in `components/storefront/ModelViewer.tsx` keeping the prop contract.
- **No checkout in M1** — the cart drawer's "Continue to checkout" links to `/checkout` (not yet implemented).
- **Mock data fallback** — until `DATABASE_URL` is set, the storefront uses `lib/mock-products.ts` so first-run renders cleanly. Real DB data takes over automatically once seeded.

## Tech versions

Next.js 16.2.6 · React 19.2 · TypeScript 5.x · Tailwind v4 · Prisma 6.x · next-intl 4 · Zod 4

The package.json names them all; this list is for orientation.

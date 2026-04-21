# Agency OS Changelog

All notable changes to the Agency OS platform, CRM functions, and vertical features will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased] - Coming Soon

### VertaFlow portal offline cache + PWA hardening (2026-04-21)

- **Dexie offline storage:** Added `apps/vertaflow-crm/src/lib/offline/portal-offline.ts` so the portal caches the latest dashboard snapshot, support history, and queued ticket submissions in IndexedDB for weak-signal environments.
- **Tenant-safe cache scoping:** `GET /api/portal/data` and `GET /api/portal/tickets` now return a hashed `offlineCacheKey` derived server-side from tenant + prospect ids instead of exposing raw identifiers in client storage.
- **Reconnect sync:** Portal dashboard and support views now fall back to Dexie data when the network fails, show cached/offline state banners, and automatically flush queued support tickets once the connection returns.
- **PWA install polish:** `manifest.webmanifest` is now branded as **VertaFlow Portal**, with `id` and `start_url` pinned to `/portal/dashboard` for a consistent installed-app entry path.

### Customer-site embed pack + two-tenant lead triage (2026-04-20)

- **Portable pack:** Added [`apps/customer-site-embeds/`](apps/customer-site-embeds/) with studio vs VertaFlow product HTML forms, Calendly iframe templates, optional BuiltWith/Wappalyzer-style `tech-trace-snippet.html`, and **OWNERSHIP.md** (Designed by Anthony as master owner).
- **Agency OS:** `POST /api/lead` now forwards optional `agencyId` from the public body to `executeLeadIntake` so browser embeds can target the correct Clerk tenant when multiple orgs share one deployment.
- **Marketing:** Contact page includes a **Portable embed pack** showcase (`PortableEmbedShowcase.astro`) using distinct `offer_type` / `cta_source` for CRM filtering.
- **VertaFlow marketing:** Early-access form posts the public lead contract (including `offer_type`, `page_context`, optional `agencyId` + Turnstile via `VITE_*` build-time injection).

### VertaFlow offline-first synchronization engine (2026-04-20)

- **Client persistence:** Added Dexie-backed local storage in `apps/vertaflow/src/lib/db.ts` with tenant-safe `leads` and `estimates` tables using `local_id` (UUID), `sync_status` (`pending`/`synced`), and timestamps.
- **Global sync runtime:** Added `GlobalSyncProvider` in `apps/vertaflow/src/providers/GlobalSyncProvider.tsx` and auto-installed it from `main.js`, so online/offline transitions trigger sync attempts through `navigator.onLine` event listeners.
- **Sync transport:** Added batch sync client in `apps/vertaflow/src/lib/sync.ts` that collects pending records and POSTs to `/api/sync`, then marks local rows as `synced` on success.
- **Conflict resolution:** Added server-side sync handler in `apps/vertaflow/src/api/sync/handler.ts` with last-write-wins logic (`updated_at` newest record wins) for both leads and estimates against Neon via `@dba/database`.
- **Verification:** Added Vitest + jsdom + fake-indexeddb tests (`apps/vertaflow/src/test/offline-sync.spec.tsx`) that simulate offline queueing, online toggle, and assert `/api/sync` call execution and local status transitions.

### Vercel build sanitation (2026-04-20)

- **Marketing deploy:** Removed the obsolete root-level `.vercel/output` copy step from the app-local Vercel config; Astro's Vercel adapter output now stays where the marketing project expects it.
- **Agency OS deploy:** Production env validation now follows the Clerk auth model and no longer blocks builds on unused legacy Stytch variables.
- **Agency OS build:** `next build` now runs with an 8 GB Node heap so TypeScript does not abort near the default heap limit.

### Go-live hardening (2026-04-19)

- **Public lead ingest (`POST /api/lead`):** Validates with `parsePublicLeadIngestBody` from `@dba/lead-form-contract`, then `validatePublicLead` (disposable domains + format), bot heuristics, and Turnstile when configured. Marketing attribution fields are passed to `executeLeadIntake` via `marketingMetaFromPublicBody`.
- **Strict typing:** Barcode and inventory helpers use `Database` from `@dba/database` instead of incorrect `PostgresJsDatabase` imports.
- **Cleanup:** Removed `console.*` from app/server code paths; ESLint `no-console` enabled for `dba-agency-os` and `dba-lighthouse-audit`.
- **Sentry (marketing client):** Session replay stays opt-in via `PUBLIC_SENTRY_REPLAY=1`; default session sampling is `0`, error replay `0.25` when enabled (was `1.0`).
- **Sentry (web-viewer server):** `includeLocalVariables: false` on server init (aligns with Lighthouse).
- **Sentry (marketing Astro):** Source map upload is opt-in via `SENTRY_SOURCEMAP_UPLOAD=1` (avoids failed upload noise when token/org/project do not match).
- **Pre-commit:** Husky hook rejects new `console.*` in staged `apps/` and `packages/` TypeScript/JavaScript (excludes `node_modules`, `.next`, `dist`).
- **Build:** Excluded `playwright.browserbase.config.ts` from Next.js typecheck (optional Browserbase config; avoids missing optional `dotenv` during `next build`).
- **Build (web-viewer):** `next build` runs with `NODE_OPTIONS=--max-old-space-size=8192` to avoid TypeScript OOM on large projects.
- **Database:** `pnpm db:seed:master` script inserts into `tenants` using `clerk_org_id`, `vertical_type`, and required `created_at` / `updated_at` (matches Drizzle schema).
- **Playwright:** Restored `apps/web-viewer/.env.test` sandbox (Neon `DATABASE_URL`, correct `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`). Run `pnpm exec playwright install chromium` once after installing deps if browsers are missing.
- **Playwright + OWASP ZAP:** Optional `PLAYWRIGHT_ZAP=1` routes Chromium through a local ZAP proxy (`zaproxy` client, `tests/helpers/zap.ts`); HTML report under `test-results/zap/` after the run. Root: `pnpm test:e2e:web:zap`; app: `pnpm test:zap`. Set `ZAP_API_KEY` from ZAP Options → API (see `.env.example`).

### 🚀 Upcoming Features (V2)
- **Two-Way SMS / Twilio** — "On My Way" texts, appointment reminders via SMS
- **Route Optimization** — Map-based dispatching for Service Pro
- **AI Receptionist** — Auto-booking from phone calls
- **Customer-Facing Display** — Second screen for retail POS
- **Multi-Location Management** — Cross-location reporting and stock transfers
- **Payroll & Staff Scheduling** — Employee management suite
- **QuickBooks / Xero Integration** — Accounting sync
- **Advanced Analytics / Forecasting** — AI-powered business intelligence
- **Medical / Dental Vertical** — HIPAA BAA + EHR integration
- **Real Estate / Property Management** — Lease management + tenant screening
- **Construction Vertical** — Job costing + subcontractor management

---

## [1.0.0] - 2026-04-19

### CRM V1 Sprint — "The Big One"

#### Legal Framework
- **Terms of Service** (`/admin/legal/terms`) — 15-section SaaS agreement
- **Privacy Policy** (`/admin/legal/privacy`) — Data collection, sharing, security, retention, user rights
- **Acceptable Use Policy** (`/admin/legal/aup`) — Prohibited activities, email rules, data handling
- **Consent Checkpoint** — Three-checkbox acceptance gate (TOS + Privacy + AUP) with version-stamped recording
- Legal consent tracked in `tenants.crmConfig.legal` with timestamp, version, and acceptor ID

#### Onboarding Flow (Stripe-Style)
- **Sticky Floater** — Bottom-right progress checklist with 7 steps, animated progress bar
- Steps: Create Org → Accept Legal → Select Vertical → Add Lead → Setup Email → Connect Stripe → Install PWA
- Persists across pages until complete, dismissible with localStorage
- Each step links to its setup page

#### AI Onboarding Specialist (Gemini 2.0 Flash)
- **Chat Widget** — Bottom-left AI assistant for setup help
- System prompt covers all 5 verticals, features, and setup steps
- **Auto-Escalation** — Creates support ticket after 6 exchanges or frustration keywords
- `POST /api/admin/ai-support` — Chat API with Zod validation
- `POST /api/admin/ai-support/escalate` — Converts conversation to ticket with full transcript

#### Mobile & PWA
- **Bottom Navigation** — 5-item nav bar (Home, POS, Calendar, Inbox, More) visible on mobile
- **PWA Shortcuts** — Quick access to POS, Clock In, Calendar, Portal from app icon
- **Safe Area Insets** — Proper padding for notched devices
- **Touch Targets** — 48px minimum tap targets across all interactive elements

#### Verticals (5 Core — Serving 30+ Industries)
- **Agency / B2B** — Pipelines, Estimates, Contracts, Invoicing, Email Sequences
- **Service Pro** — Job Scheduling, Time Tracking, Before/After Photos, Recurring Jobs
- **Restaurant & Bar** — Menu Management, KDS, Multi-Terminal POS, Online Ordering
- **Retail POS** — Inventory/SKU/Barcode, Variants (Size/Color), Returns/Exchanges
- **Wellness & Salons** — Class Scheduling, Remaining Seats, Memberships, Waivers

#### Light ERP / Inventory Management (19 New Tables)
- `inventory_items` — SKU, Barcode, Stock Count, COGS, Stock Type (stock/non_stock/special_order)
- `item_variants` — Size/Color/etc for retail products
- `menu_categories` — Restaurant menu grouping
- `menu_items` — Products synced to Stripe for POS + online ordering
- `menu_modifiers` — Add-ons and options (e.g. "Add Bacon +$2")
- `orders` — Universal order record (POS, KDS, online, catering)
- `order_items` — Line items with snapshotted price and modifier snapshot
- `restaurant_tables` — Floor plan management (table number, zone, seats, status)

#### Universal Booking System
- `appointments` — Discovery calls, jobs, sessions (with iCal RRULE for recurring)
- `events` — Classes, catering, webinars with max_capacity and "X seats remaining"
- `event_bookings` — Booking + waitlist status (confirmed/waitlisted/cancelled)

#### Cross-Vertical Features
- `gift_cards` — Code, balance tracking, expiration
- `loyalty_points` — Points ledger per prospect
- `memberships` — Recurring packages tied to Stripe Subscriptions
- `tax_rates` — Per-tenant tax configuration (basis points)
- `file_attachments` — Cloudflare R2 URLs (images, PDFs, docs) — DB stores URLs only
- `hardware_devices` — Registered Stripe Readers + PrintNode printers
- `time_entries` — Clock in/out per job for Service Pro
- `returns` — Return/exchange records with restock tracking

#### New Enums (6)
- `stock_type` — stock, non_stock, special_order
- `order_status` — new, preparing, ready, completed, cancelled, refunded
- `order_type` — dine_in, takeout, delivery, retail_pos, ecommerce, catering
- `payment_method` — card, cash, check, gift_card, split
- `appointment_status` — scheduled, confirmed, in_progress, completed, no_show, cancelled
- `event_booking_status` — confirmed, waitlisted, cancelled

#### New Automation Triggers (8)
- `order_placed`, `order_completed`, `appointment_scheduled`, `appointment_no_show`
- `event_booked`, `event_waitlist_opened`, `inventory_low`, `gift_card_redeemed`

#### Server Actions (Tenant-Scoped Business Logic)
- **Inventory** — CRUD, soft-delete, search by name, barcode/SKU lookup
- **POS / Orders** — Create order with auto-numbering, stock decrement, cash/card/check/gift card tendering
- **Menu** — Categories, items, modifiers with sort order; `getFullMenu()` for nested view
- **Appointments** — CRUD with status lifecycle, iCal recurrence, calendar revalidation
- **Events** — CRUD with capacity tracking, remaining seats, waitlist booking
- **Rewards** — Gift card create/redeem, loyalty points award/redeem/balance
- **Time Clock** — Clock in/out with duplicate prevention, auto-duration calculation
- **Returns** — Process return with optional restock of inventory items

#### API Routes (Public + Admin)
- `POST /api/admin/upload` — Multipart file upload to R2 with `file_attachments` record
- `GET /api/admin/kitchen` — KDS feed: active orders with items, table names, elapsed time, urgency
- `GET /api/portal/menu?tenant=` — Public menu for online ordering with out-of-stock status
- `GET /api/events?tenant=` — Public event calendar with remaining seats + urgency flags

#### Utilities
- `src/lib/r2.ts` — Cloudflare R2 upload/delete with tenant-scoped keys
- `src/lib/inventory.ts` — Stock check, decrement, increment, low-stock alerts, menu availability sync
- `src/lib/printnode.ts` — PrintNode API: submit jobs, list printers, ESC/POS receipt + kitchen ticket formatting
- `src/lib/barcode.ts` — Barcode/QR lookup (inventory + gift cards), unique barcode generation

#### Infrastructure
- Added `retail` to vertical_type_enum
- Node.js engine constraint updated to `>=22.12.0` (supports Node 22 LTS + Node 24 LTS)
- Cloudflare R2 integration for asset storage (`assets.designedbyanthony.com`)
- PrintNode API env wiring for cloud receipt/kitchen printing
- Git cleanup: 16 stale branches deleted, 1 worktree removed

### Security
- All 19 new tables enforce `tenant_id` foreign key with cascade delete
- Every table indexed on `tenant_id` for zero-trust multi-tenancy
- File attachments stored in R2, not Postgres — keeps DB lean and secure

## [0.1.0] - 2026-04-18

### Added
- **Database Refactor**: Migrated primary CRM data from Firestore to Neon Serverless Postgres
- **AI QA Automation**: Integrated Browserbase and Stagehand for automated semantic testing

### Security
- **Data Isolation**: Implemented strict `tenant_id` zero-trust scoping across all queries

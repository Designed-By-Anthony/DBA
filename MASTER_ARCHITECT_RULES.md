# MASTER ARCHITECT RULES (ROOT)

## 1. Single Next.js app
- Public marketing + Lighthouse live in **this repo root** (`src/`, `next.config.ts`).
- Shared helpers belong under `src/lib/`, `src/design-system/`, or `src/lighthouse/` — not a separate workspace package.

## 2. The "Augusta" Security Protocol
- DATABASE: Neon Postgres (`DATABASE_URL`) where CRM / Agency OS applies.
- TENANT LOCK: Every query in tenant-scoped apps must filter by tenant (`tenant_id` / `clerk_org_id`).
- Cross-tenant data leakage is a critical failure.

## 3. Subdomain routing (this repo)
- `admin.designedbyanthony.com` / `accounts.designedbyanthony.com` → **308** to VertaFlow (see `src/proxy.ts`).
- `designedbyanthony.com` / `www` / `lighthouse.*` → this Next.js app.

## 4. The Purge
- FIREBASE/FIRESTORE: Terminate on sight in new work. Prefer Drizzle/SQL where data lives.
- CLEANUP: Delete unused legacy artifacts.

## 5. VERBATIM SYSTEM MAPPING
- **Sales Term:** "Agency" or "Agency OS"
- **Database Table:** `tenants`
- **Security Key (SQL):** `tenant_id` (UUID) or `clerk_org_id` (Text)
- **UI Logic:** Use `tenant.vertical` to drive the "Chameleon" skinning.

**Note to Agent:** While the user may refer to "Agency ID," all Drizzle queries MUST use the schema-defined `tenant_id` or `clerk_org_id` to maintain Postgres integrity.

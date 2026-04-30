# MASTER ARCHITECT RULES (ROOT)

## 1. Turborepo monorepo
- Public marketing + Lighthouse live in **`apps/web/`** (`apps/web/src/`, `apps/web/next.config.ts`).
- API Worker lives in **`apps/api/`** (ElysiaJS on Cloudflare Workers).
- Shared helpers belong in `packages/shared/` (`@dba/shared`) — business logic reused by both web and API.

## 2. The "Augusta" Security Protocol
- DATABASE: Neon Postgres (`DATABASE_URL`) where VertaFlow CRM / tenant apps apply.
- TENANT LOCK: Every query in tenant-scoped apps must filter by tenant (`tenant_id` / `clerk_org_id`).
- Cross-tenant data leakage is a critical failure.

## 3. Subdomain routing (apps/web)
- `admin.designedbyanthony.com` / `accounts.designedbyanthony.com` → **308** to VertaFlow (see `apps/web/src/middleware.ts`).
- `designedbyanthony.com` / `www` / `lighthouse.*` → this Next.js app.

## 4. The Purge
- CLEANUP: Delete unused legacy artifacts.

## 5. VERBATIM SYSTEM MAPPING
- **Sales Term:** "Agency" or "VertaFlow CRM"
- **Database Table:** `tenants`
- **Security Key (SQL):** `tenant_id` (UUID) or `clerk_org_id` (Text)
- **UI Logic:** Use `tenant.vertical` to drive the "Chameleon" skinning.

**Note to Agent:** While the user may refer to "Agency ID," all Drizzle queries MUST use the schema-defined `tenant_id` or `clerk_org_id` to maintain Postgres integrity.

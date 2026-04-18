# MASTER ARCHITECT RULES (ROOT)

## 1. Monorepo Enforcement
- I am the Master Agent. I oversee /apps and /packages.
- Ensure all apps use @dba/ workspace protocols for internal packages.
- NEVER create redundant sub-folders for logic that belongs in /packages.

## 2. The "Augusta" Security Protocol
- DATABASE: Neon Postgres (`DATABASE_URL`).
- TENANT LOCK: Every query in /apps must filter by 'agencyId'. 
- Cross-tenant data leakage is a critical failure.

## 3. Subdomain Routing Logic
- admin.designedbyanthony.com -> Rewrite to apps/web-viewer
- accounts.designedbyanthony.com -> Rewrite to apps/web-viewer/accounts
- designedbyanthony.com -> Rewrite to apps/marketing

## 4. The Purge
- FIREBASE/FIRESTORE: Terminate on sight. Replace with Drizzle/SQL.
- CLEANUP: Delete unused legacy artifacts (proxy.ts, sentry-test, etc).

## 5. VERBATIM SYSTEM MAPPING
- **Sales Term:** "Agency" or "Agency OS"
- **Database Table:** `tenants`
- **Security Key (SQL):** `tenant_id` (UUID) or `clerk_org_id` (Text)
- **UI Logic:** Use `tenant.vertical` to drive the "Chameleon" skinning.

**Note to Agent:** While the user may refer to "Agency ID," all Drizzle queries MUST use the schema-defined `tenant_id` or `clerk_org_id` to maintain Postgres 18 integrity.

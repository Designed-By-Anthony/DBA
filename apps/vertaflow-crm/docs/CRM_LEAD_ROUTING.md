# CRM lead routing — forms to Postgres

This document is the source of truth for how public leads reach Postgres (`leads` table on Neon) and appear in Agency OS.

## Endpoints (VertaFlow CRM / `apps/vertaflow-crm`)

| Route | Audience | Auth | Tenant resolution | DB write |
|-------|----------|------|-------------------|----------|
| `POST /api/v1/ingest` | Marketing site (primary), partners | Turnstile **or** `X-DBA-SECRET` **or** `LEAD_WEBHOOK_SECRET` (headers/body) | `X-Tenant-Id` / `X-Agency-Id` / body `tenantId`, then env / fallback chain | `insertSqlLead` → `leads` |
| `POST /api/leads/ingest` | Same as v1 | Same | Same | Same (shared handler) |
| `POST /api/lead` | Legacy browser JSON; still supported | Turnstile in prod (fail-closed) | **Ignores** `agencyId` from body — uses `LEAD_WEBHOOK_DEFAULT_AGENCY_ID` / fallback only (anti cross-tenant stuffing) | `executeLeadIntake` → `insertSqlLead` + email |
| `POST /api/webhooks/lead` | Server-to-server with shared secret | `LEAD_WEBHOOK_SECRET` | Explicit `agencyId` allowed | `executeLeadIntake` |

## Marketing site (`apps/marketing`)

- **`AuditForm`** submits JSON via `fetch` to `PUBLIC_INGEST_URL` → `PUBLIC_CRM_LEAD_URL` → default **https://admin.vertaflow.io/api/v1/ingest** (see `AuditForm.astro` + `audit-forms.ts`).
- **`X-Tenant-Id`** is set from **`PUBLIC_TENANT_ID`** at build time (`data-tenant-id` on the form). Without it, ingest returns **400** unless the server resolves a tenant via env/fallback.

## Required configuration (production)

1. **Vercel (vertaflow-crm):** `DATABASE_URL` or `DATABASE_URL_UNPOOLED`, `LEAD_WEBHOOK_DEFAULT_AGENCY_ID` = your Clerk **org id** (same as `tenants.clerk_org_id`), `TURNSTILE_SECRET_KEY`.
2. **Vercel (marketing build):** `PUBLIC_TENANT_ID` = same Clerk org id (so `X-Tenant-Id` matches a row in `tenants`), or rely on server-side `LEAD_WEBHOOK_DEFAULT_AGENCY_ID` for **`/api/lead`** only (ingest **still** needs header or body tenant unless you use the fallback below).
3. **Optional single-tenant shortcut:** `LEAD_WEBHOOK_SQL_SINGLE_TENANT_FALLBACK=true` on vertaflow-crm uses the **first** row in Postgres `tenants` when tenant resolution from env fails. **Do not** enable on multi-tenant SaaS.

## Data shape

- `leads` fixed columns: name, email, phone, source, status, etc.
- **Website, message, company, audit URL** from `/api/lead` are stored in **`metadata` JSONB** (merged in `insertSqlLead`).
- Admin list/detail read SQL via `listSqlLeads` / `getSqlLeadByProspectId` and map metadata back into the UI `Prospect` type.

## Related packages

- `@dba/lead-form-contract` — Zod schemas + `buildPublicLeadPayloadFromFormData` for marketing forms.
- `packages/database/schema.ts` — `leads`, `tenants` tables.

# Customer-site embeds (forms + calendar)

Portable HTML you can paste into **Wix, Squarespace, WordPress, Webflow, Framer**, or any page where you control custom HTML.

Each snippet is designed so you can tell **which business line** the submission belongs to before you reply.

## BuiltWith / Wappalyzer “tech trace”

Optional fingerprint file [`tech-trace-snippet.html`](./tech-trace-snippet.html) adds **non-secret** metadata (`generator`, `data-*` hints, `dns-prefetch`) that stack scanners often surface. Use it **only** on demo / portfolio pages where you *want* the trace visible—do not paste into client production sites unless they ask for attribution.

## Calendar (Calendly)

| File | Use |
|------|-----|
| [`calendar/calendly-web-design-consult.html`](./calendar/calendly-web-design-consult.html) | **Designed by Anthony** — web design / studio intro call (same UTMs as `designedbyanthony.com/contact`). |
| [`calendar/calendly-vertaflow-intro-placeholder.html`](./calendar/calendly-vertaflow-intro-placeholder.html) | **VertaFlow** — replace `YOUR_CALENDLY_EVENT` with your CRM product intro event when ready. |

## Lead forms (two tenants on Agency OS)

Public browser posts go to **`POST /api/lead`** on your Agency OS host (e.g. `https://admin.vertaflow.io/api/lead`).  
The server resolves the tenant with:

1. JSON body **`agencyId`** (Clerk `org_…` that exists in `tenants.clerk_org_id`), else  
2. **`LEAD_WEBHOOK_DEFAULT_AGENCY_ID`** on that deployment.

Set **`agencyId` inside each embed** so you always know which inbox the lead landed in.

| Lane | Who replies | Set `agencyId` to | Set `offer_type` / `cta_source` (recommended) |
|------|-------------|-------------------|-----------------------------------------------|
| **Designed by Anthony — web studio** | You (web design / SEO / builds) | Clerk org for your **web design agency** tenant | `offer_type`: `dba_studio_portable_embed`, `cta_source`: `customer_site_embed` |
| **VertaFlow — product CRM** | You (VertaFlow early access / demos) | Clerk org for your **VertaFlow master** tenant | `offer_type`: `vertaflow_product_portable_embed`, `cta_source`: `customer_site_embed` |

**How to tell submissions apart in the CRM**

- Filter by **tenant** (resolved from `agencyId`).
- Read **`offer_type`**, **`cta_source`**, **`page_context`**, and **`lead_source`** on the lead / activity metadata (from the marketing ingest contract).
- `source` string on the lead is often a compact pipe-separated summary—prefer `offer_type` for automation rules.

## Snippets in this folder

| Path | Purpose |
|------|---------|
| [`designed-by-anthony-studio/lead-form-portable.html`](./designed-by-anthony-studio/lead-form-portable.html) | Studio lane — swap `REPLACE_CRM_ORIGIN`, `REPLACE_AGENCY_ID`, Turnstile site key. |
| [`vertaflow-product/lead-form-portable.html`](./vertaflow-product/lead-form-portable.html) | VertaFlow lane — same pattern, different defaults. |
| [`../vertaflow/embed/lead-form.html`](../vertaflow/embed/lead-form.html) | Branded VertaFlow embed (repo canonical); replace `REPLACE_CLERK_ORG_FOR_VERTAFLOW_MASTER` before shipping. |

## Production checklist

- [ ] `agencyId` = real Clerk org id from Neon `tenants`.
- [ ] Turnstile **site** key in the page; **secret** only on Agency OS (`TURNSTILE_SECRET_KEY`).
- [ ] CORS: host origin allowed via `LEAD_WEBHOOK_CORS_ORIGINS` or sibling-domain auto-allow (see `lead-webhook-cors.ts`).
- [ ] Honeypot `_hp` stays hidden and empty.

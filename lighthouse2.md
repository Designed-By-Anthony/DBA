# Lighthouse Scanner — product description & operator guide

This document is the **single source of truth** for how we **describe** the scanner (marketing, OG tags, splash copy) and what **you** configure in **Cloudflare Pages / Workers** env. Structure is inspired by common open-source SEO audit READMEs (for example [vchaitanyachowdari/seo-audits-generator](https://github.com/vchaitanyachowdari/seo-audits-generator)) — clear feature blocks, stack, env, usage — adapted to **this repo’s real implementation**, not a generic SaaS template.

---

## One-line pitch (use everywhere)

**Free website audit for service businesses** — Google PageSpeed Insights (Core Web Vitals + Lighthouse categories), on-page SEO signals from your HTML, crawlability (robots.txt, sitemap, redirects), optional local/maps context, optional backlink metrics when configured, and an **AI-written** prioritized summary. Built by **ANTHONY.** for Mohawk Valley and Central NY (and remote clients).

---

## Feature map (describe honestly)

| Area | What we say publicly | What the code actually does (`POST /api/audit`) |
|------|----------------------|--------------------------------------------------|
| **Technical SEO** | Meta, headings, canonical, schema hints, indexability flags | `scanHtml()` + stored HTML signals |
| **Performance** | Core Web Vitals, speed context | **PageSpeed Insights API** (mobile strategy today) |
| **Crawlability** | Robots, sitemap, redirect sanity | `scanSitewide()` |
| **Local context** | GBP-style context when available | **Google Places** when `GOOGLE_PLACES_API_KEY` is set |
| **Authority / links** | “Backlink snapshot when configured” | **Moz API** when `MOZ_API_CREDENTIALS` / token is set; otherwise omit or show “not configured” in UI |
| **Conversion / UX** | “Trust + conversion lens” | AI **conversionScore** + CTA/schema/tel/form signals from HTML |
| **AI report** | Plain-English executive summary + top fixes | **Gemini** (`generateAiInsight`) with fallback |
| **Persistence** | Sharable report when storage works | KV / D1 report store when configured |
| **CRM / leads** | Optional | Convex webhooks, Sheets, Gmail — see `.env.example` (`AUDIT_LEAD_WEBHOOK_*`, `LEAD_WEBHOOK_URL`) |

Do **not** claim: unlimited full-site crawl like Semrush/Ahrefs, JS-rendered crawl of every route, or “Moz DA” unless Moz is configured.

---

## Comparison note (why the GitHub README shape helps)

Projects like [seo-audits-generator](https://github.com/vchaitanyachowdari/seo-audits-generator) lead with **stack badges**, **feature bullets** (SEO + CRO + AI), **install/env**, **usage**, and a **feature status table**. We should mirror that **shape** on the site and in docs:

- Badges: optional later (Next.js, Cloudflare Pages, TypeScript).
- Bullets: use the table above, tightened for the hero.
- Status table: use “Live / Planned / Needs API key” for transparency (splash-worthy *because* it is honest).

---

## Tech stack (this repository)

| Layer | Technology |
|-------|------------|
| App | **Next.js 16** (App Router), **TypeScript** |
| UI | Marketing design system + Lighthouse segment (`src/app/lighthouse/`, `src/lighthouse/components/`) |
| Audit API | `src/app/api/audit/route.ts` (Node runtime) |
| Bot protection | **Rate limiting** always; **Cloudflare Turnstile** only when `LIGHTHOUSE_STRICT_TURNSTILE=1` + `TURNSTILE_SECRET_KEY` (default: `/lighthouse` runs without Turnstile) |
| AI | **Google Gemini** (API key or Vertex) |
| Performance data | **Google PageSpeed Insights API** |
| Deploy | **Cloudflare Pages** (OpenNext; CSP synced via `bun run sync:static-headers` from the web app) |

---

## Your checklist (env / keys)

1. **`GOOGLE_PAGESPEED_API_KEY`** — required for meaningful lab scores.
2. **`GEMINI_API_KEY`** or Vertex env — required for AI narrative (fallback exists but is thinner).
3. **`TURNSTILE_SECRET_KEY`** + **`NEXT_PUBLIC_TURNSTILE_SITE_KEY`** — optional unless you set **`LIGHTHOUSE_STRICT_TURNSTILE=1`** (then the audit API requires a valid token; wire the widget again on the client).
4. **`GOOGLE_PLACES_API_KEY`** — optional; enriches local block.
5. **`MOZ_API_CREDENTIALS`** (or token) — optional; omit if you dropped Moz subscription.
6. **`REPORT_PUBLIC_BASE_URL`** — optional; defaults to apex site for `/report/:id` links.
7. **Webhooks / Sheets** — optional; see `.env.example` for `AUDIT_LEAD_WEBHOOK_*`, `AUDIT_LOGGING_WEBHOOK_URL`, Gmail, Sheets.

---

## Usage (for copy / support pages)

1. Open **`/lighthouse`** or **`lighthouse.designedbyanthony.com`**.
2. Enter **URL**, **name**, **company**, **email**, **city/state**.
3. Submit (no Turnstile on `/lighthouse` by default).
4. Read scores + AI summary; share **report link** when persistence is enabled.

---

## Splash / hero copy blocks (paste-ready)

**Eyebrow:** `Free audit · No credit card`

**Headline:** `See what Google sees — before your competitors do`

**Sub:** `PageSpeed lab scores, on-page SEO signals, crawl checks, and a plain-English action list. Built for contractors and local service businesses in Central New York.`

**Bullets:**

- Core Web Vitals & Lighthouse categories (mobile lab)
- Meta, headings, schema, and trust signals on your homepage
- Robots.txt, sitemap, and redirect chain snapshot
- AI summary with prioritized fixes you can hand to a developer

**Fine print (footer of card):** `Results reflect automated checks on the URL you submit. Not a substitute for a paid enterprise crawl or legal advice.`

---

## Reference

- Inspiration for **README / landing structure**: [github.com/vchaitanyachowdari/seo-audits-generator](https://github.com/vchaitanyachowdari/seo-audits-generator) (and related `seo-audit-report-generator` README on GitHub). We do not depend on that codebase; we only align **how we organize the story**.

When marketing copy drifts, **update this file first**, then sync `src/app/lighthouse/layout.tsx` metadata and any on-page hero.

---

## v2 operator playbook (no-Moz, action checklist)

This file is the **operator playbook** for shipping a scanner that competes with commercial “site audit” tools **without Moz**. Engineering work tracks on branch `cursor/lighthouse2-no-moz-c943` (or whatever MR you merge). Use a **separate branch** for marketing UI polish: `cursor/basic-ui-fixes-c943`.

---

## What the big scanners actually do (so we aim at the right bar)

Public documentation for category leaders describes stacks roughly like this:

| Capability | [Semrush Site Audit](https://www.semrush.com/kb/31-site-audit) | [Ahrefs Site Audit](https://ahrefs.com/academy/how-to-use-ahrefs/site-audit/introduction) | **Our v2 direction (no Moz)** |
|------------|----------------------------------------------------------------|---------------------------------------------------------------------------------------------|------------------------------|
| Core engine | **Own high-speed crawler** (breadth-first from start URL, sitemap, or URL list); 100+ checks | **Own crawler** + issue catalog; health score from crawled URLs | **Bounded crawler** (sitemap + internal links from first page, strict caps) + existing HTML/HTTP fetches |
| Performance | Lab + thematic reports; optional JS rendering on higher tiers | **PageSpeed Insights API** (your Google key) for Lighthouse lab + **CrUX field data** where available ([Ahrefs help](https://help.ahrefs.com/en/articles/5369589-how-to-see-pagespeed-insights-and-other-metrics-in-site-audit-tool)) | Already: **PSI mobile**; v2: **CrUX** (Chrome UX Report API), optional **desktop PSI** pass |
| Crawl source | Start from website, **robots.txt sitemap**, sitemap URL, or CSV ([Semrush KB](https://www.semrush.com/kb/539-configuring-site-audit)) | Scope by domain/subfolder; crawl credits | Already: **robots + sitemap fetch**; v2: **multi-URL sample** from sitemap + nav |
| “Authority” | Proprietary + link index (subscription) | Proprietary link graph | **First-party estimate** from homepage signals when Moz is off (bounded, clearly labeled — **not** DA/DR) |
| Extras | AI assist, GEO checks, exports | GSC/GA integration, scheduling | **Search Console URL Inspection** (if you add OAuth/service), **GSC performance** query, exports/PDF later |

**Takeaway:** parity on **crawl + PSI + CrUX + on-page + transparency** is realistic; parity on **global link index** is not without a paid data vendor — we sell **clarity and action**, not fake DA.

---

## Already done on `cursor/lighthouse2-no-moz-c943` (code)

- **Moz optional:** If the Moz API does not return real data, the audit uses **`buildInternalAuthorityMetrics()`** (`src/lighthouse/lib/authorityEstimate.ts`) so scores and UI still populate. Labels say **internal estimate**, not Moz DA.
- **Index estimate:** Uses **sitemap + Moz pages-crawled only when Moz actually returned**; otherwise sitemap-only (avoids inflating index with fake `pagesCrawled`).
- **AI prompts** updated to treat internal authority differently from Moz (`authorityDataSource` in `generateAiInsight`).
- **`biome.json`** restored with ignores/overrides so `bun run lint` stays usable (includes ignoring generated `static-headers.json` formatting noise).

---

## What you need to do on your end (ordered)

### A. Google / APIs (required for a serious v2)

1. **`GOOGLE_PAGESPEED_API_KEY`** — [Google Cloud Console](https://console.cloud.google.com/) → enable **PageSpeed Insights API** → create API key → restrict key to that API + your deploy hostnames if possible. Set this on your App Hosting backend (runtime) so audits can call Google. **`runPagespeed` is slow** (often 30–50s on heavy sites); the server waits up to **55s** and **retries once** on timeout or 5xx. If you still see errors, check Cloud **API quotas**, key restrictions (must allow the PageSpeed API), and that the audited URL is **publicly reachable** (no auth wall).
2. **`GEMINI_API_KEY`** or Vertex — already used for the narrative; keep quota sane (monitor usage in Google AI Studio / Cloud).
3. **`LIGHTHOUSE_STRICT_TURNSTILE`** — omit or `0` for default (**no** Turnstile on `POST /api/audit`). Set to **`1`** only if you want Cloudflare verification again; then pair **`NEXT_PUBLIC_TURNSTILE_SITE_KEY`** + **`TURNSTILE_SECRET_KEY`** ([Turnstile](https://developers.cloudflare.com/turnstile/)) and re-add a client widget that posts `turnstileToken` (hostname allowlist in Cloudflare still applies to previews). Marketing contact forms prefer **reCAPTCHA Enterprise** when `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` + `RECAPTCHA_ENTERPRISE_API_KEY` + GCP project are set; otherwise optional Turnstile when `TURNSTILE_SECRET_KEY` is set.

### B. Optional but high leverage (competitor parity)

4. **Chrome UX Report (CrUX) API key** — same Google project; request **CrUX API** access. Lets v2 show **real-user** LCP/INP/FCP where data exists (Ahrefs/PSI stack this way). *You:* enable API + add env var we will read in code (`CRUX_API_KEY` or reuse PSI key if product allows).
5. **Google Search Console** — *You:* verify the site in GSC. For v2 “miracle” tier we can add **OAuth or a service account** with `webmasters.readonly` to pull impressions/clicks for the audited property (you must consent in GSC UI once).
6. **`GOOGLE_PLACES_API_KEY`** — keeps local/maps block rich (already used for Places).

### C. Ops / honesty

7. **Decide max runtime and max URLs per audit** (e.g. 90s cap, 5 extra URLs) — tell the dev team so crawl depth stays predictable on serverless.
8. **Privacy / marketing copy** — ensure `/privacy` mentions scanner logging, webhooks, and retention if you store IPs or full HTML snippets.

### D. Git workflow (two tracks)

9. **Lighthouse work:** feature branches off `main` — merge when audit pipeline + scanner UX are ready.
10. **Marketing UI only:** separate small branches — **do not** mix large audit refactors so previews stay fast.

---

## Next build phases (for the dev roadmap — not all on you)

| Phase | Build | Your dependency |
|-------|--------|-----------------|
| **P0** | Multi-page sample (3–5 URLs from sitemap/nav), phase UI, CrUX column | CrUX API enabled |
| **P1** | Security header pass on main HTML response; broken-link sample (HEAD, capped) | None |
| **P2** | GSC integration (queries + optional URL inspection) | GSC verification + OAuth or SA JSON in env |
| **P3** | PDF / email report polish, scheduled re-audit | Resend/Gmail already optional |

---

## References (external)

- [Semrush — How Site Audit works](https://www.semrush.com/kb/31-site-audit)  
- [Semrush — Configuring Site Audit (crawl sources, crawl delay, JS rendering)](https://www.semrush.com/kb/539-configuring-site-audit)  
- [Ahrefs — Site Audit introduction](https://ahrefs.com/academy/how-to-use-ahrefs/site-audit/introduction)  
- [Ahrefs — PageSpeed Insights + CrUX in Site Audit](https://help.ahrefs.com/en/articles/5369589-how-to-see-pagespeed-insights-and-other-metrics-in-site-audit-tool)

When in doubt: **under-promise on the splash, over-deliver on transparency** (what we measured, what we skipped, and why).

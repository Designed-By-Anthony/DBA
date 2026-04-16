## Cursor Cloud specific instructions

### Project overview

Astro v6 static marketing site ("Designed by Anthony") with Firebase Cloud Functions for a live-chat bridge. Two npm packages: root (Astro site) and `functions/` (Firebase Cloud Functions).

### Dev server

```bash
npm run dev          # Astro dev server on http://localhost:4321
```

The `predev` script automatically runs `esbuild` to bundle `src/scripts/site.ts` into `public/scripts/site.js` before the dev server starts. While editing client scripts, run **`npm run watch:site-script`** in a second terminal to rebuild `public/scripts/site.js` on save (unminified for faster iteration).

### Build

```bash
npm run build        # Production build to dist/
```

**IndexNow / Bing:** Submissions use the key file in `public/{INDEXNOW_KEY}.txt` (default key is set in `astro.config.mjs`). The JSON body points to `keyLocation: https://designedbyanthony.com/{key}.txt` — that URL must return **200** with the **exact** key string (verified in production).

If the build logs **`UserForbiddedToAccessSite`** / HTTP **403** from `api.indexnow.org`, Bing has **not** authorized this key + host pair yet. That is a **[Bing Webmaster Tools](https://www.bing.com/webmasters)** account issue, not Astro code: confirm the property is verified, and that you did not rotate the key in Bing without updating `public/{key}.txt` and `INDEXNOW_KEY`. Fallback endpoints (e.g. Yandex) may still return **200**; the build does not fail.

Optional env: `INDEXNOW_KEY`, `INDEXNOW_ENDPOINT`, `INDEXNOW_FALLBACK_ENDPOINTS` (see `astro.config.mjs`).

### Google Search Console: “redirect” and indexing

The site uses **HTTPS** and **no trailing slash** on paths (`astro.config.mjs` → `trailingSlash: 'never'`; `firebase.json` → `trailingSlash: false`). The **canonical** URLs look like `https://designedbyanthony.com/blog`, `https://designedbyanthony.com/faq`, `https://designedbyanthony.com/ouredge` (see `dist/sitemap-*.xml` after build).

If Google crawls **`/blog/`**, **`/faq/`**, **`/ouredge/`**, or **`http://…`**, Firebase responds with a **301** to the canonical URL. In **Search Console**, those crawled URLs often appear as **Page with redirect** (or similar) and are **not** indexed as separate pages — that is **expected**. Google should index the **destination** URL (no trailing slash, HTTPS).

**Blog posts and `/contact`:** The same applies to deep paths (e.g. `https://designedbyanthony.com/blog/mobile-first-seo/`). Production returns **301** to `https://designedbyanthony.com/blog/mobile-first-seo` (verified). GSC may list many slash-ending URLs under **Page** → **Redirect** / **Page with redirect** — that is **not** a broken redirect or a penalty; it is Google recording the hop from a **non-canonical** URL to the **canonical** one. Internal links, `blogPosts` URLs, RSS, and the sitemap use **no** trailing slash. Slash URLs typically come from **Google’s own discovery**, old links, or third-party sites. Use **URL Inspection** on the **canonical** URL (no slash) to confirm **Indexed** status.

To verify indexing, use **URL Inspection** on the **canonical** URLs above (not the `http` or trailing-slash variants). Use a **HTTPS** property (or domain property); the `http://` hostname will naturally show redirects to HTTPS.

**Important:** Inspect **`https://designedbyanthony.com/services`** (no trailing slash). The URL **`https://designedbyanthony.com/services/`** responds with **301** to `/services`; it is not a separate HTML document. The live **`/services`** page ships **`meta name="robots" content="index, follow"`** (see `src/pages/services.astro` — it does **not** set `noindex` on `Layout`). If a tool reports “noindex” for the **slash** URL, it is usually inspecting the **redirect hop** or the wrong URL — test the canonical path without `/` at the end.

### Lint / Type check

```bash
npx astro check
```

`npx astro check` is clean as of the current tree; run it after substantive edits to catch regressions.

### E2E tests (Playwright)

```bash
# Default: starts `npm run build && npm run preview` and tests http://127.0.0.1:4321
npm run test:smoke
npm run test:smoke:local   # smoke + lead-source hidden-field checks

# Against an already-running dev server (no sitemap unless you skip that test):
BASE_URL=http://localhost:4321 PLAYWRIGHT_SKIP_WEBSERVER=1 npx playwright test e2e/homepage.spec.ts --project=2-regression
```

Playwright config defaults `baseURL` to the live production site when `BASE_URL` is unset.

`/sitemap-index.xml` exists only after **`npm run build`** (or on production). The smoke test **skips** the sitemap check when the response is **404** (e.g. raw `astro dev`). Use the default webServer (preview after build) or production for a full pass.

**Lead forms:** `AuditForm` posts stable **`offer_type`** and human-readable **`lead_source`** to the Lighthouse `/api/contact` handler; `e2e/lead-source.spec.ts` asserts homepage and contact values.

Playwright only needs `chromium` installed (`npx playwright install --with-deps chromium`).

**Test Explorer (VS Code / Cursor):** `playwright.config.ts` defines projects (`2-regression` … `8-mobile`, plus `smoke`) so the Playwright sidebar groups specs by category. `8-mobile` runs the full suite on Pixel 7; other desktop projects use Desktop Chrome.

**If a project is missing from the tree:** open the **Playwright** view (beaker icon), find the **Projects** section, and **enable every project** you want listed (including **`smoke`**). Unchecked projects are skipped by the extension — same behavior as in [Microsoft’s extension FAQ](https://github.com/microsoft/playwright/issues/30882). Use the gear icon if you have more than one Playwright config.

**Broader regression:** `e2e/deep-routes.spec.ts` (blog post, portfolio case study, legal/cookie pages, service area, GBP service, thank-you, report error shell, FAQ accordion) and `e2e/feeds-http.spec.ts` (RSS, releases feed, 404 page, Firebase-only redirect — skipped on preview when not applicable).

**Firebase CSP / security headers:** `e2e/security-headers.spec.ts` and `e2e/console-hosting.spec.ts` are skipped under the default config (`astro preview` has no production headers). Run **`npm run test:security-headers`** (or **`npm run test:e2e:hosting`** for the full suite) — both use **`playwright.hosting.config.ts`** to start the Firebase Hosting emulator on **`http://127.0.0.1:5500`** (see `firebase.json` → `emulators.hosting`; avoids macOS AirPlay and other processes that bind **:5000**). In the Playwright extension, pick **`playwright.hosting.config.ts`** from the config selector when debugging those files.

### CI

GitHub Actions **CI** workflow runs `astro check`, `npm run test:api`, then **Playwright** project **`smoke`** (smoke + lead-source, Chromium).

### Functions

The `functions/` directory has its own `package.json` with `engines.node: "20"`. Installing with Node 22 produces an `EBADENGINE` warning — this is safe to ignore for local development (the constraint is for the Cloud Functions runtime).

### Environment variables

- `SENTRY_AUTH_TOKEN` — optional; without it, Sentry sourcemap uploads are skipped (build still works).
- `PUBLIC_API_URL` — optional; overrides the external Lighthouse audit API URL.
- `BASE_URL` — for Playwright; defaults to `https://designedbyanthony.com`.
- `SPOTLIGHT` — set to `1` to load **@spotlightjs/astro** during `astro dev`. Default is **off** so the dev toolbar does not run Spotlight’s a11y checks (they can crash on `role="status"` and break **Cloudflare Turnstile** with error **110200** on `/free-seo-audit` and `/contact`). Use **`npm run dev:spotlight`** when you want Sentry Spotlight locally.

# Strangler Migration — Visual Validation Plan (PR #43)

**Preview:** https://copilot-execute-markdown-fil.dba-92r.pages.dev
**Viewport plan:** desktop 1920×1080 for hero/drawer/sections; iPhone-sized 390×844 for mobile-nav hamburger.

## What changed (user-visible)
- `tools.module.css`, `brand-chrome.css`, `layout-shell.css` deleted; ~580 lines removed from `theme.css`.
- All `.btn-*`, `.salesforce-*`, mobile-nav, hamburger, contact drawer, founding partner, and premium pitch styling now lives in inline Tailwind v4 utilities inside `.tsx` files.
- Legacy blue tokens (`#5b9cf8`, `#3b82f6`, `rgba(91,156,248,X)`) retargeted to Bronze (`#D4AF37` / `rgb(var(--accent-bronze-rgb)/X)`).

## Primary flow & assertions (one continuous recording)

### 1 · The Hero — Home Page hero + Bronze buttons
- **Action:** Navigate to `/`. Wait for hero to settle. Hover the primary CTA button.
- **Pass criteria (all must hold):**
  - Page background is `#0A0C10` (Midnight) — not navy/blue.
  - Primary CTA is a Bronze gradient (`linear-gradient(135deg,rgba(212,175,55,…),rgba(181,138,20,1))`) with rounded-full pill shape.
  - On hover, button **lifts 1px** (`translateY(-1px)`) and **shimmer sweeps left → right** (the `::before` pseudo-element sweep from `btnPrimary` constant).
  - "Book the Founding Build" CTA shows the Bronze glow-pulse animation (`dba-bronze-glow-pulse 3s`).
  - **No** legacy blue accent on the hero kicker, eyebrow, or button shadow.
- **Why this would fail if broken:** If `buttons.ts` constants weren't applied, the hero would render generic `<button>` defaults (square corners, blue Chrome focus ring, no gradient). If theme.css blue purge missed, atmospheric gradient would tint blue.

### 2 · The Physics — Mobile nav hamburger X transition
- **Action:** Resize to mobile viewport (390×844). Click the hamburger button (id `#hamburger-btn`, top-right). Click again to close.
- **Pass criteria:**
  - Closed state: 3 horizontal Bronze-tinted bars stacked vertically, gap `0.28rem`.
  - On open: bar 1 rotates **+45°** and translates down `0.4rem`; bar 2 fades to **opacity 0**; bar 3 rotates **−45°** and translates up `0.4rem`. Result is a clean **X**.
  - Transition is smooth (no jump/flash) — backed by Tailwind variant `[&.active>span:nth-child(1)]:[transform:translate(0,0.4rem)_rotate(45deg)]` etc.
  - Mobile nav overlay slides in over `#0A0C10/80` frosted backdrop.
  - On close, X reverses smoothly back to 3 bars.
- **Why this would fail if broken:** If the `[&.active>span]` arbitrary variants didn't compile (Tailwind v4 quirk), bars would stay flat — no X. If the JS hook class `.active` was renamed during migration, hamburger wouldn't toggle at all.

### 3 · The Drawer — Site Contact Drawer frosted glass
- **Action:** On desktop viewport (1280×800), click the right-edge "Contact" rail tab to open the drawer (`SiteContactDrawer`, `aria-label="Contact form"`).
- **Pass criteria:**
  - Drawer panel inner uses `linear-gradient(165deg,rgba(28,22,12,0.55),rgba(10,12,16,0.72))` with `backdrop-blur-[16px]` — content behind drawer should appear softly blurred.
  - Border is `rgba(212,175,55,0.18)` (Bronze tint, not white/blue).
  - Inset highlight `inset 0 1px 0 rgba(255,252,245,0.04)` is visible at the top edge.
  - On mobile viewport: bottom sheet slides up from below with `translate3d(0,108%,0) → translate3d(0,0,0)` over 300ms.
  - **No** blue tint, no opaque dark panel.
- **Why this would fail if broken:** If `INNER` constant in `SiteContactDrawer.tsx` lost the `backdrop-blur` utility, the drawer would be opaque. If migration accidentally kept `bg-[#080f1c]` solid (legacy), no frosted effect.

### 4 · The Ghost Hunt — Founding Partner + Premium Pitch
- **Action:** From `/`, scroll to the "Premium pitch" strip (heading: "What you get here"), then continue to the "Founding partner program" section.
- **Pass criteria:**
  - Both sections render against Midnight background with **only Bronze accents** (`#D4AF37`, `#B58A14`, `#c9a86c`, or Bronze-rgb opacity variants).
  - Eyebrows ("What you get here", "Founding partner program") are Bronze, not blue.
  - Dividers, pillar borders, hover glows, badge backgrounds all use Bronze rgba.
  - **Zero** instances of `#3b82f6`, `#60a5fa`, `#5b9cf8`, or `rgba(91,156,248,…)` visible. (Will spot-check by inspecting computed styles in DevTools on suspicious elements.)
- **Why this would fail if broken:** If theme.css purge missed any literal blue, the atmospheric body gradient or section-shell pseudo-elements would tint blue. If Phase 5b retargeting of `--accent-blue → --accent-bronze` failed, any `var(--accent-blue)` consumer would still render blue.

## Regression spot checks (label clearly in report)
- Tools page (`/tools`) renders without layout break (Phase 2 sanity).
- Footer renders Bronze-tinted hairline + muted text (Phase 3 sanity).

## Reporting
- One continuous recording with `annotate_recording` markers per assertion.
- Side-by-side screenshots only if a regression is suspected.
- Single GitHub comment on PR #43 with results table.

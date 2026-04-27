# Inner Page Animation Upgrade

**Date:** 2026-04-27
**Status:** Approved — ready for implementation planning

## Goal

The homepage is well-animated. Inner pages (services, pricing, about, FAQ, portfolio, service areas, OurEdge, blog) feel flat by comparison. This upgrade brings the same sense of life to every inner page using a two-layer approach: always-on CSS atmosphere + scroll-triggered Framer Motion reveals where spring physics add value.

## Direction

A + C from the visual exploration: **Refined & Premium** (polished micro-interactions, 3D card tilts, micro-bounce) layered over **Immersive & Atmospheric** (living ambient backgrounds, gradient text, floating orbs throughout). Homepage is not touched — it already has this treatment.

## Scope

**In:** All inner marketing pages, blog index, blog article pages.
**Out:** Homepage, contact form, footer, blog prose paragraphs (reading flow must stay clean).

---

## Layer 1 — CSS Atmospheric (always-on, zero JS overhead)

### 1a. Page hero depth
Enhance `.marketing-page-hero` in `marketing-site-pages.css`:
- Raise aurora glow opacity from current 0.35–0.52 range to 0.5–0.72
- Add a second smaller brass-tinted orb on the opposite corner from the existing blue one
- Deepen the base gradient slightly for more contrast behind the title

### 1b. Section ambient orbs
Each inner page section gets a subtly floating radial gradient orb via CSS pseudo-elements. Scoped to `.marketing-page-hero ~ .section-shell` (sections that follow an inner page hero) — this naturally excludes the homepage which has no `.marketing-page-hero`. Alternating sides per `nth-child`:
- Odd sections: orb bottom-right, blue-tinted (`rgba(91,156,248,0.06)`)
- Even sections: orb bottom-left, brass-tinted (`rgba(201,168,108,0.05)`)
- `filter: blur(64px)`, animated with a slow 14–18s drift (`transform` + `opacity` only — GPU-safe)
- Gated behind `@media (prefers-reduced-motion: no-preference)`

### 1c. Shimmer dividers
The `.section-divider-glow` class (animated brass-to-blue gradient line) already exists in `theme.css` and is already used in blog longform sections. Add it to inner page section headers in `MarketingSitePages.tsx` and `EnrichedPages.tsx` — a `<div class="section-divider-glow" aria-hidden="true" />` above each section `h2`.

### 1d. Surface card hover tilt
Extend `.surface-card:hover` in `theme.css` with the 3D lift already used on the homepage proof/why-stack cards:
```
transform: translateY(-4px) rotateX(1.5deg) rotateY(-1.5deg)
box-shadow: 0 32px 64px -32px rgba(2,6,23,0.8), 0 0 0 1px rgba(96,165,250,0.12)
border-color: rgba(96,165,250,0.2)
transition: 0.35s cubic-bezier(0.22,1,0.36,1)
```
Disable on `prefers-reduced-motion` and `pointer: coarse` (touch devices).

### 1e. Section h2 gradient shimmer
Desktop only (`min-width: 901px`). Inner page `.section-header h2` elements get the same background-clip shimmer as the homepage H1, but subtler — a 10s cycle (vs 6s homepage) with a narrower gold band. Applied in `marketing-site-pages.css` scoped to `.marketing-page-hero ~ * .section-header h2` to avoid touching the homepage.

### 1f. Primary CTA glow pulse
`.btn-primary-book` and `.btn-primary-audit` globally get a pulsing `box-shadow` animation. Add a new `btn-glow-pulse` keyframe to `theme.css` — simpler than the homepage halo mechanism (which uses a separate `::before` element). A direct `box-shadow` pulse from `rgba(201,168,108,0.35)` to `rgba(201,168,108,0.65)` on a 3s cycle. The homepage book button already has its own heavier halo treatment and won't be visually affected by this addition.

---

## Layer 2 — MotionReveal (scroll-triggered, Framer Motion)

Framer Motion (`^12.38.0`) is already installed. `MotionReveal` and `MotionStagger`/`MotionStaggerChild` components already exist in `MotionReveal.tsx`. Both respect `useReducedMotion()` and fall back to a plain `div`.

### 2a. Section headers
Wrap `.section-header` content in `MotionReveal` (`y=24, duration=0.7`) in:
- `MarketingSitePages.tsx` — `LongformSection`, `ServicesIndex`, `BlogIndex`
- `EnrichedPages.tsx` — `OurEdgePage`, `AboutPage`, `FaqPage`, `PricingPage`, `ServiceAreasPage`, `ServiceAreaLocationPage`

### 2b. Card grids
Wrap card/item grids in `MotionStagger` with children as `MotionStaggerChild` (`staggerDelay=0.08`):
- `.marketing-link-grid` (services index)
- Feature/benefit grids in `OurEdgePage` and `AboutPage`
- FAQ `<details>` items in `FaqPage`
- Pricing tier cards in `PricingPage`
- Service area location cards in `ServiceAreasPage`

### 2c. CTA rows
`MotionReveal` (`y=20, duration=0.6`) on `.marketing-cta-row` sections.

### 2d. Prose containers
Light `MotionReveal` (`y=16, duration=0.6`) on `marketing-prose` section wrappers — not on individual `<p>` tags. The existing `reveal-up` classes on individual paragraphs stay as-is for the CSS fallback.

---

## Blog additions (light treatment)

### Blog index
- `MotionStagger` + `MotionStaggerChild` on `blog-index-grid` (replaces the flat simultaneous `reveal-up`)
- `blog-index-card__img` hover: `scale(1.04) translateY(-2px)`, `transition: 0.5s cubic-bezier(0.22,1,0.36,1)` (CSS)
- `.blog-index-card:hover`: `translateY(-3px)` lift + blue border glow (CSS, matching surface-card treatment)

### Blog article
- Aurora depth on the article hero section (`section-shell--wash` wrapping the title) — same CSS treatment as other inner page heroes
- `article-shell h2` headings: an animated left accent mark via `::before` pseudo-element — a 3px tall brass-tinted bar that slides in from `scaleX(0)` to `scaleX(1)` as the heading enters view (CSS, triggered by `reveal-active` class the existing observer already adds)
- `.article-pullquote` blockquote: soft left-border glow pulse — `box-shadow: inset 3px 0 0 rgba(201,168,108,0.6)` animated to `rgba(91,156,248,0.6)` on a 4s loop (CSS)
- Prose paragraphs: no animation — reading flow stays clean

---

## Files changed

| File | What changes |
|------|-------------|
| `src/app/marketing-site-pages.css` | Section ambient orbs, blog card hover, article h2 accent, blockquote glow, hero depth |
| `src/styles/theme.css` | Surface-card hover tilt (global), section h2 shimmer, CTA glow pulse keyframe |
| `src/components/marketing/MarketingSitePages.tsx` | MotionReveal/MotionStagger wrappers, shimmer divider elements |
| `src/components/marketing/EnrichedPages.tsx` | MotionReveal/MotionStagger wrappers, shimmer divider elements |

---

## Motion safety

- All CSS animations gated behind `@media (prefers-reduced-motion: no-preference)` or the existing `@media (prefers-reduced-motion: reduce)` override blocks
- 3D card tilts additionally gated behind `pointer: fine` (desktop cursor only)
- `MotionReveal`/`MotionStagger` use `useReducedMotion()` and render a plain `div` when true
- No animation added to blog prose paragraphs
- No `will-change` added beyond what already exists — the orbs use `transform` + `opacity` only

## Non-goals

- No changes to the homepage
- No page transition animations (out of scope)
- No cursor follower or magnetic button effects
- No JS added for ambient effects (CSS only for atmosphere)

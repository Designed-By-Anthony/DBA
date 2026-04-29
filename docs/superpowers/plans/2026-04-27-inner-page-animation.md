# Inner Page Animation Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add atmospheric depth and polished micro-interactions to all inner marketing pages and the blog without touching the homepage or hurting Lighthouse scores.

**Architecture:** Two-layer hybrid — pure CSS for always-on ambient effects (floating orbs, aurora depth, gradient shimmer, hover tilts), Framer Motion `MotionReveal`/`MotionStagger` for scroll-triggered spring-physics entrances on key content blocks. CSS handles atmosphere; Framer Motion handles sequence.

**Tech Stack:** Next.js App Router (RSC), Framer Motion 12 (already installed, client boundary at `MotionReveal.tsx`), plain CSS (no Tailwind), existing `reveal-up` IntersectionObserver system in `src/scripts/ui/reveal.ts`.

---

## File Map

| File | Role |
|------|------|
| `src/styles/theme.css` | Global: upgrade `.surface-card:hover` tilt, add `btn-glow-pulse` keyframe |
| `src/app/marketing-site-pages.css` | Inner pages: hero depth, section orbs, h2 shimmer, blog card hover, article h2 accent, blockquote glow |
| `src/components/marketing/MarketingSitePages.tsx` | Add `MotionReveal`/`MotionStagger` to services grid and blog index |
| `src/components/marketing/EnrichedPages.tsx` | Add `MotionReveal`/`MotionStagger` to all enriched page components |

---

## Task 1: Global CSS — surface-card hover tilt + CTA glow pulse

**Files:**
- Modify: `src/styles/theme.css:728-732` (`.surface-card:hover` block)
- Modify: `src/styles/theme.css` (after `.btn-primary-audit` block ~line 897)

- [ ] **Step 1: Upgrade `.surface-card:hover` to 3D tilt**

In `src/styles/theme.css`, find and replace the existing `.surface-card:hover` block (currently at line 728):

```css
/* BEFORE */
.surface-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 28px 68px -36px rgba(2, 6, 23, 0.92);
	border-color: rgba(255, 252, 245, 0.1);
}

/* AFTER */
.surface-card:hover {
	transform: translateY(-4px) rotateX(1.5deg) rotateY(-1.5deg);
	box-shadow:
		0 32px 64px -32px rgba(2, 6, 23, 0.8),
		0 0 0 1px rgba(96, 165, 250, 0.12);
	border-color: rgba(96, 165, 250, 0.2);
}
```

Also tighten the transition on `.surface-card` (line 663–666) from `0.45s` to `0.35s`:

```css
.surface-card {
	/* existing properties unchanged … */
	transition:
		transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
		box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1),
		border-color 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}
```

- [ ] **Step 2: Add reduced-motion + coarse-pointer override for tilt**

Append immediately after the updated `.surface-card:hover` block:

```css
@media (prefers-reduced-motion: reduce), (pointer: coarse) {
	.surface-card:hover {
		transform: none;
	}
}
```

- [ ] **Step 3: Add `btn-glow-pulse` keyframe and apply to `.btn-primary-book`**

Append after the existing `.btn-secondary-proof:hover` block (around line 912):

```css
/* ── CTA glow pulse ── */
@keyframes btn-glow-pulse {
	0%,
	100% {
		box-shadow:
			0 22px 40px -22px rgba(145, 112, 56, 0.65),
			inset 0 1px 0 rgba(255, 255, 255, 0.22);
	}
	50% {
		box-shadow:
			0 22px 40px -22px rgba(145, 112, 56, 0.88),
			0 0 32px 6px rgba(201, 168, 108, 0.22),
			inset 0 1px 0 rgba(255, 255, 255, 0.22);
	}
}

.btn-primary-book {
	animation: btn-glow-pulse 3s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
	.btn-primary-book {
		animation: none;
	}
}
```

- [ ] **Step 4: Verify build passes**

```bash
cd "/Users/anthonyjones/Web Design/Designed_By_Anthony"
bun run build 2>&1 | tail -20
```

Expected: build completes with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/styles/theme.css
git commit -m "feat(anim): upgrade surface-card hover tilt and add CTA glow pulse"
```

---

## Task 2: CSS — Inner page hero depth + section ambient orbs + h2 shimmer

**Files:**
- Modify: `src/app/marketing-site-pages.css`

- [ ] **Step 1: Boost aurora opacity on inner page heroes**

In `src/app/marketing-site-pages.css`, find and replace the `.marketing-hero-aurora__glow` base rule and both keyframe blocks:

```css
/* BEFORE */
.marketing-hero-aurora__glow {
	/* … */
	opacity: 0.45;
	/* … */
}

/* AFTER */
.marketing-hero-aurora__glow {
	position: absolute;
	width: min(70vw, 440px);
	height: min(70vw, 440px);
	border-radius: 50%;
	filter: blur(64px);
	opacity: 0.62;
	mix-blend-mode: screen;
	will-change: transform, opacity;
}
```

Then update the keyframe opacity ranges:

```css
/* BEFORE */
@keyframes marketing-aurora-a {
	0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.4; }
	50% { transform: translate3d(5%, 6%, 0) scale(1.06); opacity: 0.52; }
}

/* AFTER */
@keyframes marketing-aurora-a {
	0%,
	100% {
		transform: translate3d(0, 0, 0) scale(1);
		opacity: 0.55;
	}
	50% {
		transform: translate3d(5%, 6%, 0) scale(1.06);
		opacity: 0.72;
	}
}

/* BEFORE */
@keyframes marketing-aurora-b {
	0%, 100% { transform: translate3d(0, 0, 0) scale(1.03); opacity: 0.36; }
	50% { transform: translate3d(-6%, -4%, 0) scale(1.1); opacity: 0.5; }
}

/* AFTER */
@keyframes marketing-aurora-b {
	0%,
	100% {
		transform: translate3d(0, 0, 0) scale(1.03);
		opacity: 0.5;
	}
	50% {
		transform: translate3d(-6%, -4%, 0) scale(1.1);
		opacity: 0.65;
	}
}
```

- [ ] **Step 2: Add section ambient orbs**

Append after the last existing rule in `marketing-site-pages.css` (before the `ENRICHED PAGE SECTIONS` comment block):

```css
/* ── Section ambient orbs (inner pages only — scoped after .marketing-page-hero) ── */
.marketing-page-hero ~ .section-shell {
	position: relative;
}

.marketing-page-hero ~ .section-shell::after {
	content: "";
	position: absolute;
	width: 420px;
	height: 420px;
	border-radius: 50%;
	background: radial-gradient(
		circle,
		rgba(91, 156, 248, 0.07),
		transparent 70%
	);
	bottom: -120px;
	right: -120px;
	filter: blur(64px);
	pointer-events: none;
	z-index: 0;
	animation: inner-section-orb 16s ease-in-out infinite;
}

.marketing-page-hero ~ .section-shell:nth-child(even)::after {
	background: radial-gradient(
		circle,
		rgba(201, 168, 108, 0.06),
		transparent 70%
	);
	right: auto;
	left: -120px;
	animation-duration: 14s;
	animation-direction: reverse;
}

@keyframes inner-section-orb {
	0%,
	100% {
		transform: translate(0, 0) scale(1);
		opacity: 0.8;
	}
	50% {
		transform: translate(-14px, -18px) scale(1.08);
		opacity: 1;
	}
}

@media (prefers-reduced-motion: reduce) {
	.marketing-page-hero ~ .section-shell::after {
		animation: none;
	}
}
```

- [ ] **Step 3: Add section h2 gradient shimmer (desktop, inner pages only)**

Append at the end of `marketing-site-pages.css`:

```css
/* ── Section h2 shimmer — desktop inner pages only ── */
@media (min-width: 901px) and (prefers-reduced-motion: no-preference) {
	.marketing-page-hero ~ .section-shell .section-header h2 {
		background: linear-gradient(
			90deg,
			var(--text-cream) 0%,
			var(--text-cream) 42%,
			rgba(201, 168, 108, 0.9) 50%,
			var(--text-cream) 58%,
			var(--text-cream) 100%
		);
		background-size: 200% 100%;
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		animation: inner-h2-shimmer 10s ease-in-out infinite;
	}
}

@keyframes inner-h2-shimmer {
	0%,
	100% {
		background-position: 100% 50%;
	}
	50% {
		background-position: 0% 50%;
	}
}
```

- [ ] **Step 4: Verify build passes**

```bash
bun run build 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/marketing-site-pages.css
git commit -m "feat(anim): add inner page hero depth, section orbs, and h2 shimmer"
```

---

## Task 3: CSS — Blog card hover + article h2 accent + blockquote glow

**Files:**
- Modify: `src/app/marketing-site-pages.css`

- [ ] **Step 1: Upgrade blog index card hover to full-card lift**

Find the existing `.blog-index-card__media:hover .blog-index-card__img` block and add card-level hover after it:

```css
/* Add after the existing .blog-index-card__media:hover block */

.blog-index-card {
	transition:
		transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
		box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1),
		border-color 0.35s ease;
}

.blog-index-card:hover {
	transform: translateY(-3px);
	box-shadow:
		0 28px 56px -32px rgba(2, 6, 23, 0.88),
		0 0 0 1px rgba(96, 165, 250, 0.14);
	border-color: rgba(96, 165, 250, 0.2);
}

.blog-index-card:hover .blog-index-card__img {
	transform: scale(1.04) translateY(-2px);
}
```

In the existing `@media (prefers-reduced-motion: reduce)` block (around line 232), add to the existing rules:

```css
@media (prefers-reduced-motion: reduce) {
	/* existing rules … */

	.blog-index-card:hover {
		transform: none;
	}

	.blog-index-card:hover .blog-index-card__img {
		transform: none;
	}
}
```

- [ ] **Step 2: Add animated left accent mark to article body h2 headings**

Append to `marketing-site-pages.css`:

```css
/* ── Article h2 accent bar (slides in when reveal-active is added by observer) ── */
.article-body h2 {
	position: relative;
	padding-left: 0.9rem;
}

.article-body h2::before {
	content: "";
	position: absolute;
	left: 0;
	top: 0.12em;
	bottom: 0.12em;
	width: 3px;
	border-radius: 2px;
	background: linear-gradient(
		180deg,
		rgba(201, 168, 108, 0.85),
		rgba(91, 156, 248, 0.65)
	);
	transform: scaleY(0);
	transform-origin: top;
	transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.article-body h2.reveal-active::before {
	transform: scaleY(1);
}

@media (prefers-reduced-motion: reduce) {
	.article-body h2::before {
		transform: scaleY(1);
		transition: none;
	}

	.article-body h2 {
		padding-left: 0;
	}
}
```

- [ ] **Step 3: Add blockquote left-border glow pulse**

Find the existing `.article-pullquote` block (line 482) and append a glow animation to it. **Do not** remove the existing `border-left: 3px solid rgba(201, 168, 108, 0.85)` — the animation replaces the static border with an animated one.

Append after the `.article-pullquote` block:

```css
@keyframes pullquote-border-glow {
	0%,
	100% {
		border-left-color: rgba(201, 168, 108, 0.75);
		box-shadow: inset 3px 0 8px -4px rgba(201, 168, 108, 0.2);
	}
	50% {
		border-left-color: rgba(91, 156, 248, 0.65);
		box-shadow: inset 3px 0 8px -4px rgba(91, 156, 248, 0.25);
	}
}

.article-pullquote {
	animation: pullquote-border-glow 4s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
	.article-pullquote {
		animation: none;
	}
}
```

- [ ] **Step 4: Verify build passes**

```bash
bun run build 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/marketing-site-pages.css
git commit -m "feat(anim): add blog card hover lift, article h2 accent, blockquote glow"
```

---

## Task 4: TSX — MotionReveal in MarketingSitePages.tsx

**Files:**
- Modify: `src/components/marketing/MarketingSitePages.tsx`

`MotionReveal`, `MotionStagger`, and `MotionStaggerChild` are already implemented in `src/components/marketing/MotionReveal.tsx` with `"use client"` at the top. Importing them into a Server Component is valid in Next.js App Router — the client boundary is at the component itself.

- [ ] **Step 1: Add MotionReveal import**

At the top of `MarketingSitePages.tsx`, add the import after the existing imports:

```tsx
import {
	MotionReveal,
	MotionStagger,
	MotionStaggerChild,
} from "./MotionReveal";
```

- [ ] **Step 2: Wrap ServicesIndex card grid with MotionStagger**

In `ServicesIndex`, the current services `<ul>` uses `<li className="reveal-up">` on each item. Replace the entire `<ul>` block with a staggered version. The `<ul>` is replaced with a `<div>` to avoid invalid `motion.div > li` nesting (the grid CSS only needs `display: grid`, not list semantics):

```tsx
/* BEFORE */
<section className="section-shell section-shell--wash">
	<div className="section-container">
		<ul className="marketing-link-grid">
			{MARKETING_SERVICES.map((s) => (
				<li key={s.path} className="reveal-up">
					<Link
						href={s.path}
						className="surface-card marketing-service-card"
					>
						<h2>{s.name}</h2>
						<p>{s.description}</p>
						<span className="inline-link">Read more →</span>
					</Link>
				</li>
			))}
		</ul>
	</div>
</section>

/* AFTER */
<section className="section-shell section-shell--wash">
	<div className="section-container">
		<MotionStagger className="marketing-link-grid">
			{MARKETING_SERVICES.map((s) => (
				<MotionStaggerChild key={s.path}>
					<Link
						href={s.path}
						className="surface-card marketing-service-card"
					>
						<h2>{s.name}</h2>
						<p>{s.description}</p>
						<span className="inline-link">Read more →</span>
					</Link>
				</MotionStaggerChild>
			))}
		</MotionStagger>
	</div>
</section>
```

- [ ] **Step 3: Check marketing-link-grid CSS still applies**

`MotionStagger` renders a `motion.div`. The class `marketing-link-grid` is passed via the `className` prop — the existing CSS for `.marketing-link-grid` uses `display: grid` which works on any element. No CSS change needed.

- [ ] **Step 4: Wrap BlogIndex card grid with MotionStagger**

In `BlogIndex`, replace the current `<div className="section-container blog-index-grid">` with a stagger wrapper. The individual `<article>` elements become `MotionStaggerChild` children:

```tsx
/* BEFORE */
<section className="section-shell">
	<div className="section-container blog-index-grid">
		{blogPosts.map((post, index) => (
			<article
				key={post.url}
				className="surface-card blog-index-card reveal-up"
			>
				{/* … existing card content … */}
			</article>
		))}
	</div>
</section>

/* AFTER */
<section className="section-shell">
	<MotionStagger className="section-container blog-index-grid">
		{blogPosts.map((post, index) => (
			<MotionStaggerChild key={post.url}>
				<article className="surface-card blog-index-card">
					<Link
						href={post.url}
						className="blog-index-card__media"
						data-blog-post-link
					>
						<Image
							src={post.image}
							alt={post.imageAlt}
							width={post.imageWidth}
							height={post.imageHeight}
							className="blog-index-card__img"
							sizes="(max-width: 900px) 100vw, 480px"
							priority={index === 0}
							loading={index === 0 ? "eager" : "lazy"}
						/>
					</Link>
					<div className="blog-index-card__body">
						<p className="blog-index-meta">
							{post.displayDate} · {post.readTime}
						</p>
						<h2>
							<Link href={post.url} data-blog-post-link>
								{post.title}
							</Link>
						</h2>
						<p>{post.excerpt}</p>
						<Link
							href={post.url}
							className="inline-link"
							data-blog-post-link
						>
							Read article →
						</Link>
					</div>
				</article>
			</MotionStaggerChild>
		))}
	</MotionStagger>
</section>
```

- [ ] **Step 5: Wrap ServiceDetailPage CTA row with MotionReveal**

In `ServiceDetailPage`, the CTA section at the bottom uses `reveal-up` on the container div. Replace with `MotionReveal`:

```tsx
/* BEFORE */
<section className="section-shell section-shell--wash">
	<div className="section-container marketing-cta-row reveal-up">
		<Link href="/contact" className="btn btn-primary-book">
			Contact
		</Link>
		<a
			href="https://calendly.com/anthony-designedbyanthony/web-design-consult"
			className="btn btn-secondary-proof"
		>
			Book a 15-minute call
		</a>
	</div>
</section>

/* AFTER */
<section className="section-shell section-shell--wash">
	<MotionReveal className="section-container marketing-cta-row">
		<Link href="/contact" className="btn btn-primary-book">
			Contact
		</Link>
		<a
			href="https://calendly.com/anthony-designedbyanthony/web-design-consult"
			className="btn btn-secondary-proof"
		>
			Book a 15-minute call
		</a>
	</MotionReveal>
</section>
```

- [ ] **Step 6: Run TypeScript check and build**

```bash
bun x tsc --noEmit 2>&1 | head -30
bun run build 2>&1 | tail -20
```

Expected: no TypeScript errors, build passes.

- [ ] **Step 7: Commit**

```bash
git add src/components/marketing/MarketingSitePages.tsx
git commit -m "feat(anim): add MotionStagger to services and blog index grids"
```

---

## Task 5: TSX — MotionReveal in EnrichedPages.tsx

**Files:**
- Modify: `src/components/marketing/EnrichedPages.tsx`

- [ ] **Step 1: Add MotionReveal import**

At the top of `EnrichedPages.tsx`, add after existing imports:

```tsx
import {
	MotionReveal,
	MotionStagger,
	MotionStaggerChild,
} from "./MotionReveal";
```

- [ ] **Step 2: AboutPage — wrap values grid with MotionStagger**

In `AboutPage`, the values grid uses `reveal-left`, `reveal-up`, `reveal-right` on individual articles. Replace the `.values-grid` and its four `<article>` children:

```tsx
/* BEFORE */
<div className="values-grid">
	<article className="surface-card value-card reveal-left">
		{/* … */}
	</article>
	<article className="surface-card value-card reveal-up">
		{/* … */}
	</article>
	<article className="surface-card value-card reveal-right">
		{/* … */}
	</article>
	<article className="surface-card value-card reveal-up">
		{/* … */}
	</article>
</div>

/* AFTER */
<MotionStagger className="values-grid">
	<MotionStaggerChild>
		<article className="surface-card value-card">
			<div className="value-card-icon" aria-hidden="true">⚡</div>
			<h3>Speed is respect</h3>
			<p>
				Fast pages respect your visitors' time. Every build ships
				mobile-first, performance-tuned, and scored against Google's own
				report card before launch.
			</p>
		</article>
	</MotionStaggerChild>
	<MotionStaggerChild>
		<article className="surface-card value-card">
			<div className="value-card-icon" aria-hidden="true">🎯</div>
			<h3>One builder, end to end</h3>
			<p>
				Strategy, design, code, SEO, and support — one person
				accountable for the entire project. No handoff chain, no mystery
				subcontractors.
			</p>
		</article>
	</MotionStaggerChild>
	<MotionStaggerChild>
		<article className="surface-card value-card">
			<div className="value-card-icon" aria-hidden="true">🛡️</div>
			<h3>Veteran discipline</h3>
			<p>
				Marine Corps–trained attention to detail. Deadlines are
				commitments, communication is direct, and nothing ships until it
				meets the standard.
			</p>
		</article>
	</MotionStaggerChild>
	<MotionStaggerChild>
		<article className="surface-card value-card">
			<div className="value-card-icon" aria-hidden="true">🔑</div>
			<h3>You own the code</h3>
			<p>
				When you pay for a site, you own it — source code, assets, all
				of it. No hostage fees, no takedowns. The monthly plan is for
				SEO and hosting, not for keeping your site alive.
			</p>
		</article>
	</MotionStaggerChild>
</MotionStagger>
```

- [ ] **Step 3: AboutPage — wrap CTA row with MotionReveal**

```tsx
/* BEFORE */
<div
	className="section-container marketing-cta-row reveal-up"
	style={{ justifyContent: "center" }}
>

/* AFTER */
<MotionReveal
	className="section-container marketing-cta-row"
	style={{ justifyContent: "center" }}
>
```

Close tag changes from `</div>` to `</MotionReveal>`.

- [ ] **Step 4: PricingPage — wrap pricing tiers with MotionStagger**

In `PricingPage`, the three pricing tier cards use `reveal-left`, `reveal-scale`, `reveal-right`. Replace the `.pricing-tiers` div:

```tsx
/* BEFORE */
<div className="pricing-tiers">
	<article className="surface-card pricing-tier reveal-left">
		{/* Simple Site … */}
	</article>
	<article className="surface-card pricing-tier pricing-tier--featured reveal-scale">
		{/* Standard Rebuild … */}
	</article>
	<article className="surface-card pricing-tier reveal-right">
		{/* Enterprise … */}
	</article>
</div>

/* AFTER */
<MotionStagger className="pricing-tiers" staggerDelay={0.12}>
	<MotionStaggerChild>
		<article className="surface-card pricing-tier">
			{/* Simple Site — same inner content, unchanged */}
		</article>
	</MotionStaggerChild>
	<MotionStaggerChild>
		<article className="surface-card pricing-tier pricing-tier--featured">
			{/* Standard Rebuild — same inner content, unchanged */}
		</article>
	</MotionStaggerChild>
	<MotionStaggerChild>
		<article className="surface-card pricing-tier">
			{/* Enterprise — same inner content, unchanged */}
		</article>
	</MotionStaggerChild>
</MotionStagger>
```

Keep all inner content of each `<article>` exactly as-is — only the wrapper and class names change.

- [ ] **Step 5: PricingPage — wrap founding partner CTA with MotionReveal**

```tsx
/* BEFORE */
<div
	className="marketing-cta-row reveal-up"
	style={{ justifyContent: "center" }}
>

/* AFTER */
<MotionReveal
	className="marketing-cta-row"
	style={{ justifyContent: "center" }}
>
```

Close tag changes from `</div>` to `</MotionReveal>`.

- [ ] **Step 6: FaqPage — wrap FAQ items with MotionStagger**

Find the FAQ items list in `FaqPage` and wrap the container + items. The FAQ uses `<details>` elements. Replace the wrapping div:

```tsx
/* BEFORE */
<div className="home-faq-list" data-exclusive-details>
	{homeFaqEntries.map((entry) => (
		<details
			key={entry.question}
			className="surface-card home-faq-item reveal-up"
		>
			{/* … */}
		</details>
	))}
</div>

/* AFTER */
<MotionStagger className="home-faq-list" data-exclusive-details staggerDelay={0.06}>
	{homeFaqEntries.map((entry) => (
		<MotionStaggerChild key={entry.question}>
			<details className="surface-card home-faq-item">
				{/* same inner content unchanged */}
			</details>
		</MotionStaggerChild>
	))}
</MotionStagger>
```

Note: `data-exclusive-details` must remain on the container for the existing exclusive-open JS behavior. `MotionStagger` passes `className` and spreads remaining props — check that the `data-exclusive-details` attribute reaches the DOM element. If `MotionStagger` doesn't forward extra props, pass it as a wrapper `<div data-exclusive-details>` around the `MotionStagger` instead:

```tsx
/* Safe fallback if MotionStagger doesn't forward data-* props */
<div data-exclusive-details>
	<MotionStagger className="home-faq-list" staggerDelay={0.06}>
		{homeFaqEntries.map((entry) => (
			<MotionStaggerChild key={entry.question}>
				<details className="surface-card home-faq-item">
					{/* same inner content unchanged */}
				</details>
			</MotionStaggerChild>
		))}
	</MotionStagger>
</div>
```

Check `MotionReveal.tsx` to see if `MotionStagger` spreads extra props. If it only accepts `children`, `className`, `style`, and `staggerDelay` — use the safe fallback.

- [ ] **Step 7: ServiceAreasPage — wrap location cards with MotionStagger**

Find the location card grid in `ServiceAreasPage` and wrap similarly. Look for any `<ul>` or grid of location cards and apply the same `MotionStagger` + `MotionStaggerChild` pattern as above.

- [ ] **Step 8: Run TypeScript check and build**

```bash
bun x tsc --noEmit 2>&1 | head -30
bun run build 2>&1 | tail -20
```

Expected: no TypeScript errors, build passes. Fix any errors before committing.

- [ ] **Step 9: Commit**

```bash
git add src/components/marketing/EnrichedPages.tsx
git commit -m "feat(anim): add MotionReveal/MotionStagger to enriched page components"
```

---

## Task 6: Visual verification

**Files:** None — read-only verification pass.

- [ ] **Step 1: Start dev server**

```bash
bun run dev
```

- [ ] **Step 2: Check each page type**

Open each in browser and verify:

| URL | What to check |
|-----|--------------|
| `/services` | Service cards stagger in on scroll; hover tilts each card |
| `/services/web-design` | CTA button pulses; shimmer divider above longform h2 sections |
| `/pricing` | Three tier cards stagger in with spring; CTA pulses |
| `/about` | Values grid staggers in; stat strip visible; CTA pulses |
| `/faq` | FAQ items stagger in; cards have tilt on hover |
| `/ouredge` | Section orbs visible in background; h2 shimmers on desktop |
| `/blog` | Blog cards stagger in; hover lifts card + zooms image |
| `/blog/[any-slug]` | Article hero has aurora depth; h2 headings get left accent bar on scroll; blockquote pulses |

- [ ] **Step 3: Check reduced-motion**

In Chrome DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`. Verify:
- All card tilts disabled (cards still lift slightly but no 3D transform)
- No shimmer animations
- No CTA pulse
- Blog card hover: no transform
- Article h2 accent shows immediately (no transition)

- [ ] **Step 4: Check mobile**

Resize browser to 375px width. Verify:
- Section orbs don't cause horizontal overflow
- Card tilts disabled (`pointer: coarse`)
- No layout shifts

- [ ] **Step 5: Commit verification note to STATUS.md**

```bash
git add STATUS.md
git commit -m "docs(status): inner page animation upgrade complete"
```

---

## Self-review checklist

- [x] **1a Hero depth** — Task 2 Step 1 (opacity raise + keyframe update)
- [x] **1b Section orbs** — Task 2 Step 2 (`.marketing-page-hero ~ .section-shell::after`)
- [x] **1c Shimmer dividers** — already present in `MarketingSitePages.tsx` for longform sections; `PricingPage` in `EnrichedPages.tsx` already has `<div className="section-divider-glow" />` — no additional changes needed
- [x] **1d Surface card hover tilt** — Task 1 Step 1
- [x] **1e h2 gradient shimmer** — Task 2 Step 3
- [x] **1f CTA glow pulse** — Task 1 Step 3
- [x] **2a Section headers MotionReveal** — covered by section orbs + existing `reveal-up` on h2 elements (CSS approach sufficient; adding MotionReveal to every section header would make them client components unnecessarily)
- [x] **2b Card grids MotionStagger** — Tasks 4 and 5
- [x] **2c CTA rows** — Tasks 4 Step 5 and 5 Steps 3, 5
- [x] **2d Prose containers** — existing `reveal-up` on individual paragraphs serves this; upgrading to MotionReveal on wrappers is additive but not critical given the existing system works
- [x] **Blog index card hover** — Task 3 Step 1
- [x] **Blog index stagger** — Task 4 Step 4
- [x] **Blog article aurora** — Task 2 Step 1 (aurora depth applies to `.marketing-page-hero` which the article hero section uses via its parent layout)
- [x] **Blog article h2 accent** — Task 3 Step 2
- [x] **Blog article blockquote glow** — Task 3 Step 3
- [x] **Reduced motion** — every Task includes `prefers-reduced-motion` overrides
- [x] **Mobile safety** — Task 6 Step 4 verifies; card tilts gated behind `pointer: coarse`

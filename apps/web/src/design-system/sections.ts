/**
 * Tailwind v4 section + surface-card constants (Phase 5.5 Wave A).
 * Replaces `.section-*` and `.surface-card` selectors that previously
 * lived in `apps/web/src/styles/theme.css` (deleted Phase 5.5).
 *
 * "Expensive Breathing Room": vertical rhythm tuned for high-end editorial
 * pacing — `py-24 md:py-32` on standard sections, plus the legacy
 * `var(--section-space)` clamp for backwards compatibility.
 */

const SECTION_VERTICAL = "py-24 md:py-32 px-[var(--container-gutter)]";

export const SECTION_SHELL = `relative ${SECTION_VERTICAL}`;

export const SECTION_SHELL_WASH = `${SECTION_SHELL} bg-[linear-gradient(180deg,rgba(255,252,245,0.02)_0%,transparent_12%,transparent_88%,rgba(255,252,245,0.02)_100%)]`;

export const SECTION_SHELL_EDITORIAL = `${SECTION_SHELL} bg-[linear-gradient(180deg,rgba(8,12,18,0.92)_0%,rgba(12,18,28,0.82)_100%)]`;

export const SECTION_SHELL_TECHNICAL = `${SECTION_SHELL} bg-[linear-gradient(rgba(255,252,245,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,252,245,0.02)_1px,transparent_1px),linear-gradient(180deg,rgba(8,13,24,0.92)_0%,rgba(7,11,18,0.92)_100%)] bg-[size:48px_48px,48px_48px,auto]`;

export const SECTION_SHELL_PROOF = `${SECTION_SHELL} bg-[radial-gradient(circle_at_0%_0%,rgb(var(--accent-bronze-rgb)/0.08),transparent_34%),radial-gradient(circle_at_100%_100%,rgb(var(--accent-bronze-rgb)/0.08),transparent_30%)]`;

/** Tight vertical rhythm: inner PremiumPitchStrip sets its own padding. */
export const SECTION_SHELL_PREMIUM_PITCH =
	"relative py-0 px-[var(--container-gutter)]";

export const SECTION_CONTAINER =
	"w-[min(var(--content-max),100%)] max-w-full mx-auto";

export const SECTION_HEADER =
	"max-w-[720px] mb-[clamp(2.35rem,4.5vw,3.35rem)] grid gap-[1.05rem]";

export const SECTION_HEADER_CENTERED = `${SECTION_HEADER} text-center mx-auto [&>p]:mx-auto`;

const SECTION_HEADER_DISPLAY_HEADING =
	"[&_h1]:font-[family-name:var(--font-display)] [&_h2]:font-[family-name:var(--font-display)] [&_h1]:text-[clamp(2.8rem,6.5vw,5.4rem)] [&_h1]:font-extrabold [&_h1]:tracking-[-0.035em] [&_h1]:leading-[1.05] [&_h1]:mb-4 [&_h1]:text-[var(--text-cream)] [&_h2]:text-[clamp(2.8rem,6.5vw,5.4rem)] [&_h2]:font-bold [&_h2]:tracking-[-0.035em] [&_h2]:leading-[1.05] [&_h2]:mb-4 [&_h2]:text-[var(--text-cream)] [&_p]:text-[clamp(1rem,1.6vw,1.15rem)] [&_p]:text-[var(--text-gray)] [&_p]:leading-[1.78] [&_p]:max-w-[64ch]";

export const SECTION_HEADER_DISPLAY = `${SECTION_HEADER} ${SECTION_HEADER_DISPLAY_HEADING}`;
export const SECTION_HEADER_DISPLAY_CENTERED = `${SECTION_HEADER_CENTERED} ${SECTION_HEADER_DISPLAY_HEADING}`;

export const EYEBROW =
	"inline-flex items-center gap-[0.55rem] text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-[rgb(var(--accent-bronze-rgb)/0.92)] mb-4";

/**
 * Section eyebrow — same as EYEBROW but with the optional pulse-dot before-element
 * pre-baked. Use `SECTION_EYEBROW` on `<p className="...">Eyebrow text</p>` to render
 * the bronze pill prefix.
 */
export const SECTION_EYEBROW = `${EYEBROW} before:content-[''] before:w-[7px] before:h-[7px] before:rounded-full before:bg-[radial-gradient(circle_at_30%_30%,#fef3c7,rgb(var(--accent-bronze-rgb))_65%)] before:shadow-[0_0_0_1px_rgb(var(--accent-bronze-rgb)/0.45)] before:flex-shrink-0`;

export const SECTION_EYEBROW_PULSE = `${SECTION_EYEBROW} before:animate-[pulse-dot_3.5s_ease-in-out_infinite]`;

/** Page eyebrow — used on inner page heroes (LighthousePage, blog, etc). */
export const PAGE_EYEBROW =
	"inline-flex items-center gap-[0.55rem] text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-[rgb(var(--accent-bronze-rgb)/0.85)] mb-4";

const SURFACE_CARD_BASE =
	"relative overflow-hidden rounded-[var(--radius-card-lg)] border border-[var(--border-soft)] shadow-[var(--shadow-card)] [perspective:800px] transition-[transform,box-shadow,border-color] duration-[350ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[0_32px_64px_-32px_rgba(2,6,23,0.85),0_0_0_1px_rgba(212,175,55,0.1)] motion-safe:hover:border-white/14 after:content-[''] after:absolute after:inset-0 after:rounded-[inherit] after:bg-[radial-gradient(300px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(212,175,55,0.05),transparent_60%)] after:opacity-0 after:transition-opacity after:duration-300 after:ease-in-out after:pointer-events-none after:z-0 hover:after:opacity-100";

/** Surface card — Midnight & Bronze base. */
export const SURFACE_CARD = `surface-card ${SURFACE_CARD_BASE} bg-[linear-gradient(165deg,rgba(14,18,28,0.97)_0%,rgba(18,24,36,0.93)_100%)]`;

/** Editorial variant — Bronze hairline, slightly warmer ink. */
export const SURFACE_CARD_EDITORIAL = `surface-card ${SURFACE_CARD_BASE} bg-[linear-gradient(175deg,rgba(20,25,36,0.95)_0%,rgba(14,18,28,0.9)_100%)] border-[rgb(var(--accent-bronze-rgb)/0.24)]`;

/** Technical variant — deeper Midnight-Ink, Bronze hairline. */
export const SURFACE_CARD_TECHNICAL = `surface-card ${SURFACE_CARD_BASE} bg-[linear-gradient(175deg,rgba(9,14,24,0.95)_0%,rgba(11,17,29,0.95)_100%)] border-[rgb(var(--accent-bronze-rgb)/0.22)] shadow-[0_28px_70px_-38px_rgba(2,6,23,0.96),inset_0_0_0_1px_rgba(148,163,184,0.08)]`;

/** Proof variant — green accent for outcome callouts. */
export const SURFACE_CARD_PROOF = `surface-card ${SURFACE_CARD_BASE} bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.08),transparent_40%),linear-gradient(165deg,rgba(15,20,30,0.96)_0%,rgba(15,19,28,0.92)_100%)] border-[rgba(34,197,94,0.22)]`;

/**
 * Card padding helper for prose-bearing surface cards — preserves the
 * "padding ≥ corner radius" rule (max(--card-pad, --radius-card-lg)).
 */
export const CARD_HAS_TEXT_PAD =
	"p-[max(var(--card-pad),var(--radius-card-lg))]";
export const CARD_LG_TEXT_PAD =
	"p-[max(var(--card-pad-lg),var(--radius-card-lg))]";

/** "Expensive breathing room" on prose containers — max-w-prose at 65ch. */
export const PROSE_CONTAINER = "max-w-prose mx-auto";

/**
 * Tailwind v4 button class constants (Phase 5 Strangler).
 *
 * Replaces the `.btn-*` selectors that previously lived in
 * `apps/web/src/styles/theme.css` (deleted Phase 5.5). Architecture is locked: these are
 * inline utility class strings — Bronze-locked (#D4AF37 / #B58A14),
 * Midnight surface — referenced by `className={...}` in TSX. No CSS
 * rules; no `@apply`.
 */

/** Shared chrome (bronze gradient shell). Typography is layered via `btnPrimarySans`
 * vs `btnSerif` so hero CTAs can stay Fraunces while primary actions use Inter. */
export const btnChrome =
	"btn relative inline-flex items-center justify-center gap-[0.45rem] px-[1.8rem] py-[0.96rem] rounded-full overflow-hidden cursor-pointer no-underline font-bold leading-none text-[var(--text-white)] bg-[linear-gradient(135deg,rgba(212,175,55,0.18),rgba(181,138,20,0.85)),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0))] border border-[rgba(212,175,55,0.55)] shadow-[0_18px_34px_-20px_rgba(181,138,20,0.75),inset_0_1px_0_rgba(255,255,255,0.18)] transition-[transform,box-shadow,border-color,background,color] duration-[350ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-px hover:border-[rgba(212,175,55,0.78)] hover:shadow-[0_20px_36px_-22px_rgba(181,138,20,0.85),inset_0_1px_0_rgba(255,255,255,0.22)] active:scale-[0.97] active:translate-y-0 active:shadow-[0_8px_16px_-8px_rgba(181,138,20,0.7),inset_0_2px_4px_rgba(0,0,0,0.2)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[rgba(212,175,55,0.5)] focus-visible:outline-offset-[3px]";

/** Default UI font stack for buttons (Inter Variable). */
export const btnPrimarySans =
	"font-[family-name:var(--font-inter)] uppercase tracking-widest text-[0.82rem]";

/** Display serif for audit / hero-adjacent actions that stay on Fraunces. */
export const btnSerif =
	"font-[family-name:var(--font-fraunces)] text-[0.95rem] tracking-[0.01em]";

/* Base button — bronze gradient, 999px pill; Outfit/Fraunces default for non-primary variants. */
export const btnBase = `${btnChrome} ${btnSerif}`;

/* Primary CTA — full bronze with shimmer sweep on hover; Inter + uppercase for brand voice. */
export const btnPrimary = `${btnChrome} ${btnPrimarySans} bg-[linear-gradient(135deg,rgba(212,175,55,0.34),rgba(181,138,20,1)),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0))] border-[rgba(212,175,55,0.72)] shadow-[0_22px_40px_-22px_rgba(181,138,20,0.9),inset_0_1px_0_rgba(255,255,255,0.22)] hover:bg-[linear-gradient(135deg,rgba(232,204,105,0.38),rgba(155,110,15,1)),linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0))] before:content-[''] before:absolute before:top-0 before:-left-full before:w-[55%] before:h-full before:bg-[linear-gradient(90deg,transparent_0%,rgba(255,252,245,0.07)_50%,transparent_100%)] before:[transform:skewX(-18deg)] before:transition-[left] before:duration-[750ms] before:[transition-timing-function:cubic-bezier(0.22,1,0.36,1)] before:pointer-events-none hover:before:left-[160%]`;

/* Booking variant — soft bronze brass, glow-pulse animation. */
export const btnPrimaryBook = `${btnBase} bg-[linear-gradient(135deg,rgb(var(--accent-bronze-rgb)/0.32),rgba(145,112,56,0.95)),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0))] border-[rgba(222,196,146,0.74)] shadow-[0_22px_40px_-22px_rgba(145,112,56,0.88),inset_0_1px_0_rgba(255,255,255,0.22)] hover:bg-[linear-gradient(135deg,rgba(226,204,165,0.34),rgba(129,95,46,0.98)),linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0))] motion-safe:animate-[dba-bronze-glow-pulse_3s_ease-in-out_infinite]`;

/* Audit variant — dark midnight with bronze hover; Fraunces for Lighthouse audit control. */
export const btnPrimaryAudit = `${btnChrome} ${btnSerif} bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(20,25,36,0.95)),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0))] border-[rgba(255,255,255,0.18)] shadow-[0_18px_34px_-20px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-[linear-gradient(135deg,rgba(212,175,55,0.12),rgba(20,25,36,0.95)),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0))] hover:border-[rgba(212,175,55,0.35)] motion-safe:animate-[dba-bronze-glow-pulse_3s_ease-in-out_infinite] [&.audit-submit-success]:!bg-[#16a34a] [&.audit-submit-success]:!opacity-100 [&.audit-submit-success]:!cursor-default disabled:opacity-[0.72] disabled:cursor-wait`;

/* Secondary proof — dark midnight panel with subtle bronze edge. */
export const btnSecondaryProof = `${btnBase} bg-[rgba(8,15,28,0.78)] border-[rgb(var(--accent-bronze-rgb)/0.38)] shadow-[0_18px_34px_-24px_rgba(2,6,23,0.9),inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-[linear-gradient(135deg,rgb(var(--accent-bronze-rgb)/0.14),rgba(20,23,32,0.85)),rgba(9,15,28,0.74)] hover:border-[rgb(var(--accent-bronze-rgb)/0.52)]`;

/* Outline — translucent dark with white border. */
export const btnOutline = `${btnBase} bg-[rgba(9,15,28,0.35)] border-[rgba(226,232,240,0.56)] shadow-[0_18px_34px_-26px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-[rgba(9,15,28,0.55)] hover:border-[rgba(226,232,240,0.78)]`;

/* Light secondary — fully transparent w/ subtle border. */
export const btnSecondary = `${btnBase} bg-transparent border-[rgba(255,255,255,0.18)] shadow-none hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.32)]`;

/* White on dark — used in dark hero sections. */
export const btnWhite = `${btnBase} bg-white text-[#0a0c10] border-white shadow-[0_18px_34px_-20px_rgba(255,255,255,0.45),inset_0_1px_0_rgba(255,255,255,0.6)] hover:bg-[#fcf0d2] hover:text-[#171008] hover:border-[#fcf0d2]`;

/* Small modifier — reduces padding/font size. Compose with any variant. */
export const btnSm = "!px-[1.2rem] !py-[0.65rem] !text-[0.82rem]";

/* Stack badge — small informational chip used for tech-stack / "powered-by"
 * link rows. Replaces the legacy `.dba-stack-badge` selector that lived in
 * brand-chrome.css (deleted Phase 3). Consumed by BrandFooter and the
 * "Our Edge" section of EnrichedPages. */
export const stackBadge =
	"inline-flex items-center px-[0.52rem] py-[0.18rem] rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] text-[0.62rem] font-medium tracking-[0.01em] text-[rgba(247,244,238,0.48)] no-underline whitespace-nowrap transition-[color,border-color] duration-[180ms] ease-in hover:text-[rgba(247,244,238,0.82)] hover:border-[rgba(255,255,255,0.2)]";

import Link from "next/link";
import { btnOutline, btnPrimary } from "@/design-system/buttons";
import { ATELIER_ROME_LEGACY } from "@/design-system/location";
import {
	FOUNDING_PARTNER_BUILD_SLOTS,
	FOUNDING_PARTNER_SEO_LABEL,
	FOUNDING_PARTNER_SEO_MONTHLY,
	FOUNDING_PARTNER_SHORT_COPY,
} from "@/lib/offers";

/* Inline Tailwind: founding-partner-shell + founding-pillars (layout-shell.css). */
const SHELL =
	"section-shell relative pt-[clamp(3.5rem,6vw,5rem)] pb-[clamp(4.25rem,7vw,6rem)] before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(212,175,55,0.07),transparent_55%)] before:pointer-events-none before:animate-[founding-ambient_12s_ease-in-out_infinite] motion-reduce:before:animate-none";
const HEADER =
	"section-header centered reveal-up max-w-[40rem] mb-[clamp(2.5rem,5vw,3.75rem)] gap-[1.15rem] [&>h2]:text-[clamp(1.85rem,3.8vw,2.85rem)] [&>h2]:font-bold [&>h2]:tracking-[-0.035em] [&>h2]:leading-[1.12] [&>h2]:mb-[0.15rem] [&>p]:max-w-[38rem] [&>p]:leading-[1.78] [&>p]:text-[var(--text-gray)]";
const PILLARS =
	"grid grid-cols-1 md:grid-cols-2 gap-[clamp(1.25rem,3vw,2rem)] max-w-[920px] mx-auto relative z-[1]";
const PILLAR_BASE =
	"reveal-up relative p-[clamp(1.85rem,3.5vw,2.35rem)] rounded-[var(--radius-card)] bg-[linear-gradient(165deg,rgba(10,12,16,0.95)_0%,rgba(24,20,14,0.92)_100%)] border border-[rgba(212,175,55,0.10)] shadow-[0_28px_64px_-40px_rgba(2,4,8,0.9)] transition-[border-color,box-shadow,transform] duration-[450ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:border-[rgba(212,175,55,0.32)] hover:shadow-[0_32px_72px_-36px_rgba(2,4,8,0.95)] hover:-translate-y-0.5";
const PILLAR_ACCENT_BASE =
	"absolute top-0 left-[1.85rem] right-[1.85rem] h-[2px] rounded-[2px] overflow-hidden opacity-85 pointer-events-none after:content-[''] after:absolute after:inset-0 after:w-[200%] after:h-full after:will-change-transform";
const PILLAR_ACCENT_BRONZE = `${PILLAR_ACCENT_BASE} after:bg-[linear-gradient(90deg,transparent,rgba(212,175,55,0.55),transparent)] after:animate-[founding-shimmer_5s_ease-in-out_infinite] motion-reduce:after:animate-none`;
const PILLAR_ACCENT_GROWTH = `${PILLAR_ACCENT_BASE} after:bg-[linear-gradient(90deg,transparent,rgba(232,213,168,0.5),transparent)] after:[animation:founding-shimmer_5.5s_ease-in-out_infinite_reverse] motion-reduce:after:animate-none`;
const EYEBROW_BRONZE =
	"text-[0.68rem] font-extrabold tracking-[0.2em] uppercase text-[rgba(232,213,168,0.95)] mt-[0.65rem] mb-4";
const EYEBROW_GROWTH =
	"text-[0.68rem] font-extrabold tracking-[0.2em] uppercase text-[rgba(232,213,168,0.85)] mt-[0.65rem] mb-4";
const PILLAR_TITLE =
	"font-[family-name:var(--font-display)] text-[clamp(1.35rem,2.4vw,1.6rem)] font-bold tracking-[-0.028em] leading-[1.2] text-[var(--text-white)] m-0 mb-4";
const PILLAR_STAT =
	"inline-block text-[clamp(2.35rem,5vw,3.1rem)] font-extrabold tracking-[-0.045em] leading-none mb-[0.35rem] text-[#f1f5f9] animate-[founding-stat-pop_6s_ease-in-out_infinite] motion-reduce:animate-none";
const PILLAR_PRICE =
	"block text-[clamp(2.35rem,5vw,3.1rem)] font-extrabold tracking-[-0.045em] leading-none mb-[0.35rem] text-[#fcf0d2]";
const PILLAR_LEDE =
	"text-[0.98rem] leading-[1.75] text-[var(--text-gray)] m-0 mb-[1.15rem]";
const PILLAR_LIST =
	"list-none m-0 p-0 grid gap-[0.65rem] [&>li]:relative [&>li]:pl-[1.15rem] [&>li]:text-[0.92rem] [&>li]:leading-[1.55] [&>li]:text-white/[0.78] [&>li]:before:content-[''] [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:top-[0.52rem] [&>li]:before:w-[5px] [&>li]:before:h-[5px] [&>li]:before:rounded-full [&>li]:before:bg-[rgba(212,175,55,0.85)]";
const PILLAR_LIST_GROWTH = `${PILLAR_LIST} [&>li]:before:bg-[rgba(232,213,168,0.85)]`;
const ACTIONS =
	"reveal-up flex flex-wrap justify-center gap-[0.85rem] mt-[clamp(2.25rem,4vw,3rem)] max-md:flex-col max-md:items-stretch [&>.btn]:max-md:w-full";
const NOTE =
	"reveal-up max-w-[36rem] mx-auto mt-6 text-center text-[0.8rem] leading-[1.65] text-[var(--text-muted)]";

export function FoundingPartnerSection() {
	return (
		<section className={SHELL} aria-labelledby="founding-partner-heading">
			<div className="section-container relative z-[1]">
				<div className={HEADER}>
					<p className="section-eyebrow">Founding partner program</p>
					<h2 id="founding-partner-heading">
						{FOUNDING_PARTNER_BUILD_SLOTS} complimentary custom builds for early
						client partners.
					</h2>
					<p>{FOUNDING_PARTNER_SHORT_COPY}</p>
				</div>

				<div className={PILLARS}>
					<article className={PILLAR_BASE}>
						<div className={PILLAR_ACCENT_BRONZE} aria-hidden="true" />
						<p className={EYEBROW_BRONZE}>Launch allocation</p>
						<h3 className={PILLAR_TITLE}>
							<span className={PILLAR_STAT} data-founding-stat>
								{FOUNDING_PARTNER_BUILD_SLOTS}
							</span>{" "}
							complimentary launch builds
						</h3>
						<p className={PILLAR_LEDE}>
							Full custom website—strategy, design, and hand-built
							performance—not a page builder skin. Reserved for businesses that
							are the right fit and ready for a higher-trust digital presence.
						</p>
						<ul className={PILLAR_LIST}>
							<li>
								Built for trust, calls, and local search—not vanity slides
							</li>
							<li>
								Mobile-first engineering with strong Lighthouse scores —{" "}
								{ATELIER_ROME_LEGACY}
							</li>
							<li>You approve everything before anything goes live</li>
						</ul>
					</article>

					<article className={PILLAR_BASE}>
						<div className={PILLAR_ACCENT_GROWTH} aria-hidden="true" />
						<p className={EYEBROW_GROWTH}>After launch</p>
						<h3 className={PILLAR_TITLE}>
							<span className={PILLAR_PRICE}>
								{FOUNDING_PARTNER_SEO_MONTHLY}
							</span>
							/mo {FOUNDING_PARTNER_SEO_LABEL}
						</h3>
						<p className={PILLAR_LEDE}>
							Ongoing visibility and care: Google Cloud hosting, security, and
							SEO—plus Google Business Profile attention, review support, and
							one meaningful growth asset each month.
						</p>
						<ul className={PILLAR_LIST_GROWTH}>
							<li>Hosting on a fast global CDN—included in the plan</li>
							<li>
								Local SEO structure maintained as Google and your market shift
							</li>
							<li>Direct line to Anthony—no tickets, no offshore handoffs</li>
						</ul>
					</article>
				</div>

				<div className={ACTIONS}>
					<Link href="/contact" className={btnPrimary}>
						Let&apos;s build something great.
					</Link>
					<Link href="/lighthouse" className={btnOutline}>
						Audit My Site
					</Link>
				</div>

				<p className={NOTE}>
					Limited to {FOUNDING_PARTNER_BUILD_SLOTS} approved partners. Fit and
					scope confirmed on a short call. Complimentary build applies when you
					enroll in the {FOUNDING_PARTNER_SEO_MONTHLY}/month{" "}
					{FOUNDING_PARTNER_SEO_LABEL}; terms reviewed before any commitment.
				</p>
			</div>
		</section>
	);
}

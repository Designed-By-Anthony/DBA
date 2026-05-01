import Link from "next/link";
import { btnOutline, btnPrimary } from "@/design-system/buttons";

export interface FooterCtaProps {
	eyebrow: string;
	title: string;
	description: string;
	primaryHref: string;
	primaryLabel: string;
	secondaryHref?: string;
	secondaryLabel?: string;
	note?: string;
}

/* Inline Tailwind: footer-cta-* classes (layout-shell.css), Bronze-locked. */
const CARD =
	"reveal-up p-[clamp(2rem,4vw,2.8rem)] rounded-[1.7rem] text-left grid grid-cols-1 md:[grid-template-columns:minmax(0,1.2fr)_minmax(240px,0.8fr)] gap-[clamp(1.2rem,2.6vw,2rem)] items-center bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.16),transparent_34%),linear-gradient(140deg,rgba(8,17,31,0.98)_0%,rgba(20,16,9,0.98)_55%,rgba(34,26,15,0.98)_100%)] border border-[rgba(212,175,55,0.22)] shadow-[0_34px_90px_-54px_rgba(8,15,28,0.96)] max-md:p-[1.8rem_1.25rem] max-md:rounded-[1.35rem] max-md:text-center [&>div>h2]:text-[clamp(1.95rem,4vw,3rem)] [&>div>h2]:font-extrabold [&>div>h2]:tracking-[-0.045em] [&>div>h2]:leading-[1.06] [&>div>h2]:text-[var(--text-white)] [&>div>h2]:mb-[0.95rem] [&>div>p]:text-[var(--text-gray)] [&>div>p]:text-[clamp(1rem,1.7vw,1.08rem)] [&>div>p]:leading-[1.72] [&>div>p]:m-0 max-md:[&>div>p]:mx-auto";
const COPY = "max-w-[760px]";
const NOTE = "!mt-[0.9rem] text-white/70 !text-[0.95rem]";
const ACTIONS =
	"hero-actions flex flex-col items-stretch justify-end gap-[0.85rem] mt-0 max-md:mt-[1.35rem] [&>.btn]:max-md:w-full";

export function FooterCta({
	eyebrow,
	title,
	description,
	primaryHref,
	primaryLabel,
	secondaryHref,
	secondaryLabel,
	note,
}: FooterCtaProps) {
	const primaryIsCalendly = primaryHref.includes("calendly.com");
	const secondaryIsExternal = Boolean(secondaryHref?.startsWith("http"));
	const secondaryIsCalendly = Boolean(secondaryHref?.includes("calendly.com"));

	return (
		<section className="section-shell section-shell--proof pt-0">
			<div className="section-container">
				<div className={CARD}>
					<div className={COPY}>
						<p className="section-eyebrow section-eyebrow--pulse">{eyebrow}</p>
						<h2>{title}</h2>
						<p>{description}</p>
						{note && <p className={NOTE}>{note}</p>}
					</div>

					<div className={ACTIONS}>
						{primaryHref.startsWith("/") ? (
							<Link href={primaryHref} className={btnPrimary}>
								{primaryLabel}
							</Link>
						) : (
							<a
								href={primaryHref}
								className={btnPrimary}
								{...(primaryIsCalendly ? { "data-calendar-link": true } : {})}
							>
								{primaryLabel}
							</a>
						)}
						{secondaryHref &&
							secondaryLabel &&
							(secondaryHref.startsWith("/") ? (
								<Link href={secondaryHref} className={btnOutline}>
									{secondaryLabel}
								</Link>
							) : (
								<a
									href={secondaryHref}
									className={btnOutline}
									target={
										secondaryIsExternal && !secondaryIsCalendly
											? "_blank"
											: undefined
									}
									rel={
										secondaryIsExternal && !secondaryIsCalendly
											? "noopener noreferrer"
											: undefined
									}
									{...(secondaryIsCalendly
										? { "data-calendar-link": true }
										: {})}
								>
									{secondaryLabel}
									{secondaryIsExternal && !secondaryIsCalendly && (
										<span className="sr-only"> (opens in new window)</span>
									)}
								</a>
							))}
					</div>
				</div>
			</div>
		</section>
	);
}

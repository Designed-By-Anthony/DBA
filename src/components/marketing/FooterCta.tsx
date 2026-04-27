import Link from "next/link";

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
		<section className="section-shell section-shell--proof footer-cta-shell">
			<div className="section-container">
				<div className="footer-cta-card reveal-up">
					<div className="footer-cta-copy">
						<p className="section-eyebrow section-eyebrow--pulse">{eyebrow}</p>
						<h2>{title}</h2>
						<p>{description}</p>
						{note && <p className="footer-cta-note">{note}</p>}
					</div>

					<div className="hero-actions footer-cta-actions">
						{primaryHref.startsWith("/") ? (
							<Link href={primaryHref} className="btn btn-primary-audit">
								{primaryLabel}
							</Link>
						) : (
							<a
								href={primaryHref}
								className="btn btn-primary-audit"
								{...(primaryIsCalendly ? { "data-calendar-link": true } : {})}
							>
								{primaryLabel}
							</a>
						)}
						{secondaryHref &&
							secondaryLabel &&
							(secondaryHref.startsWith("/") ? (
								<Link href={secondaryHref} className="btn btn-primary-book">
									{secondaryLabel}
								</Link>
							) : (
								<a
									href={secondaryHref}
									className="btn btn-primary-book"
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

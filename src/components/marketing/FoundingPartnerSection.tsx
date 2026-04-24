import Link from "next/link";
import {
	FOUNDING_PARTNER_BUILD_SLOTS,
	FOUNDING_PARTNER_SEO_LABEL,
	FOUNDING_PARTNER_SEO_MONTHLY,
	FOUNDING_PARTNER_SHORT_COPY,
} from "@/lib/offers";

export function FoundingPartnerSection() {
	return (
		<section
			className="section-shell founding-partner-shell"
			aria-labelledby="founding-partner-heading"
		>
			<div className="section-container">
				<div className="section-header centered founding-partner-header reveal-up">
					<p className="section-eyebrow">Founding partner program</p>
					<h2 id="founding-partner-heading">
						{FOUNDING_PARTNER_BUILD_SLOTS} complimentary custom builds for early
						client partners.
					</h2>
					<p>{FOUNDING_PARTNER_SHORT_COPY}</p>
				</div>

				<div className="founding-pillars">
					<article className="founding-pillar reveal-up">
						<div className="founding-pillar-accent" aria-hidden="true" />
						<p className="founding-pillar-eyebrow">Launch allocation</p>
						<h3 className="founding-pillar-title">
							<span className="founding-pillar-stat" data-founding-stat>
								{FOUNDING_PARTNER_BUILD_SLOTS}
							</span>{" "}
							complimentary launch builds
						</h3>
						<p className="founding-pillar-lede">
							Full custom website—strategy, design, and hand-built
							performance—not a page builder skin. Reserved for businesses that
							are the right fit and ready for a higher-trust digital presence.
						</p>
						<ul className="founding-pillar-list">
							<li>
								Built for trust, calls, and local search—not vanity slides
							</li>
							<li>Mobile-first engineering with strong Lighthouse scores</li>
							<li>You approve everything before anything goes live</li>
						</ul>
					</article>

					<article className="founding-pillar founding-pillar--growth reveal-up">
						<div
							className="founding-pillar-accent founding-pillar-accent--growth"
							aria-hidden="true"
						/>
						<p className="founding-pillar-eyebrow">After launch</p>
						<h3 className="founding-pillar-title">
							<span className="founding-pillar-price">
								{FOUNDING_PARTNER_SEO_MONTHLY}
							</span>
							/mo {FOUNDING_PARTNER_SEO_LABEL}
						</h3>
						<p className="founding-pillar-lede">
							Ongoing visibility and care: Google Cloud hosting, security, and
							SEO—plus Google Business Profile attention, review support, and
							one meaningful growth asset each month.
						</p>
						<ul className="founding-pillar-list">
							<li>Hosting on a fast global CDN—included in the plan</li>
							<li>
								Local SEO structure maintained as Google and your market shift
							</li>
							<li>Direct line to Anthony—no tickets, no offshore handoffs</li>
						</ul>
					</article>
				</div>

				<div className="founding-partner-actions reveal-up">
					<a
						href="https://calendly.com/anthony-designedbyanthony/web-design-consult"
						className="btn btn-primary"
						data-calendar-link
					>
						Book a 15-minute intro call
					</a>
					<Link href="/free-seo-audit" className="btn btn-outline">
						Run the Free Audit
					</Link>
				</div>

				<p className="founding-partner-note reveal-up">
					Limited to {FOUNDING_PARTNER_BUILD_SLOTS} approved partners. Fit and
					scope confirmed on a short call. Complimentary build applies when you
					enroll in the {FOUNDING_PARTNER_SEO_MONTHLY}/month{" "}
					{FOUNDING_PARTNER_SEO_LABEL}; terms reviewed before any commitment.
				</p>
			</div>
		</section>
	);
}

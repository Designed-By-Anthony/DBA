import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { homeFaqEntries, processSteps, whyStackCards } from "@/data/home";
import { showcaseFeaturedItems } from "@/data/showcase";
import {
	btnOutline,
	btnPrimary,
	btnPrimaryAudit,
	btnSecondaryProof,
} from "@/design-system/buttons";
import {
	ATELIER_ROME_LEGACY,
	COPPER_CITY_HOOK,
} from "@/design-system/location";
import {
	FOUNDING_PARTNER_BUILD_SLOTS,
	FOUNDING_PARTNER_SEO_LABEL,
	FOUNDING_PARTNER_SEO_MONTHLY,
	STANDARD_WEBSITE_INSTALLMENT_EACH,
	STANDARD_WEBSITE_STARTING_PRICE,
	STANDARD_WEBSITE_TYPICAL_RANGE,
} from "@/lib/offers";
import { FaqSection } from "./FaqSection";
import { FirstVisitSplash } from "./FirstVisitSplash";
import { FoundingPartnerSection } from "./FoundingPartnerSection";
import { PremiumPitchStrip } from "./PremiumPitchStrip";
import "@/app/home-page.css";

const homeFeaturedWorkItems = showcaseFeaturedItems.slice(0, 3);
const heroGhostLines = [
	"TAKE IT TO THE EDGE",
	"LETS BUILD SOMETHING GREAT.",
	"ENGINEERED IN THE 315.",
	"INFRASTRUCTURE OVER SOFTWARE.",
] as const;

function HeroGhostLayer() {
	return (
		<div className="hero-ghost-layer" aria-hidden="true">
			{heroGhostLines.map((line, index) => (
				<span
					key={line}
					className={`hero-ghost-line hero-ghost-line--${index + 1}`}
				>
					{line}
				</span>
			))}
		</div>
	);
}

/**
 * Hero A/B variants. Default copy always renders in SSR for SEO; the
 * afterInteractive script swaps only when `?v=<key>` is present (ad
 * campaign landing pages). Search engines always see the default.
 */
const heroVariants = {
	wellness: {
		eyebrow:
			"Mohawk Valley Web Design Studio · Medspa · Salon · Wellness · Boutique",
		h1: "Mohawk Valley web design for wellness brands that want a site as polished as the client experience.",
		sub: "Custom websites for medspas, salons, aesthetic clinics, and boutique wellness brands across Utica, Rome, Syracuse, and Central New York. Editorial layouts, luxurious typography, and a booking flow that respects your brand — so the site feels like an extension of the treatment room, not a template from 2014. Contact us for your free audit.",
	},
	"multi-location": {
		eyebrow:
			"Central NY Web Design Studio · Multi-Location · Franchise · HVAC · Home Services",
		h1: "Web design and local SEO for multi-location service businesses across Central New York.",
		sub: "Custom sites for HVAC, plumbing, electrical, and home-service operators running two, three, or more locations across Utica, Syracuse, Watertown, and greater Upstate NY. Distinct location pages, shared lead capture, CRM integration (ServiceTitan, Jobber, Housecall Pro), and local SEO tuned for each market. Contact us for your free audit.",
	},
} as const;

export function HomePage() {
	const heroSub =
		"Enterprise-grade websites for contractors, home-service professionals, medical aesthetics, salons, and scaling businesses throughout Utica, Rome, Syracuse, and Central New York. Performance-optimized architecture, conversion-focused design, and SEO infrastructure that positions you at the top of local search results. ";
	const heroSubWithLegacy = `${heroSub}${ATELIER_ROME_LEGACY}`;
	return (
		<>
			<section className="page-hero page-hero--home">
				<div className="hero-lcp-layer" aria-hidden="true">
					<Image
						src="/images/og-site-premium.png"
						alt=""
						width={2400}
						height={1260}
						className="hero-lcp-layer__img"
						priority
						fetchPriority="high"
						sizes="100vw"
					/>
				</div>
				<div className="hero-drift" aria-hidden="true">
					<span className="hero-drift__glow hero-drift__glow--a" />
					<span className="hero-drift__glow hero-drift__glow--b" />
				</div>
				<div className="hero-rain" aria-hidden="true">
					<span className="hero-rain__layer hero-rain__layer--back" />
					<span className="hero-rain__layer hero-rain__layer--front" />
				</div>
				<HeroGhostLayer />
				<div className="page-hero-inner">
					<div className="hero-copy">
						<p className="hero-place-marker">
							<span className="sr-only">
								Area codes three one five and five one eight
							</span>
							<span className="hero-place-marker__rule" aria-hidden="true" />
							<span className="hero-place-marker__text" aria-hidden="true">
								315 · 518
							</span>
						</p>
						<p className="page-eyebrow page-eyebrow--rule" data-hero-eyebrow>
							Mohawk Valley Digital Agency · Utica · Rome · Syracuse · CNY —{" "}
							{COPPER_CITY_HOOK}
						</p>
						<div className="hero-launch-pill" role="status">
							<span className="hero-launch-dot" aria-hidden="true" />
							<span className="hero-launch-pill__text">
								The 315 Pilot:{" "}
								<strong>
									{FOUNDING_PARTNER_BUILD_SLOTS} Founding Infrastructure
									Placements Remaining
								</strong>
								<span className="hero-launch-pill__sep"> · </span>
								<span className="hero-launch-pill__sub">
									complimentary build + {FOUNDING_PARTNER_SEO_MONTHLY}/mo growth
									plan
								</span>
							</span>
						</div>
						<h1
							data-hero-h1
							className="home-hero-title font-[family-name:var(--font-inter)] font-normal tracking-[-0.02em]"
						>
							<span className="font-[family-name:var(--font-fraunces)] font-bold">
								Software
							</span>{" "}
							<span className="font-[family-name:var(--font-inter)] font-normal">
								is built by machines.{" "}
							</span>
							<span className="font-[family-name:var(--font-fraunces)] font-bold">
								Infrastructure
							</span>{" "}
							<span className="font-[family-name:var(--font-inter)] font-normal">
								is designed by{" "}
							</span>
							<span className="font-[family-name:var(--font-fraunces)] font-bold whitespace-nowrap">
								ANTHONY
								<span className="text-[rgb(var(--accent-bronze-rgb))]">.</span>
							</span>
						</h1>
						<p
							data-hero-sub
							className="font-[family-name:var(--font-inter)] font-normal"
						>
							{heroSubWithLegacy}
						</p>
						<p className="hero-pricing-anchor">
							Standard engagements:{" "}
							<strong>
								3 quarterly payments of {STANDARD_WEBSITE_INSTALLMENT_EACH}
							</strong>{" "}
							(investment typically {STANDARD_WEBSITE_TYPICAL_RANGE}) — includes
							enterprise hosting and strategic SEO for the first quarter, then
							continue with the {FOUNDING_PARTNER_SEO_MONTHLY}/mo{" "}
							{FOUNDING_PARTNER_SEO_LABEL}. Founding partner program:
							complimentary build with SEO commitment —{" "}
							{FOUNDING_PARTNER_BUILD_SLOTS} exclusive positions available.
							Single-service solutions from {STANDARD_WEBSITE_STARTING_PRICE}.
						</p>
						<div className="hero-actions">
							<Link
								href="/lighthouse"
								className={`${btnPrimaryAudit} hero-cta-glow`}
								id="hero-audit-btn"
							>
								<span className="hero-cta-glow-halo" aria-hidden="true" />
								Audit My Site
							</Link>
							<Link
								href="/contact"
								className={btnOutline}
								id="hero-contact-btn"
							>
								Contact us
							</Link>
						</div>
						<div className="hero-trust-strip">
							<div className="hero-trust-badge">
								<span>Free · Manual Audit</span>
							</div>
							<span className="hero-trust-sep" aria-hidden="true" />
							<div className="hero-trust-badge">
								<span>Built in Rome, NY</span>
							</div>
							<span className="hero-trust-sep" aria-hidden="true" />
							<div className="hero-trust-badge">
								<span>Reply in 1 Business Day</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="section-shell section-shell--premium-pitch">
				<PremiumPitchStrip variant="home" />
			</section>

			<section
				className="section-shell section-shell--proof command-shell"
				aria-label="How this studio works"
			>
				<div className="section-container command-strip reveal-up">
					<div className="command-strip__item command-strip__item--brand">
						<p className="command-strip__label">Who builds it</p>
						<p className="command-strip__value">One person, end to end</p>
						<p className="command-strip__meta">
							You talk to the same builder from first call to launch —
							structure, copy, and performance, not a handoff chain.
						</p>
					</div>
					<div className="command-strip__item">
						<p className="command-strip__label">How we start</p>
						<p className="command-strip__value">Audit, then a plan</p>
						<p className="command-strip__meta">
							We run the numbers first so the quote matches what your site
							actually needs — not a guess from a sales call.
						</p>
					</div>
					<div className="command-strip__item">
						<p className="command-strip__label">What we optimize for</p>
						<p className="command-strip__value">Real calls, not vanity</p>
						<p className="command-strip__meta">
							Clear next steps on every page so the right visitors know how to
							reach you — and you are not chasing junk leads.
						</p>
					</div>
				</div>
			</section>

			<section
				className="section-shell section-shell--wash home-proof-shell"
				aria-labelledby="home-proof-heading"
			>
				<div className="section-container">
					<div className="section-header centered">
						<p className="section-eyebrow">Proof so far</p>
						<h2 id="home-proof-heading">
							Where things stand today — no fluff.
						</h2>
						<p>
							We are still in the first 10-client launch pilot. Here is what we
							can honestly point to right now.
						</p>
					</div>
					<div className="home-proof-grid">
						<article className="surface-card home-proof-card reveal-up">
							<span className="card-tag">Verified technical baseline</span>
							<h3>
								Lighthouse performance and quality scores are consistently
								strong.
							</h3>
							<p>
								The site showcases real Lighthouse results and the same
								engineering standards used in client builds: fast loading, clean
								accessibility, and solid technical SEO structure.{" "}
								{ATELIER_ROME_LEGACY}
							</p>
						</article>
						<article className="surface-card home-proof-card reveal-up">
							<span className="card-tag">Current client outcome</span>
							<h3>
								The Long Beach Handyman is live; lead generation is still in
								progress.
							</h3>
							<p>
								The first client paid $250 for the build and the site is
								deployed. Paid advertising has not produced a customer yet, so
								we are treating this as an early-stage baseline and continuing
								to test positioning and traffic.
							</p>
						</article>
					</div>
				</div>
			</section>

			<section
				className="section-shell section-shell--wash home-email-cta"
				aria-labelledby="home-email-cta-heading"
			>
				<div className="section-container">
					<div className="home-email-cta__card surface-card reveal-up">
						<div className="home-email-cta__copy">
							<p className="home-email-cta__eyebrow">Prefer email?</p>
							<h2 id="home-email-cta-heading" className="home-email-cta__title">
								Send a message on the contact page
							</h2>
							<p className="home-email-cta__sub">
								Same secure lead path — full form with optional phone and
								project details. We reply within one business day.
							</p>
						</div>
						<div className="home-email-cta__actions">
							<Link href="/contact" className={btnOutline}>
								Open contact form
							</Link>
							<Link href="/contact" className={btnPrimary}>
								Let&apos;s build something great.
							</Link>
						</div>
					</div>
				</div>
			</section>

			<section
				className="section-shell section-shell--wash why-stack-shell"
				aria-labelledby="why-stack-heading"
			>
				<div className="section-container">
					<div className="section-header centered">
						<p className="section-eyebrow">Why our sites feel different</p>
						<h2 id="why-stack-heading">
							The technical stuff is the boring part. Here is what it actually
							means for your business.
						</h2>
						<p>
							Instead of a WordPress site held together with a pile of plugins,
							you get a lean site that stays fast — fewer moving parts, less to
							patch, and nothing that quietly breaks while you are out on a job.
						</p>
					</div>
					<div className="why-stack-grid">
						{whyStackCards.map((card) => (
							<article
								key={card.tech}
								className="surface-card why-stack-card reveal-up"
							>
								<span className="why-stack-tech">{card.tech}</span>
								<h3 className="why-stack-plain">{card.plain}</h3>
								<p className="why-stack-why">{card.why}</p>
							</article>
						))}
					</div>
					<p className="why-stack-cta-note">
						Want the full technical breakdown with benchmarks and sources?{" "}
						<Link href="/ouredge" className="inline-link">
							See our technical edge →
						</Link>
					</p>
				</div>
			</section>

			<section
				className="section-shell home-faq-shell"
				aria-labelledby="home-faq-heading"
			>
				<div className="section-container">
					<div className="section-header centered">
						<p className="section-eyebrow">Quick Answers</p>
						<h2 id="home-faq-heading">
							Questions we hear most from local owners.
						</h2>
						<p>
							Pricing, timelines, and how this actually works — in plain
							language, before you spend a dollar.
						</p>
					</div>
					<FaqSection
						className="home-faq-list"
						itemClassName="reveal-up"
						entries={homeFaqEntries}
					/>
					<p className="home-faq-cta-note">
						More on process, hosting, and revisions on the{" "}
						<Link href="/faq" className="inline-link">
							full FAQ page
						</Link>
						.
					</p>
				</div>
			</section>

			<FoundingPartnerSection />

			<section className="section-shell section-shell--technical process-shell">
				<div className="section-container">
					<div className="section-flow-marker reveal-up" aria-hidden="true" />
					<div className="section-header centered">
						<p className="section-eyebrow section-eyebrow--pulse">
							How It Works
						</p>
						<h2>From initial audit to live site — without the runaround.</h2>
						<p>
							No pressure to commit on the first call. Here is how it goes from
							your first click to launch.
						</p>
					</div>

					<div className="process-grid process-grid--asymmetric">
						{processSteps.map((step, index) => (
							<div
								key={step.title}
								className="surface-card surface-card--technical process-card reveal-up"
							>
								<span className="process-number">0{index + 1}</span>
								<h3>{step.title}</h3>
								<p>{step.description}</p>
							</div>
						))}
					</div>

					<div className="process-action">
						<Link href="/contact" className={btnOutline}>
							Contact us for your free audit
						</Link>
					</div>
				</div>
			</section>

			<section className="section-shell section-shell--editorial section-shell--wash">
				<div className="section-container">
					<div className="section-flow-marker reveal-up" aria-hidden="true" />
					<div className="section-header centered">
						<p className="section-eyebrow">Selected Examples</p>
						<h2>A few sites we have put in front of real customers.</h2>
						<p>
							Finished work shows the layout, structure, and conversion thinking
							we bring to every build.{" "}
							<Link href="/ouredge" className="inline-link">
								See our technical edge →
							</Link>
						</p>
					</div>

					<div
						className="featured-work-grid featured-work-grid--stagger"
						data-home-featured-work
					>
						{homeFeaturedWorkItems.map((item, i) => {
							const href = item.caseStudySlug
								? `/portfolio/${item.caseStudySlug}`
								: (item.href ?? "#");
							const isExternal = !item.caseStudySlug;
							const ctaLabel = item.caseStudySlug
								? "View Case Study"
								: `Open ${item.name} example`;
							const imgSrc = item.displayImage ?? item.image;
							return (
								<article
									key={item.name}
									className="surface-card surface-card--editorial featured-work-card reveal-up"
								>
									<a
										href={href}
										target={isExternal ? "_blank" : undefined}
										rel={isExternal ? "noopener noreferrer" : undefined}
										className="featured-work-media"
									>
										<div className="featured-image-wrap">
											<Image
												src={imgSrc}
												alt={item.imageAlt ?? item.name}
												className="featured-image"
												width={640}
												height={480}
												sizes="(max-width: 900px) min(100vw, 1160px), min(33vw, 480px)"
												priority={i === 0}
												{...(i === 0 ? { fetchPriority: "high" as const } : {})}
											/>
										</div>
									</a>
									<div className="featured-copy">
										<div className="featured-meta">
											<span className="card-tag">{item.statusLabel}</span>
											<span className="featured-industry">{item.industry}</span>
										</div>
										<h3>{item.name}</h3>
										<p>{item.description}</p>
										<a
											href={href}
											target={isExternal ? "_blank" : undefined}
											rel={isExternal ? "noopener noreferrer" : undefined}
											className="featured-link"
										>
											{ctaLabel}
											{isExternal && (
												<span className="sr-only">(opens in new window)</span>
											)}
										</a>
									</div>
								</article>
							);
						})}
					</div>

					<div className="portfolio-link-wrap">
						<Link href="/portfolio" className={btnSecondaryProof}>
							View Full Portfolio
						</Link>
					</div>
				</div>
			</section>

			<Script id="hero-variants" strategy="afterInteractive">
				{`(() => {
  try {
    var params = new URLSearchParams(window.location.search);
    var variantKey = params.get('v');
    var heroVariants = ${JSON.stringify(heroVariants)};
    if (variantKey && heroVariants && heroVariants[variantKey]) {
      var variant = heroVariants[variantKey];
      var eyebrow = document.querySelector('[data-hero-eyebrow]');
      var sub = document.querySelector('[data-hero-sub]');
      if (eyebrow && variant.eyebrow) eyebrow.textContent = variant.eyebrow;
      if (sub && variant.sub) sub.textContent = variant.sub;
      document.documentElement.setAttribute('data-hero-variant', variantKey);
    }
  } catch (e) {}
})();`}
			</Script>

			<Script id="home-hero-motion" strategy="afterInteractive">
				{`(() => {
  var hero = document.querySelector('.page-hero--home');
  if (!hero) return;
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  if (!prefersReducedMotion && hasFinePointer) {
    hero.addEventListener('pointermove', function (event) {
      var rect = hero.getBoundingClientRect();
      var x = ((event.clientX - rect.left) / rect.width) * 100;
      var y = ((event.clientY - rect.top) / rect.height) * 100;
      hero.style.setProperty('--hero-spot-x', x.toFixed(2) + '%');
      hero.style.setProperty('--hero-spot-y', y.toFixed(2) + '%');
    }, { passive: true });
    hero.addEventListener('pointerleave', function () {
      hero.style.setProperty('--hero-spot-x', '50%');
      hero.style.setProperty('--hero-spot-y', '22%');
    });
  }
  var actionButtons = hero.querySelectorAll('.hero-actions .btn');
  if (prefersReducedMotion || !hasFinePointer || actionButtons.length === 0) return;
  var MAX_SHIFT = 8;
  actionButtons.forEach(function (button) {
    button.addEventListener('pointermove', function (event) {
      var rect = button.getBoundingClientRect();
      var dx = event.clientX - (rect.left + rect.width / 2);
      var dy = event.clientY - (rect.top + rect.height / 2);
      var xShift = (dx / (rect.width / 2)) * MAX_SHIFT;
      var yShift = (dy / (rect.height / 2)) * MAX_SHIFT;
      button.style.setProperty('--btn-shift-x', xShift.toFixed(2) + 'px');
      button.style.setProperty('--btn-shift-y', yShift.toFixed(2) + 'px');
    }, { passive: true });
    button.addEventListener('pointerleave', function () {
      button.style.setProperty('--btn-shift-x', '0px');
      button.style.setProperty('--btn-shift-y', '0px');
    });
  });
})();`}
			</Script>
			<FirstVisitSplash />
		</>
	);
}

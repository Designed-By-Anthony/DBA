import { ArticleBody } from "./ArticleBody";
import { BlogArticleEnhancements } from "./BlogArticleEnhancements";
import { getArticleBlocksForSlug } from "@/data/blogArticleBlocks";
import { blogPosts } from "@/data/blogPosts";
import { homeFooterCta } from "@/data/home";
import { SERVICE_PAGE_EXTRA_SECTIONS } from "@/data/servicePageSections";
import { showcaseItems } from "@/data/showcase";
import {
	FACEBOOK_OFFER_CALENDLY_WITH_UTM,
	FACEBOOK_PRIVATE_OFFER_COPY,
	PRIVATE_FACEBOOK_LABEL,
} from "@/lib/offers";
import { MARKETING_SERVICES } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuditForm } from "./AuditForm";
import { MarketingChrome } from "./MarketingChrome";

const STATIC_COPY: Record<
	string,
	{ title: string; description: string; paragraphs: string[] }
> = {
	about: {
		title: "About Designed by Anthony",
		description:
			"Marine Corps veteran–led Mohawk Valley web design studio for service businesses across Central New York.",
		paragraphs: [
			"Anthony Jones builds custom websites, local SEO programs, managed hosting, and website rescues for contractors, home-service pros, medspas, salons, and other small businesses across Utica, Rome, Syracuse, and greater CNY.",
			"You work directly with the person writing the code — no bait-and-switch account team, no offshore ticket queue.",
		],
	},
	contact: {
		title: "Contact",
		description: "Reach Designed by Anthony — secure form, no spam.",
		paragraphs: [
			"Tell us what you are trying to fix (slow site, Map Pack visibility, rescue rebuild, or net-new build). We reply within one business day with a clear next step.",
		],
	},
	pricing: {
		title: "Pricing",
		description: "Transparent ranges for Mohawk Valley and Central NY website rebuilds.",
		paragraphs: [
			"Most local service-business rebuilds fall in a predictable band once scope is clear. Book a short intro call for a written estimate tailored to your pages, integrations, and SEO depth.",
		],
	},
	portfolio: {
		title: "Portfolio",
		description: "Selected builds and concept work from Designed by Anthony.",
		paragraphs: [
			"Below is a mix of live client work and published concept builds that show the layout, performance, and conversion patterns we ship.",
		],
	},
	faq: {
		title: "FAQ",
		description: "Quick answers before you spend a dollar.",
		paragraphs: [
			"For the full FAQ list, start on the homepage — or send a note through the contact form and we will point you to the right section.",
		],
	},
	ouredge: {
		title: "Our Edge",
		description: "Why our sites feel different — performance, structure, and long-term maintainability.",
		paragraphs: [
			"We build lean, fast marketing sites with modern tooling so you are not fighting plugins, template drift, or mystery bloat six months after launch.",
		],
	},
	"service-areas": {
		title: "Service Areas",
		description: "Mohawk Valley, Central NY, and select national markets.",
		paragraphs: [
			"Primary work is anchored in Rome, NY, with regular coverage across Utica, Syracuse, and the broader Mohawk Valley. We also support select remote clients (for example Houston and Naples) on a case-by-case basis.",
		],
	},
	"free-seo-audit": {
		title: "Free 60-Second Website Audit",
		description: "Lighthouse-style scores and a clear snapshot of where your site stands.",
		paragraphs: [
			"Drop your URL below. The check runs in the browser and Anthony follows up within 24 hours with the clearest next step — same workflow as the homepage audit module.",
		],
	},
	privacy: {
		title: "Privacy Policy",
		description: "How Designed by Anthony handles information submitted through this site.",
		paragraphs: [
			"This policy describes what we collect through contact and audit forms, how long we retain it, and how to request deletion. A full legal review copy can be expanded here; for now, treat submissions as operational email + CRM records used only to respond and deliver services.",
		],
	},
	terms: {
		title: "Terms of Service",
		description: "Terms governing use of this website and engagement with Designed by Anthony.",
		paragraphs: [
			"Use of this site does not create a client relationship until a written agreement is signed. Project scope, payment milestones, and deliverables are defined per engagement.",
		],
	},
	cookie: {
		title: "Cookie Policy",
		description: "Cookies, analytics, and consent on designedbyanthony.com.",
		paragraphs: [
			"We use first-party and vendor cookies only where needed for security (for example Turnstile), measurement (for example GA4 after consent), and chat when enabled. Use the cookie banner to accept or reject non-essential analytics.",
		],
	},
	"image-license": {
		title: "Image License",
		description: "Attribution and licensing for imagery used on this marketing site.",
		paragraphs: [
			"Self-hosted marketing imagery includes Unsplash-sourced assets used under the Unsplash License unless otherwise noted. Client project screenshots are used with permission.",
		],
	},
	"thank-you": {
		title: "Thank you",
		description: "Your submission was received.",
		paragraphs: [
			"Anthony reviews every inbound note personally. If you asked for an audit or a consult, you will hear back within one business day with a clear next step.",
		],
	},
	"facebook-offer": {
		title: PRIVATE_FACEBOOK_LABEL,
		description: FACEBOOK_PRIVATE_OFFER_COPY,
		paragraphs: [
			"This page is for invited Facebook traffic only. If you landed here from an ad or direct message, you are in the right place — book a short strategy call using the link below and mention the private offer so we can confirm eligibility.",
		],
	},
	"404": {
		title: "Page not found",
		description: "That URL is not on this site (or it moved).",
		paragraphs: [
			"Try the homepage, the services index, or contact Anthony if you followed an old bookmark.",
		],
	},
};

function PageHero({ title, subtitle }: { title: string; subtitle?: string }) {
	return (
		<section className="section-shell section-shell--wash marketing-page-hero">
			<div className="section-container">
				<div className="section-header">
					<h1 className="page-title reveal-up">{title}</h1>
					{subtitle ? <p className="page-lead reveal-up">{subtitle}</p> : null}
				</div>
			</div>
		</section>
	);
}

function ProseBlock({ paragraphs }: { paragraphs: string[] }) {
	return (
		<section className="section-shell">
			<div className="section-container marketing-prose">
				{paragraphs.map((p, i) => (
					<p key={i} className="reveal-up">
						{p}
					</p>
				))}
			</div>
		</section>
	);
}

function ServicesIndex() {
	return (
		<MarketingChrome footerCta={homeFooterCta}>
			<PageHero
				title="Services"
				subtitle="Custom sites, local SEO, hosting, rescues, GBP programs, workspace setup, and AI-assisted lead capture."
			/>
			<section className="section-shell section-shell--wash">
				<div className="section-container">
					<ul className="marketing-link-grid">
						{MARKETING_SERVICES.map((s) => (
							<li key={s.path} className="reveal-up">
								<Link href={s.path} className="surface-card marketing-service-card">
									<h2>{s.name}</h2>
									<p>{s.description}</p>
									<span className="inline-link">Read more →</span>
								</Link>
							</li>
						))}
					</ul>
				</div>
			</section>
		</MarketingChrome>
	);
}

function ServiceDetailPage({ slug }: { slug: string }) {
	const service = MARKETING_SERVICES.find(
		(s) => s.path === `/services/${slug}`,
	);
	if (!service) notFound();
	const extra = SERVICE_PAGE_EXTRA_SECTIONS[slug];
	return (
		<MarketingChrome footerCta={homeFooterCta}>
			<PageHero title={service.name} subtitle={service.description} />
			<ProseBlock
				paragraphs={[
					`${service.name} is part of the core offer stack for Mohawk Valley and Central NY service businesses. If this matches what you need, book a short intro call or send a note — we will confirm scope, timeline, and pricing in writing before any work starts.`,
					"Most projects pair a fast, mobile-first marketing site with clear calls to action, technical SEO structure, and optional ongoing local SEO or managed hosting depending on your goals.",
				]}
			/>
			{extra?.map((section) => (
				<section key={section.heading} className="section-shell section-shell--wash">
					<div className="section-container marketing-prose">
						<h2 className="reveal-up">{section.heading}</h2>
						{section.paragraphs.map((p, i) => (
							<p key={i} className="reveal-up">
								{p}
							</p>
						))}
						{section.bullets?.length ? (
							<ul className="reveal-up">
								{section.bullets.map((b) => (
									<li key={b}>{b}</li>
								))}
							</ul>
						) : null}
					</div>
				</section>
			))}
			<section className="section-shell section-shell--wash">
				<div className="section-container marketing-cta-row">
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
		</MarketingChrome>
	);
}

function BlogIndex() {
	return (
		<MarketingChrome footerCta={homeFooterCta}>
			<PageHero title="Blog" subtitle="Local SEO, performance, and how we build marketing sites." />
			<section className="section-shell">
				<div className="section-container blog-index-grid">
					{blogPosts.map((post) => (
						<article key={post.url} className="surface-card blog-index-card reveal-up">
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
								<Link href={post.url} className="inline-link" data-blog-post-link>
									Read article →
								</Link>
							</div>
						</article>
					))}
				</div>
			</section>
		</MarketingChrome>
	);
}

function BlogPostPage({ slug }: { slug: string }) {
	const post = blogPosts.find((p) => p.url === `/blog/${slug}`);
	if (!post) notFound();
	const articleBlocks = getArticleBlocksForSlug(slug);
	return (
		<MarketingChrome footerCta={homeFooterCta}>
			<BlogArticleEnhancements />
			<article className="blog-article-root">
				<section className="section-shell section-shell--wash">
					<div className="section-container blog-article-hero">
						<p className="blog-index-meta reveal-up">
							{post.displayDate} · {post.readTime}
						</p>
						<h1 className="page-title reveal-up">{post.title}</h1>
						<p className="page-lead reveal-up">{post.excerpt}</p>
					</div>
				</section>
				<section className="section-shell">
					<div className="section-container marketing-prose blog-article-main">
						<div className="blog-article-cover reveal-up">
							<Image
								src={post.image}
								alt={post.imageAlt}
								width={post.imageWidth}
								height={post.imageHeight}
								priority
								sizes="(max-width: 1100px) 100vw, 960px"
							/>
						</div>
						{articleBlocks?.length ? (
							<ArticleBody blocks={articleBlocks} />
						) : (
							<>
								<p className="reveal-up">{post.excerpt}</p>
								<p className="reveal-up">
									Full editorial for this URL is being expanded in the Next.js site. If you
									need the prior version on short notice, email{" "}
									<a className="inline-link" href="mailto:anthony@designedbyanthony.com">
										anthony@designedbyanthony.com
									</a>{" "}
									and reference the headline above.
								</p>
							</>
						)}
						<p className="reveal-up">
							<Link href="/blog" className="inline-link" data-blog-back-button>
								← Back to all posts
							</Link>
						</p>
					</div>
				</section>
			</article>
		</MarketingChrome>
	);
}

function PortfolioIndex() {
	return (
		<MarketingChrome footerCta={homeFooterCta}>
			<PageHero {...STATIC_COPY.portfolio} />
			<section className="section-shell">
				<div className="section-container featured-work-grid">
					{showcaseItems.map((item) => {
						const href = item.caseStudySlug
							? `/portfolio/${item.caseStudySlug}`
							: (item.href ?? "#");
						const isExternal = !item.caseStudySlug;
						return (
							<article
								key={item.name}
								className="surface-card featured-work-card reveal-up"
							>
								<a
									href={href}
									target={isExternal ? "_blank" : undefined}
									rel={isExternal ? "noopener noreferrer" : undefined}
									className="featured-work-media"
								>
									<div className="featured-image-wrap">
										<Image
											src={item.displayImage ?? item.image}
											alt={item.imageAlt ?? item.name}
											className="featured-image"
											width={640}
											height={480}
											sizes="(max-width: 900px) 100vw, 400px"
										/>
									</div>
								</a>
								<div className="featured-copy">
									<span className="card-tag">{item.statusLabel}</span>
									<h2>{item.name}</h2>
									<p>{item.description}</p>
									<a
										href={href}
										className="featured-link"
										target={isExternal ? "_blank" : undefined}
										rel={isExternal ? "noopener noreferrer" : undefined}
									>
										{item.caseStudySlug ? "View case study" : "Open example"}
									</a>
								</div>
							</article>
						);
					})}
				</div>
			</section>
		</MarketingChrome>
	);
}

function PortfolioCaseStudy({ slug }: { slug: string }) {
	const item = showcaseItems.find((i) => i.caseStudySlug === slug);
	if (!item) notFound();
	return (
		<MarketingChrome footerCta={homeFooterCta}>
			<PageHero title={item.name} subtitle={item.description} />
			<section className="section-shell">
				<div className="section-container marketing-prose">
					<div className="blog-article-cover">
						<Image
							src={item.displayImage ?? item.image}
							alt={item.imageAlt ?? item.name}
							width={960}
							height={640}
							className="featured-image"
							sizes="(max-width: 1100px) 100vw, 960px"
						/>
					</div>
					<h2>Problem</h2>
					<p>{item.problem}</p>
					<h2>Approach</h2>
					<p>{item.solution}</p>
					{item.features?.length ? (
						<>
							<h2>Highlights</h2>
							<ul>
								{item.features.map((f) => (
									<li key={f.label}>
										<strong>{f.label}:</strong> {f.detail}
									</li>
								))}
							</ul>
						</>
					) : null}
					{item.href ? (
						<p>
							<a className="btn btn-primary-book" href={item.href}>
								Visit live site
							</a>
						</p>
					) : null}
					<p>
						<Link href="/portfolio" className="inline-link">
							← Back to portfolio
						</Link>
					</p>
				</div>
			</section>
		</MarketingChrome>
	);
}

function StaticMarketingPage({ slug }: { slug: string }) {
	const copy = STATIC_COPY[slug];
	if (!copy) notFound();
	const showContactForm = slug === "contact";
	const showAuditForm = slug === "free-seo-audit";
	const showFacebookCta = slug === "facebook-offer";
	return (
		<MarketingChrome footerCta={homeFooterCta}>
			<PageHero title={copy.title} subtitle={copy.description} />
			<ProseBlock paragraphs={copy.paragraphs} />
			{showFacebookCta ? (
				<section className="section-shell section-shell--wash">
					<div className="section-container marketing-cta-row">
						<a className="btn btn-primary-book" href={FACEBOOK_OFFER_CALENDLY_WITH_UTM}>
							Book a strategy call (Facebook offer)
						</a>
						<Link href="/contact" className="btn btn-secondary-proof">
							Contact instead
						</Link>
					</div>
				</section>
			) : null}
			{showContactForm ? (
				<section className="section-shell section-shell--wash">
					<div className="section-container home-quick-lead__card surface-card">
						<h2 className="home-quick-lead__title">Send a message</h2>
						<AuditForm
							ctaSource="contact_page"
							pageContext="contact"
							sourcePath="/contact"
							offerType="contact_page"
							subjectLine="Contact form — Designed by Anthony"
							pageTitle="Contact — Designed by Anthony"
							successRedirect="/thank-you?offer=contact"
							submitLabel="Send message"
							metaMessage="Turnstile-protected. No spam."
							websiteRequired={false}
							issueRequired
							issueLabel="How can we help?"
							issuePlaceholder="Project type, timeline, and best way to reach you."
							issueRows={5}
							showPhoneField
						/>
					</div>
				</section>
			) : null}
			{showAuditForm ? (
				<section className="section-shell section-shell--wash">
					<div className="section-container surface-card home-quick-lead__card">
						<AuditForm
							ctaSource="free_audit_page"
							pageContext="free_seo_audit"
							sourcePath="/free-seo-audit"
							offerType="free_website_audit"
							pageTitle="Free Website Audit — Designed by Anthony"
							subjectLine="Free Website Audit Request — Designed by Anthony"
							successRedirect="/thank-you?offer=audit"
						/>
					</div>
				</section>
			) : null}
		</MarketingChrome>
	);
}

function ThankYouPage() {
	const base = STATIC_COPY["thank-you"];
	return (
		<MarketingChrome footerCta={homeFooterCta}>
			<PageHero title={base.title} subtitle={base.description} />
			<section className="section-shell">
				<div className="section-container marketing-prose">
					{base.paragraphs.map((p) => (
						<p key={p}>{p}</p>
					))}
					<p>
						<Link href="/" className="btn btn-secondary-proof">
							Back to home
						</Link>
					</p>
				</div>
			</section>
		</MarketingChrome>
	);
}

export function MarketingSiteRouter({ path }: { path: string[] }) {
	if (path.length === 0) notFound();

	const [a, b] = path;

	if (a === "services" && path.length === 1) {
		return <ServicesIndex />;
	}
	if (a === "services" && b && path.length === 2) {
		return <ServiceDetailPage slug={b} />;
	}
	if (a === "blog" && path.length === 1) {
		return <BlogIndex />;
	}
	if (a === "blog" && b && path.length === 2) {
		return <BlogPostPage slug={b} />;
	}
	if (a === "portfolio" && path.length === 1) {
		return <PortfolioIndex />;
	}
	if (a === "portfolio" && b && path.length === 2) {
		return <PortfolioCaseStudy slug={b} />;
	}
	if (a === "thank-you" && path.length === 1) {
		return <ThankYouPage />;
	}
	if (path.length === 1 && STATIC_COPY[a]) {
		return <StaticMarketingPage slug={a} />;
	}

	notFound();
}

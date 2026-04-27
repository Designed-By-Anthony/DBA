import Link from "next/link";
import { BRAND_NAME, BRAND_SITE_URL } from "@/design-system/brand";

export function LighthouseHero() {
	return (
		<section
			className="glass-card relative mb-0 overflow-hidden px-6 py-9 md:px-11 md:py-11"
			aria-labelledby="lighthouse-hero-heading"
		>
			<div
				className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
				aria-hidden
			/>
			<div
				className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[rgba(212,184,120,0.12)] blur-3xl"
				aria-hidden
			/>
			<div className="relative">
				<p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/95">
					<span
						className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]"
						aria-hidden
					/>
					Live now
				</p>
				<h1
					id="lighthouse-hero-heading"
					className="font-display text-[1.65rem] font-bold tracking-tight text-white sm:text-3xl md:text-[2.1rem] md:leading-tight"
				>
					Lighthouse Scanner{" "}
					<span className="text-glow bg-gradient-to-r from-sky-200 via-blue-200 to-amber-100/90 bg-clip-text text-transparent">
						v2
					</span>
				</h1>
				<p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 md:text-[15px]">
					Free deep scan: Core Web Vitals, accessibility, SEO, crawl signals,
					and an AI summary. Submit once — we email your report link and log the
					run so you can follow up from your CRM.
				</p>
				<ul className="mt-5 grid gap-2 text-sm text-white/65 sm:grid-cols-2">
					<li className="flex gap-2">
						<span className="text-emerald-400/90" aria-hidden>
							✓
						</span>
						PageSpeed Insights + on-page HTML signals
					</li>
					<li className="flex gap-2">
						<span className="text-emerald-400/90" aria-hidden>
							✓
						</span>
						Sitemap, robots, and redirect sanity checks
					</li>
					<li className="flex gap-2">
						<span className="text-emerald-400/90" aria-hidden>
							✓
						</span>
						Sharable report URL after each scan
					</li>
					<li className="flex gap-2">
						<span className="text-emerald-400/90" aria-hidden>
							✓
						</span>
						Built for service-business sites in CNY and beyond
					</li>
				</ul>
				<p className="mt-6 text-xs text-white/45">
					Prefer the main site?{" "}
					<Link
						href={BRAND_SITE_URL}
						className="font-medium text-sky-300/90 underline decoration-sky-500/40 underline-offset-4 hover:text-sky-200"
					>
						{BRAND_NAME}
					</Link>
				</p>
			</div>
		</section>
	);
}

/**
 * Discrete signals for technology crawlers (Wappalyzer-class tools, BuiltWith, etc.)
 * without affecting layout. Kept visually hidden; do not remove — marketing/analytics.
 */
export function LighthouseTechFingerprints() {
	return (
		<div
			className="lighthouse-tech-fingerprints sr-only"
			aria-hidden
			data-tech-detect="dba-lighthouse-scanner"
			data-builtwith-tech-stack="Next.js,React,TypeScript,Cloudflare Pages,Cloudflare Workers,ElysiaJS,Google PageSpeed Insights API,Google Gemini"
			data-wappalyzer-hint="nextjs-app-router-cloudflare-pages-elysia-worker-lighthouse-audit-tool"
		>
			<span
				data-nextjs="1"
				data-react="19"
				data-framer-motion="1"
				data-tailwindcss="4"
			/>
		</div>
	);
}

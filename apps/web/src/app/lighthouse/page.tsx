import { AuditForm } from "@lh/components/AuditForm";
import { LighthouseHero } from "@lh/components/LighthouseHero";
import { LighthouseValueStrip } from "@lh/components/LighthouseValueStrip";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";

const LIGHTHOUSE_POWERED_BY = [
	{ label: "Gemini 2.0", href: "https://deepmind.google/technologies/gemini/" },
	{ label: "ElysiaJS", href: "https://elysiajs.com" },
	{ label: "Next.js", href: "https://nextjs.org" },
] as const;

export default function LighthouseHome() {
	return (
		<MarketingChrome
			headerCurrentSection="audit"
			footerBuildTag="Lighthouse Scanner v2"
			footerPoweredBy={LIGHTHOUSE_POWERED_BY}
			hidePreFooterCta
		>
			<div className="lighthouse-main">
				<section className="lh-audit-stage mx-auto w-full max-w-7xl">
					<div className="lh-stage-grid">
						<LighthouseHero />
						<aside
							className="lighthouse-audit-shell lh-audit-panel"
							aria-label="Run your website audit"
						>
							<AuditForm />
						</aside>
					</div>

					<div className="lh-stage-lower">
						<LighthouseValueStrip />
					</div>
				</section>
			</div>
		</MarketingChrome>
	);
}

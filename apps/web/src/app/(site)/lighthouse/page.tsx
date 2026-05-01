import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { AuditForm } from "@lh/components/AuditForm";
import { LighthouseHero } from "@lh/components/LighthouseHero";
import { LighthouseValueStrip } from "@lh/components/LighthouseValueStrip";

export default function LighthouseHome() {
	return (
		<MarketingChrome>
			<main
				id="main-content"
				className="min-h-screen"
				style={{ backgroundColor: "#0A0C10" }}
			>
				<section className="mx-auto w-full max-w-7xl px-[var(--container-gutter)] py-[var(--section-space)]">
					<div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,min(100%,480px))]">
						<LighthouseHero />
						<aside
							className="lighthouse-audit-shell"
							aria-label="Run your website audit"
						>
							<AuditForm />
						</aside>
					</div>

					<div className="mt-16">
						<LighthouseValueStrip />
					</div>
				</section>
			</main>
		</MarketingChrome>
	);
}

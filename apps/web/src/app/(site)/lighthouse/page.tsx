import { AuditForm } from "@lh/components/AuditForm";
import { LighthouseHero } from "@lh/components/LighthouseHero";
import { LighthouseValueStrip } from "@lh/components/LighthouseValueStrip";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";

export default function LighthouseHome() {
	return (
		<MarketingChrome>
			<div className="lighthouse-main">
				<section className="lh-audit-stage">
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

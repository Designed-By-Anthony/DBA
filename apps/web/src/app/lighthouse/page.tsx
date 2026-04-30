import { AuditForm } from "@lh/components/AuditForm";
import { LighthouseHero } from "@lh/components/LighthouseHero";
import { LighthouseValueStrip } from "@lh/components/LighthouseValueStrip";

export default function LighthouseHome() {
	return (
		<main id="main-content" className="lighthouse-main">
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
		</main>
	);
}

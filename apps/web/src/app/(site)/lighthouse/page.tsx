import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import {
	CARD_LG_TEXT_PAD,
	SECTION_CONTAINER,
	SECTION_SHELL,
	SECTION_SHELL_TECHNICAL,
	SURFACE_CARD_TECHNICAL,
} from "@/design-system/sections";
import { AuditForm } from "@lh/components/AuditForm";
import { LighthouseHero } from "@lh/components/LighthouseHero";
import { LighthouseValueStrip } from "@lh/components/LighthouseValueStrip";

export default function LighthouseHome() {
	return (
		<MarketingChrome>
			<main
				id="main-content"
				className="min-h-screen bg-[var(--bg-deeper)]"
			>
				{/* Hero + audit panel — strict Midnight, neutral section shell. */}
				<section className={SECTION_SHELL}>
					<div className={SECTION_CONTAINER}>
						<div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,min(100%,480px))]">
							<LighthouseHero />
							<aside
								className={`${SURFACE_CARD_TECHNICAL} ${CARD_LG_TEXT_PAD}`}
								aria-label="Run your website audit"
							>
								<AuditForm />
							</aside>
						</div>
					</div>
				</section>

				{/* Five-checks — technical wash (dot-grid texture) for visual rhythm. */}
				<section className={SECTION_SHELL_TECHNICAL}>
					<div className={SECTION_CONTAINER}>
						<LighthouseValueStrip />
					</div>
				</section>
			</main>
		</MarketingChrome>
	);
}

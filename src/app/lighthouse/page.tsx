import { AuditForm } from "@lh/components/AuditForm";
import { LighthouseHero } from "@lh/components/LighthouseHero";
import { getTurnstileSiteKey } from "@/lib/turnstile";

export default function LighthouseHome() {
	const turnstileSiteKey = getTurnstileSiteKey();

	return (
		<main
			id="main-content"
			className="lighthouse-main w-full px-5 pb-20 pt-10 md:px-8 md:pb-24 md:pt-14"
		>
			<div className="lighthouse-main-inner mx-auto w-full max-w-5xl">
				<LighthouseHero />
				<div className="lighthouse-audit-shell glass-card px-6 py-8 md:px-10 md:py-10">
					<AuditForm turnstileSiteKey={turnstileSiteKey} />
				</div>
			</div>
		</main>
	);
}

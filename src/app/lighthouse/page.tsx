import { AuditForm } from "@lh/components/AuditForm";
import { LighthouseHero } from "@lh/components/LighthouseHero";

export default function LighthouseHome() {
	return (
		<main id="main-content" className="w-full px-5 pb-16 pt-8 md:pt-12">
			<div className="mx-auto w-full max-w-xl">
				<LighthouseHero />
				<div className="glass-card px-6 py-8 md:px-8 md:py-9">
					<AuditForm />
				</div>
			</div>
		</main>
	);
}

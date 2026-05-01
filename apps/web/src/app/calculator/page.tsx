import type { Metadata } from "next";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { homeFooterCta } from "@/data/home";
import { CalculatorClient } from "./CalculatorClient";

export const revalidate = 86400;

const TITLE =
	"Digital Estate Cost Calculator | ANTHONY. — Infrastructure Estimator";
const DESCRIPTION =
	"Estimate indicative investment for a high-performance marketing estate, integrations, and Vault CRM alignment — engineered in the 315.";

export const metadata: Metadata = {
	title: TITLE,
	description: DESCRIPTION,
	alternates: { canonical: "/calculator" },
	openGraph: {
		title: TITLE,
		description: DESCRIPTION,
		url: "https://designedbyanthony.com/calculator",
		type: "website",
	},
};

export default function CalculatorPage() {
	return (
		<MarketingChrome footerCta={homeFooterCta}>
			<section className="section-shell section-shell--wash marketing-page-hero">
				<div className="section-container max-w-[56rem]">
					<p className="text-[0.72rem] font-[family-name:var(--font-inter)] uppercase tracking-[0.22em] text-[rgb(var(--accent-bronze-rgb))] mb-3">
						Diagnostic bench
					</p>
					<h1 className="page-title">Digital Estate Cost Calculator</h1>
					<p className="page-lead max-w-[40rem]">
						A fast, transparent ballpark for bespoke infrastructure — tune pages,
						integrations, and engagement tier. Hook this URL for backlinks and
						drive qualified estimates into the Vault pipeline.
					</p>
				</div>
			</section>
			<section className="section-shell pb-24">
				<div className="section-container max-w-[56rem]">
					<CalculatorClient />
				</div>
			</section>
		</MarketingChrome>
	);
}

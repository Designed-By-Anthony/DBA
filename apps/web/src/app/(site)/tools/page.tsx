import type { Metadata } from "next";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { buildToolsStoreJsonLd } from "@/lib/tools-jsonld";
import { ToolsPage } from "./ToolsPage";

export const revalidate = 86400;

export const metadata: Metadata = {
	title: "Tools — Micro SaaS for Local Service Businesses",
	description:
		"Six purpose-built tools for freelancers and small web agencies: website health reports, AI review response, client portals, local SEO dashboards, testimonial collection, and AI social content. Founding member pricing available.",
	openGraph: {
		title: "Tools — Micro SaaS Store | ANTHONY.",
		description:
			"Purpose-built tools for local service businesses. SEO monitoring, AI review response, client portals, and more. Founding member pricing available.",
		url: "https://designedbyanthony.com/tools",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Tools — Micro SaaS Store | ANTHONY.",
		description:
			"Purpose-built tools for local service businesses. SEO monitoring, AI review response, client portals, and more.",
	},
	alternates: { canonical: "/tools" },
};

export default function Tools() {
	const toolsGraph = buildToolsStoreJsonLd();
	return (
		<MarketingChrome>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD data
				dangerouslySetInnerHTML={{ __html: JSON.stringify(toolsGraph) }}
			/>
			<div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
				<ToolsPage />
			</div>
		</MarketingChrome>
	);
}

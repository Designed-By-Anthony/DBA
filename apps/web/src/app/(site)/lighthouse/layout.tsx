import { LighthouseJsonLd } from "@lh/components/LighthouseJsonLd";
import { LighthouseTechFingerprints } from "@lh/components/LighthouseTechFingerprints";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./lighthouse-globals.css";

export const metadata: Metadata = {
	title: "Lighthouse Scanner — Free Site Audit",
	description:
		"Run a free Lighthouse-grade audit on your website: performance, accessibility, SEO, and trust signals scored in about 60 seconds.",
};

export default function LighthouseSegmentLayout({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<>
			<LighthouseJsonLd />
			<LighthouseTechFingerprints />
			{children}
		</>
	);
}

import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
	title: "Your site report | ANTHONY.",
	description:
		"View your Lighthouse audit report — speed, SEO, accessibility, and trust scored for your business.",
	robots: { index: false, follow: false },
};

export default function LighthouseReportViewerLayout({
	children,
}: {
	children: ReactNode;
}) {
	return children;
}

import type { ReactNode } from "react";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { homeFooterCta } from "@/data/home";

export default function SiteLayout({ children }: { children: ReactNode }) {
	return (
		<MarketingChrome footerCta={homeFooterCta}>{children}</MarketingChrome>
	);
}

/**
 * /es — Spanish-language landing page (infraestructura mínima).
 *
 * Provides a Spanish-language entry point for crawlers and bilingual
 * visitors. Full i18n routing can be layered on later; this page
 * establishes the URL, hreflang relationship, and key translated copy.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { btnOutline, btnPrimary } from "@/design-system/buttons";
import {
	BESPOKE_CONFIG_DESCRIPTION_ES,
	STANDARD_WEBSITE_STARTING_PRICE,
} from "@/lib/offers";

export const metadata: Metadata = {
	title: "ANTHONY. | Arquitecto de Infraestructura Digital",
	description:
		"Bespoke digital estates and high-performance infrastructure for the 315 and beyond. Diseñado por Anthony.",
	alternates: {
		canonical: "https://designedbyanthony.com/es",
		languages: {
			en: "https://designedbyanthony.com",
			es: "https://designedbyanthony.com/es",
		},
	},
	openGraph: {
		title: "ANTHONY. | Arquitecto de Infraestructura Digital",
		description:
			"Bespoke digital estates and high-performance infrastructure for the 315 and beyond. Diseñado por Anthony.",
		type: "website",
		url: "https://designedbyanthony.com/es",
		locale: "es_US",
	},
};

export default function EsPage() {
	return (
		<main
			lang="es"
			className="min-h-screen flex flex-col items-center justify-center px-5 py-[clamp(4rem,10vw,8rem)] bg-[#0a0c10]"
		>
			<div
				className="pointer-events-none fixed inset-0 z-0"
				aria-hidden="true"
				style={{
					background:
						"radial-gradient(ellipse 60% 45% at 50% 0%, rgba(212,175,55,0.06) 0%, transparent 70%)",
				}}
			/>

			<div className="relative z-10 w-full max-w-[42rem] flex flex-col gap-8">
				<p className="text-[0.68rem] font-extrabold tracking-[0.22em] uppercase text-[rgba(212,175,55,0.85)] m-0">
					315 · Mohawk Valley Engineering
				</p>

				<h1 className="home-hero-title font-[family-name:var(--font-inter)] font-normal tracking-[-0.02em] text-[clamp(2rem,5vw,3.2rem)] leading-[1.1] text-white m-0">
					<span className="font-[family-name:var(--font-fraunces)] font-bold">
						Las máquinas construyen software.
					</span>{" "}
					<span className="font-[family-name:var(--font-inter)] font-normal">
						La infraestructura es diseñada por{" "}
					</span>
					<span className="font-[family-name:var(--font-fraunces)] font-bold whitespace-nowrap">
						ANTHONY
						<span className="text-[rgb(var(--accent-bronze-rgb))]">.</span>
					</span>
				</h1>

				<p className="font-[family-name:var(--font-inter)] text-[1.05rem] leading-[1.78] text-[rgba(247,244,238,0.68)] m-0">
					Arquitectura digital de alto rendimiento. Ingeniería de élite en el
					315. Sitios desde{" "}
					<strong className="text-[rgba(247,244,238,0.92)]">
						{STANDARD_WEBSITE_STARTING_PRICE}
					</strong>
					.
				</p>

				<div className="text-bubble is-bordered">
					<p className="text-[0.78rem] font-extrabold tracking-[0.18em] uppercase text-[rgba(212,175,55,0.75)] m-0 mb-2">
						Integración de marca (24-48 h)
					</p>
					<p className="text-[0.95rem] leading-[1.72] text-[rgba(247,244,238,0.72)] m-0">
						{BESPOKE_CONFIG_DESCRIPTION_ES}
					</p>
				</div>

				<div className="flex flex-wrap gap-3">
					<Link href="/contact" className={btnPrimary}>
						Construyamos algo grande.
					</Link>
					<Link href="/" className={btnOutline} hrefLang="en">
						View in English
					</Link>
				</div>
			</div>
		</main>
	);
}

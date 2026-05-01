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
	title: "Diseño Web para Negocios Locales — Designed by Anthony",
	description:
		"Diseño web personalizado y SEO local para negocios de servicio en el Valle de Mohawk y el norte de Nueva York.",
	alternates: {
		canonical: "https://designedbyanthony.com/es",
		languages: {
			en: "https://designedbyanthony.com",
			es: "https://designedbyanthony.com/es",
		},
	},
};

export default function EsPage() {
	return (
		<main
			lang="es"
			className="min-h-screen flex flex-col items-center justify-center px-5 py-[clamp(4rem,10vw,8rem)] bg-[#0a0c10]"
		>
			{/* Ambient glow */}
			<div
				className="pointer-events-none fixed inset-0 z-0"
				aria-hidden="true"
				style={{
					background:
						"radial-gradient(ellipse 60% 45% at 50% 0%, rgba(212,175,55,0.06) 0%, transparent 70%)",
				}}
			/>

			<div className="relative z-10 w-full max-w-[42rem] flex flex-col gap-8">
				{/* Eyebrow */}
				<p className="text-[0.68rem] font-extrabold tracking-[0.22em] uppercase text-[rgba(212,175,55,0.85)] m-0">
					Diseñado por Anthony · Valle de Mohawk, Nueva York
				</p>

				{/* Headline */}
				<h1 className="font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3.2rem)] font-bold tracking-[-0.035em] leading-[1.1] text-white m-0">
					Diseño web a medida para negocios locales de servicio.
				</h1>

				{/* Lead */}
				<p className="text-[1.05rem] leading-[1.78] text-[rgba(247,244,238,0.68)] m-0">
					Sitios web personalizados y SEO local para negocios de servicio en
					Utica, Rome, Syracuse y todo el norte del estado de Nueva York. Desde{" "}
					<strong className="text-[rgba(247,244,238,0.92)]">
						{STANDARD_WEBSITE_STARTING_PRICE}
					</strong>
					.
				</p>

				{/* Bespoke integration notice */}
				<div className="text-bubble is-bordered">
					<p className="text-[0.78rem] font-extrabold tracking-[0.18em] uppercase text-[rgba(212,175,55,0.75)] m-0 mb-2">
						Integración de marca personalizada (24-48 h)
					</p>
					<p className="text-[0.95rem] leading-[1.72] text-[rgba(247,244,238,0.72)] m-0">
						{BESPOKE_CONFIG_DESCRIPTION_ES}
					</p>
				</div>

				{/* CTAs */}
				<div className="flex flex-wrap gap-3">
					<Link href="/contact" className={btnPrimary}>
						Reservar una consulta gratuita
					</Link>
					<Link href="/" className={btnOutline} hrefLang="en">
						View in English
					</Link>
				</div>
			</div>
		</main>
	);
}

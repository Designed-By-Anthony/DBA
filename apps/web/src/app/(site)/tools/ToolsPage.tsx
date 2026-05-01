"use client";

import { type FormEvent, useState } from "react";
import {
	PROMO_BOGO,
	PROMO_FOUNDING,
	type Product,
	type ProductTier,
	TOOLS_PRODUCTS,
} from "@/data/tools-products";
import { buildPublicApiUrl } from "@/lib/publicApi";

const ICON_MAP: Record<string, string> = {
	search: "\u{1F50D}",
	bot: "\u{1F916}",
	folder: "\u{1F4C2}",
	mapPin: "\u{1F4CD}",
	star: "\u2B50",
	pen: "\u270D\uFE0F",
};

function ProductIcon({ icon }: { icon: string }) {
	return (
		<span
			className="text-[1.75rem] leading-none shrink-0 mt-[0.15rem]"
			aria-hidden
		>
			{ICON_MAP[icon] ?? "\u{1F527}"}
		</span>
	);
}

type PreorderStatus = "idle" | "form" | "submitting" | "success" | "error";

function PreorderForm({
	productName,
	tierName,
	onClose,
}: {
	productName: string;
	tierName: string;
	onClose: () => void;
}) {
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState<PreorderStatus>("form");

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		if (!email.includes("@")) return;
		setStatus("submitting");
		try {
			const res = await fetch(buildPublicApiUrl("/api/lead-email"), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email,
					name: email.split("@")[0] || "Pre-order",
					source: "tools-preorder",
					leadSource: "tools-preorder",
					ctaSource: `${productName} — ${tierName}`,
					message: `Pre-order interest: ${productName} — ${tierName} tier`,
				}),
			});
			if (!res.ok) throw new Error(`Server responded ${res.status}`);
			setStatus("success");
		} catch {
			setStatus("error");
		}
	}

	if (status === "success") {
		return (
			<div className="text-center">
				<p className="text-[0.82rem] text-[#22c55e] leading-[1.45]">
					Reserved! We will email you when {productName} launches.
				</p>
			</div>
		);
	}

	return (
		<form className="flex flex-col gap-2" onSubmit={handleSubmit}>
			<input
				type="email"
				className="w-full px-3 py-[0.55rem] rounded-[0.45rem] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] text-[rgba(247,244,238,0.95)] text-[0.82rem] outline-none transition-[border-color] duration-[180ms] ease-in focus:border-[rgba(212,175,55,0.45)] placeholder:text-[rgba(247,244,238,0.58)]"
				placeholder="your@email.com"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				required
				aria-label={`Email for ${productName} ${tierName} pre-order`}
				disabled={status === "submitting"}
			/>
			<div className="flex gap-[0.4rem]">
				<button
					type="submit"
					className="flex-1 px-3 py-[0.55rem] rounded-[0.45rem] border border-[rgba(212,175,55,0.35)] bg-[rgba(212,175,55,0.15)] text-[#fcf0d2] text-[0.8rem] font-bold cursor-pointer transition-[background,transform] duration-[180ms] ease-in hover:bg-[rgba(212,175,55,0.22)] hover:-translate-y-px disabled:opacity-55 disabled:cursor-not-allowed"
					disabled={status === "submitting"}
				>
					{status === "submitting" ? "Reserving\u2026" : "Reserve Spot"}
				</button>
				<button
					type="button"
					className="px-3 py-[0.55rem] rounded-[0.45rem] border border-[rgba(255,255,255,0.08)] bg-transparent text-[rgba(247,244,238,0.58)] text-[0.8rem] font-semibold cursor-pointer transition-colors duration-[180ms] ease-in hover:text-[rgba(247,244,238,0.92)]"
					onClick={onClose}
				>
					Cancel
				</button>
			</div>
			{status === "error" ? (
				<p className="text-[0.75rem] text-[rgba(248,113,113,0.85)]">
					Something went wrong. Try again.
				</p>
			) : null}
		</form>
	);
}

function TierCard({
	tier,
	annual,
	productName,
}: {
	tier: ProductTier;
	annual: boolean;
	productName: string;
}) {
	const price = annual ? tier.annualPrice : tier.monthlyPrice;
	const period = annual ? "/yr" : "/mo";
	const link = annual ? tier.annualLink : tier.monthlyLink;
	const isPlaceholder = link === "#";
	const [showPreorder, setShowPreorder] = useState(false);

	return (
		<div
			className={`relative flex flex-col p-[var(--card-pad,1.5rem)] rounded-[var(--radius-card,1.25rem)] border backdrop-blur-[8px] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(212,175,55,0.08)] ${
				tier.highlight
					? "border-[rgba(212,175,55,0.28)] bg-[rgba(212,175,55,0.04)] hover:border-[rgba(212,175,55,0.45)]"
					: "border-[rgba(255,252,245,0.07)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.2)]"
			}`}
		>
			{tier.highlight ? (
				<span className="absolute -top-[0.55rem] right-4 px-[0.6rem] py-[0.18rem] rounded-full bg-[linear-gradient(135deg,rgba(212,175,55,0.9)_0%,rgba(181,138,20,0.95)_100%)] text-[0.6rem] font-extrabold tracking-[0.1em] uppercase text-[#1a1200]">
					Most Popular
				</span>
			) : null}
			<h4 className="text-[0.82rem] font-bold tracking-[0.08em] uppercase text-[rgba(247,244,238,0.92)] mb-3">
				{tier.name}
			</h4>
			<p className="flex items-baseline gap-[0.2rem] mb-1">
				<span className="text-[2rem] font-extrabold text-[rgba(247,244,238,0.97)] tracking-[-0.02em] leading-none">
					${price}
				</span>
				<span className="text-[0.82rem] text-[rgba(247,244,238,0.58)] font-medium">
					{period}
				</span>
			</p>
			{annual ? (
				<p className="text-[0.7rem] text-[#22c55e] font-semibold mb-3">
					2 months free vs. monthly
				</p>
			) : null}
			<ul className="list-none p-0 mt-3 mb-5 flex flex-col gap-[0.45rem] flex-1">
				{tier.features.map((f) => (
					<li
						key={f}
						className="text-[0.82rem] text-[#9ca3ae] leading-[1.4] pl-[1.15rem] relative before:content-['✓'] before:absolute before:left-0 before:text-[#22c55e] before:text-[0.72rem] before:font-bold"
					>
						{f}
					</li>
				))}
			</ul>
			{isPlaceholder ? (
				showPreorder ? (
					<PreorderForm
						productName={productName}
						tierName={tier.name}
						onClose={() => setShowPreorder(false)}
					/>
				) : (
					<button
						type="button"
						className="block w-full text-center px-5 py-[0.65rem] rounded-[0.55rem] border border-[rgba(212,175,55,0.35)] bg-[linear-gradient(170deg,rgba(212,175,55,0.14)_0%,rgba(212,175,55,0.08)_100%)] text-[#fcf0d2] text-[0.85rem] font-bold cursor-pointer transition-[transform,box-shadow] duration-[180ms] ease-in hover:-translate-y-px hover:shadow-[0_10px_24px_-8px_rgba(212,175,55,0.35)]"
						onClick={() => setShowPreorder(true)}
					>
						Pre-order
					</button>
				)
			) : (
				<a
					href={link}
					target="_blank"
					rel="noopener noreferrer"
					className="block text-center px-5 py-[0.65rem] rounded-[0.55rem] border border-[rgba(212,175,55,0.45)] bg-[linear-gradient(170deg,rgba(212,175,55,0.22)_0%,rgba(181,138,20,0.32)_100%)] text-[rgba(252,240,210,0.96)] text-[0.85rem] font-bold no-underline cursor-pointer transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-px hover:border-[rgba(212,175,55,0.65)] hover:shadow-[0_10px_24px_-8px_rgba(212,175,55,0.35)]"
				>
					Get Started
				</a>
			)}
		</div>
	);
}

function ProductSection({ product }: { product: Product }) {
	const [annual, setAnnual] = useState(false);

	return (
		<section
			className="mb-[4.5rem] pt-8"
			id={product.slug}
			aria-labelledby={`${product.slug}-heading`}
		>
			<div className="flex gap-4 items-start mb-7 max-sm:flex-col">
				<ProductIcon icon={product.icon} />
				<div>
					<span className="inline-block text-[0.65rem] font-bold tracking-[0.15em] uppercase text-[#D4AF37] mb-[0.3rem]">
						{product.category}
					</span>
					<h3
						id={`${product.slug}-heading`}
						className="text-[clamp(1.35rem,3vw,1.75rem)] font-bold text-[rgba(247,244,238,0.97)] leading-[1.2] mb-2"
					>
						{product.name}{" "}
						<span className="font-normal text-[rgba(247,244,238,0.58)]">
							&mdash; {product.tagline}
						</span>
					</h3>
					<p className="text-[0.9rem] text-[#9ca3ae] leading-[1.6] max-w-[44rem]">
						{product.description}
					</p>
				</div>
			</div>

			<fieldset
				className="inline-flex rounded-[0.55rem] border border-[rgba(255,252,245,0.07)] bg-[rgba(255,255,255,0.025)] p-[0.2rem] mb-6 min-w-0"
				aria-label="Billing cycle"
			>
				<button
					type="button"
					className={`px-4 py-[0.45rem] border-none rounded-[0.4rem] text-[0.8rem] font-semibold cursor-pointer transition-[background,color] duration-[150ms] ease-in ${
						!annual
							? "bg-[rgba(212,175,55,0.14)] text-[#D4AF37]"
							: "bg-transparent text-[rgba(247,244,238,0.58)]"
					}`}
					onClick={() => setAnnual(false)}
					aria-pressed={!annual}
				>
					Monthly
				</button>
				<button
					type="button"
					className={`px-4 py-[0.45rem] border-none rounded-[0.4rem] text-[0.8rem] font-semibold cursor-pointer transition-[background,color] duration-[150ms] ease-in ${
						annual
							? "bg-[rgba(212,175,55,0.14)] text-[#D4AF37]"
							: "bg-transparent text-[rgba(247,244,238,0.58)]"
					}`}
					onClick={() => setAnnual(true)}
					aria-pressed={annual}
				>
					Annual{" "}
					<span className="text-[0.65rem] font-bold px-[0.4rem] py-[0.12rem] rounded-full bg-[rgba(34,197,94,0.14)] text-[#22c55e] ml-[0.35rem] align-middle">
						Save 2 mo
					</span>
				</button>
			</fieldset>

			<div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-5 max-sm:grid-cols-1">
				{product.tiers.map((tier) => (
					<TierCard
						key={tier.name}
						tier={tier}
						annual={annual}
						productName={product.name}
					/>
				))}
			</div>
		</section>
	);
}

export function ToolsPage() {
	return (
		<div className="min-h-[80vh] pt-[clamp(4rem,8vw,7rem)] pb-[clamp(4rem,8vw,6rem)] px-[var(--container-gutter)] max-w-[80rem] mx-auto">
			{/* Hero */}
			<section className="max-w-[52rem] mx-auto mb-12 text-center">
				<p className="inline-flex items-center gap-[0.45rem] px-[0.85rem] py-[0.35rem] rounded-full border border-[rgba(212,175,55,0.28)] bg-[rgba(212,175,55,0.07)] text-[0.68rem] font-bold tracking-[0.18em] uppercase text-[rgba(232,213,168,0.82)] mb-6">
					<span
						className="inline-block w-[0.35rem] h-[0.35rem] rounded-full bg-[rgba(212,175,55,0.9)] shadow-[0_0_6px_1px_rgba(212,175,55,0.45)] shrink-0"
						aria-hidden
					/>
					Micro SaaS Store &middot; Pre-orders Open
				</p>
				<h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold font-[family-name:var(--font-display)] tracking-[-0.03em] leading-[1.12] text-[rgba(247,244,238,0.97)] mb-5">
					Purpose-built tools for local service businesses.
				</h1>
				<p className="text-[clamp(0.95rem,1.8vw,1.1rem)] text-[rgba(247,244,238,0.58)] leading-[1.65] max-w-[38rem] mx-auto">
					Six focused products — SEO monitoring, AI review responses, client
					portals, testimonial collection, and more — priced for freelancers and
					small agencies. No bloat. No enterprise lock-in. Pre-order now to lock
					in founding member pricing.
				</p>
			</section>

			{/* Promo banners */}
			<div className="flex flex-wrap gap-4 justify-center mb-10 max-sm:flex-col max-sm:items-stretch">
				<div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.05)] max-w-[28rem] flex-[1_1_20rem] max-sm:max-w-full">
					<span className="inline-block px-[0.55rem] py-[0.25rem] rounded-[0.35rem] bg-[rgba(212,175,55,0.18)] text-[0.65rem] font-extrabold tracking-[0.12em] uppercase text-[#D4AF37] whitespace-nowrap shrink-0">
						{PROMO_FOUNDING.code}
					</span>
					<span className="text-[0.82rem] text-[rgba(247,244,238,0.92)] leading-[1.45]">
						<strong>{PROMO_FOUNDING.label}</strong> &mdash;{" "}
						{PROMO_FOUNDING.discount}. {PROMO_FOUNDING.note}.
					</span>
				</div>
				<div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.05)] max-w-[28rem] flex-[1_1_20rem] max-sm:max-w-full">
					<span className="inline-block px-[0.55rem] py-[0.25rem] rounded-[0.35rem] bg-[rgba(212,175,55,0.18)] text-[0.65rem] font-extrabold tracking-[0.12em] uppercase text-[#D4AF37] whitespace-nowrap shrink-0">
						{PROMO_BOGO.code}
					</span>
					<span className="text-[0.82rem] text-[rgba(247,244,238,0.92)] leading-[1.45]">
						<strong>{PROMO_BOGO.label}</strong> &mdash; {PROMO_BOGO.discount}.{" "}
						{PROMO_BOGO.note}.
					</span>
				</div>
			</div>

			{/* Quick nav */}
			<nav
				className="flex flex-wrap gap-2 justify-center mb-14"
				aria-label="Product quick links"
			>
				{TOOLS_PRODUCTS.map((p) => (
					<a
						key={p.slug}
						href={`#${p.slug}`}
						className="inline-flex items-center gap-[0.35rem] px-[0.85rem] py-[0.45rem] rounded-full border border-[rgba(255,252,245,0.07)] bg-[rgba(255,255,255,0.025)] text-[0.78rem] font-semibold text-[rgba(247,244,238,0.92)] no-underline transition-[border-color,background] duration-[180ms] ease-in hover:border-[rgba(212,175,55,0.35)] hover:bg-[rgba(212,175,55,0.06)]"
					>
						{ICON_MAP[p.icon] ?? "\u{1F527}"} {p.name}
					</a>
				))}
			</nav>

			{/* Product sections */}
			{TOOLS_PRODUCTS.map((product) => (
				<ProductSection key={product.slug} product={product} />
			))}

			{/* Bottom CTA */}
			<section className="text-center max-w-[40rem] mx-auto mt-8 px-[var(--card-pad,1.5rem)] py-10 rounded-[var(--radius-card,1.25rem)] border border-[rgba(212,175,55,0.18)] bg-[rgba(212,175,55,0.04)]">
				<h2 className="text-[clamp(1.25rem,3vw,1.6rem)] font-bold text-[rgba(247,244,238,0.97)] mb-3">
					Stack your tools. Save more.
				</h2>
				<p className="text-[0.9rem] text-[#9ca3ae] leading-[1.65]">
					Use code <strong>{PROMO_FOUNDING.code}</strong> for 50% off your first
					tool forever, then add <strong>{PROMO_BOGO.code}</strong> to get 50%
					off your second subscription. Annual billing saves an additional 2
					months on every tool.
				</p>
			</section>
		</div>
	);
}

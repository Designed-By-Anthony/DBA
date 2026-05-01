"use client";

import { type FormEvent, useMemo, useState } from "react";
import { btnPrimary } from "@/design-system/buttons";
import { buildPublicApiUrl } from "@/lib/publicApi";

type Tier = "starter" | "growth" | "enterprise";

export function CalculatorClient() {
	const [pages, setPages] = useState(12);
	const [integrations, setIntegrations] = useState(2);
	const [tier, setTier] = useState<Tier>("growth");
	const [email, setEmail] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [sent, setSent] = useState(false);

	const estimate = useMemo(() => {
		const base =
			tier === "starter" ? 4200 : tier === "growth" ? 8900 : 18500;
		const pageAdj = Math.max(0, pages - 8) * 350;
		const intAdj = integrations * 1200;
		return Math.round(base + pageAdj + intAdj);
	}, [pages, integrations, tier]);

	async function handleLead(e: FormEvent) {
		e.preventDefault();
		if (!email.includes("@")) return;
		setSubmitting(true);
		try {
			const res = await fetch(buildPublicApiUrl("/api/lead-email"), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email,
					name: email.split("@")[0] || "Calculator",
					source: "digital-estate-calculator",
					leadSource: "calculator",
					ctaSource: "Digital Estate Cost Calculator",
					message: `Calculator estimate ~$${estimate.toLocaleString()} — pages:${pages}, integrations:${integrations}, tier:${tier}`,
				}),
			});
			if (!res.ok) throw new Error(String(res.status));
			setSent(true);
		} catch {
			setSubmitting(false);
		}
	}

	return (
		<div className="grid gap-10 lg:grid-cols-[1fr_340px] items-start">
			<div className="surface-card border border-white/10 rounded-2xl p-6 md:p-8 bg-[rgba(8,11,18,0.55)]">
				<h2 className="mt-0 text-xl font-semibold tracking-tight">
					Inputs
				</h2>
				<label className="block mt-6 text-sm text-[var(--text-gray)]">
					Estimated marketing pages
					<input
						type="range"
						min={4}
						max={80}
						value={pages}
						onChange={(ev) => setPages(Number(ev.target.value))}
						className="w-full mt-2 accent-[rgb(var(--accent-bronze-rgb))]"
					/>
					<span className="text-[var(--text-primary)] font-medium">
						{pages} pages
					</span>
				</label>
				<label className="block mt-8 text-sm text-[var(--text-gray)]">
					Integrations (CRM, scheduling, payments, maps…)
					<input
						type="range"
						min={0}
						max={12}
						value={integrations}
						onChange={(ev) => setIntegrations(Number(ev.target.value))}
						className="w-full mt-2 accent-[rgb(var(--accent-bronze-rgb))]"
					/>
					<span className="text-[var(--text-primary)] font-medium">
						{integrations} integrations
					</span>
				</label>
				<fieldset className="mt-8 border-0 p-0 m-0">
					<legend className="text-sm text-[var(--text-gray)] mb-3">
						Engagement profile
					</legend>
					<div className="flex flex-col gap-2">
						{(["starter", "growth", "enterprise"] as const).map((t) => (
							<label
								key={t}
								className="flex items-center gap-3 cursor-pointer text-[0.95rem]"
							>
								<input
									type="radio"
									name="tier"
									checked={tier === t}
									onChange={() => setTier(t)}
								/>
								<span className="capitalize">{t}</span>
							</label>
						))}
					</div>
				</fieldset>
			</div>

			<div className="rounded-2xl border border-[rgba(212,175,55,0.35)] bg-[linear-gradient(165deg,rgba(212,175,55,0.12)_0%,rgba(8,11,18,0.92)_100%)] p-6 md:p-7">
				<p className="text-[0.72rem] uppercase tracking-[0.2em] text-[rgb(var(--accent-bronze-rgb))] m-0">
					Indicative range
				</p>
				<p className="mt-2 text-4xl font-bold tracking-tight tabular-nums">
					${estimate.toLocaleString()}
				</p>
				<p className="mt-3 text-sm leading-relaxed text-[var(--text-gray)]">
					Ballpark for a bespoke ANTHONY. estate — not a quote. We validate scope,
					content, and integrations on a short call.
				</p>
				{sent ? (
					<p className="mt-6 text-sm text-emerald-400">
						Saved. We will follow up with a sharper estimate.
					</p>
				) : (
					<form onSubmit={handleLead} className="mt-6 space-y-3">
						<label className="block text-sm text-[var(--text-gray)]">
							Email for a written estimate
							<input
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-[var(--text-primary)]"
								placeholder="you@company.com"
							/>
						</label>
						<button
							type="submit"
							disabled={submitting}
							className={`${btnPrimary} w-full justify-center`}
						>
							{submitting ? "Sending…" : "Send estimate request"}
						</button>
					</form>
				)}
			</div>
		</div>
	);
}

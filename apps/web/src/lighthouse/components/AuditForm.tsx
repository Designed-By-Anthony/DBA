"use client";

import type { AuditData } from "@lh/auditReport";
import { initCursorGlow } from "@lh/lib/cursorGlow";
import { Turnstile } from "@marsidev/react-turnstile";
import type React from "react";
import { useEffect, useState } from "react";
import { btnPrimaryAudit } from "@/design-system/buttons";
import { buildPublicApiUrl } from "@/lib/publicApi";
import { resolveEffectiveSiteKey } from "@/lib/turnstile";
import { AuditResults } from "./AuditResults";
import { AuditScanProgress, type ScanPhase } from "./AuditScanProgress";

const LOADING_MESSAGES = [
	"Calling Google PageSpeed Insights for mobile lab scores…",
	"Reading your homepage HTML for titles, headings, and schema…",
	"Checking robots.txt, sitemap, and redirect behavior…",
	"Pulling optional local/maps context when configured…",
	"Running the AI pass for your executive summary and top fixes…",
];

export function AuditForm() {
	const [url, setUrl] = useState("");
	const [email, setEmail] = useState("");
	const [name, setName] = useState("");
	const [company, setCompany] = useState("");
	const [location, setLocation] = useState("");

	const [status, setStatus] = useState<
		"idle" | "loading" | "success" | "error"
	>("idle");
	const [errorMsg, setErrorMsg] = useState("");
	const [results, setResults] = useState<AuditData | null>(null);
	const [reportId, setReportId] = useState<string | null>(null);
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

	const [loadingTextIndex, setLoadingTextIndex] = useState(0);
	const [scanPhase, setScanPhase] = useState<ScanPhase>("pagespeed");

	// Initialize cursor glow effect for glass cards
	useEffect(() => {
		if (status !== "loading") {
			const cleanup = initCursorGlow(".glass-card");
			return cleanup;
		}
	}, [status]);

	useEffect(() => {
		let interval: ReturnType<typeof setInterval> | undefined;
		let phaseTimer: ReturnType<typeof setInterval> | undefined;
		if (status === "loading") {
			setScanPhase("pagespeed");
			const start = Date.now();
			interval = setInterval(() => {
				setLoadingTextIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
			}, 3800);
			phaseTimer = setInterval(() => {
				const elapsed = Date.now() - start;
				if (elapsed < 12_000) setScanPhase("pagespeed");
				else if (elapsed < 28_000) setScanPhase("onpage");
				else if (elapsed < 48_000) setScanPhase("crawl");
				else if (elapsed < 72_000) setScanPhase("local");
				else setScanPhase("ai");
			}, 600);
		}
		return () => {
			if (interval) clearInterval(interval);
			if (phaseTimer) clearInterval(phaseTimer);
		};
	}, [status]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!url || status === "loading") return;

		let finalUrl = url;
		if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
			finalUrl = `https://${finalUrl}`;
		}

		setStatus("loading");
		setLoadingTextIndex(0);
		setErrorMsg("");

		try {
			const res = await fetch(buildPublicApiUrl("/api/audit"), {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					url: finalUrl,
					email,
					name,
					company,
					location,
					cf_turnstile_response: turnstileToken ?? "",
				}),
			});

			let data: {
				error?: string;
				results?: AuditData | null;
				reportId?: string;
				psiDegradedReason?: string | null;
			} | null = null;
			try {
				data = await res.json();
			} catch {
				data = null;
			}

			if (!res.ok) {
				throw new Error(data?.error || "Something went wrong.");
			}

			if (!data?.results) {
				throw new Error("We couldn't complete the audit. Please try again.");
			}

			setResults(data.results);
			setReportId(typeof data.reportId === "string" ? data.reportId : null);
			setStatus("success");
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Failed to fetch audit.";
			setErrorMsg(message);
			setStatus("error");
			setTurnstileToken(null);
		}
	};

	if (status === "success" && results) {
		return (
			<AuditResults
				data={results}
				reportId={reportId}
				contactEmail={email}
				contactName={name}
				onReset={() => {
					setStatus("idle");
					setResults(null);
					setReportId(null);
				}}
			/>
		);
	}

	/* Bronze token inputs — aligned with SalesforceContactForm SF_FIELD pattern. */
	const inputClass =
		"w-full rounded-[0.65rem] border border-[rgb(var(--accent-bronze-rgb)/0.32)] bg-[rgba(8,12,18,0.78)] px-[0.95rem] py-[0.7rem] text-[0.95rem] text-white [caret-color:rgb(var(--accent-bronze-rgb)/0.95)] font-[inherit] transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-white/[0.42] focus:outline-none focus:border-[rgb(var(--accent-bronze-rgb)/0.7)] focus:bg-[rgba(10,14,22,0.92)] focus:shadow-[0_0_0_3px_rgb(var(--accent-bronze-rgb)/0.18)]";

	const labelClass =
		"mb-1.5 block text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-cream)]";

	const turnstileSiteKey = resolveEffectiveSiteKey(
		process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
	);
	const isSubmitDisabled =
		status === "loading" || (!!turnstileSiteKey && !turnstileToken);

	return (
		<div className="relative isolate w-full" id="run-audit">
			{status === "loading" ? (
				<div className="absolute inset-0 z-10 overflow-y-auto rounded-[1.25rem] bg-[rgba(6,10,18,0.97)] p-4 backdrop-blur-md md:p-6">
					<AuditScanProgress
						activePhase={scanPhase}
						message={LOADING_MESSAGES[loadingTextIndex]}
					/>
				</div>
			) : null}

			<form onSubmit={handleSubmit} className="flex flex-col gap-6">
				<div className="relative pb-6 mb-2 border-b border-white/[0.06]">
					<span
						className="pointer-events-none absolute left-0 -bottom-px h-px w-[4.5rem] bg-linear-to-r from-[rgb(var(--accent-bronze-rgb)/0.82)] to-transparent"
						aria-hidden
					/>
					<p className="inline-block text-[0.65rem] font-bold tracking-[0.2em] uppercase text-[rgb(var(--accent-bronze-rgb)/0.85)] mb-2">
						Free · Private · No Account Needed
					</p>
					<h2 className="font-[family-name:var(--font-display)] text-[1.6rem] font-bold tracking-tight text-white sm:text-[1.85rem]">
						Get Your Free Report
					</h2>
					<p className="mt-3 max-w-xl text-[14px] leading-[1.7] text-white/60">
						Enter your site below. We score it on speed, SEO, and trust signals
						in about 60 seconds and send a private report link to your email.
					</p>
				</div>

				<div className="relative">
					<label htmlFor="url" className={labelClass}>
						Website to scan
					</label>
					{/* Phase-3 follow-up: removed the absolute-positioned `https://`
					    overlay span — it visually overlapped the placeholder
					    ("ghost" effect). The handler still prepends `https://`
					    automatically if the user omits it, so we keep
					    type="text" (type="url" would block bare-domain inputs
					    with native browser validation before submit). */}
					<input
						id="url"
						name="url"
						type="text"
						inputMode="url"
						required
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						placeholder="https://yoursite.com"
						autoComplete="url"
						autoCorrect="off"
						autoCapitalize="off"
						spellCheck={false}
						className="w-full rounded-[0.65rem] border border-[rgb(var(--accent-bronze-rgb)/0.32)] bg-[rgba(8,12,18,0.78)] px-[0.95rem] py-[0.95rem] font-mono text-[15px] text-white [caret-color:rgb(var(--accent-bronze-rgb)/0.95)] shadow-[0_18px_40px_-20px_rgba(0,0,0,0.25)] placeholder:font-normal placeholder:text-white/[0.42] transition-[border-color,box-shadow,background-color] duration-200 focus:outline-none focus:border-[rgb(var(--accent-bronze-rgb)/0.7)] focus:bg-[rgba(10,14,22,0.92)] focus:shadow-[0_0_0_3px_rgb(var(--accent-bronze-rgb)/0.18)]"
					/>
				</div>

				<fieldset className="border-0 m-0 p-0">
					<legend className="block w-full text-[0.65rem] font-bold tracking-[0.2em] uppercase text-[rgba(247,244,238,0.58)] mb-2.5 pb-2 border-b border-dashed border-white/[0.06]">
						Where to send the report
					</legend>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<label htmlFor="name" className={labelClass}>
								Your name
							</label>
							<input
								id="name"
								name="name"
								type="text"
								required
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Jane Smith"
								autoComplete="name"
								className={inputClass}
							/>
						</div>
						<div>
							<label htmlFor="company" className={labelClass}>
								Company
							</label>
							<input
								id="company"
								name="company"
								type="text"
								required
								value={company}
								onChange={(e) => setCompany(e.target.value)}
								placeholder="Your business name"
								autoComplete="organization"
								className={inputClass}
							/>
						</div>
						<div>
							<label htmlFor="email" className={labelClass}>
								Email for your report
							</label>
							<input
								id="email"
								name="email"
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@company.com"
								autoComplete="email"
								className={inputClass}
							/>
						</div>
						<div>
							<label htmlFor="location" className={labelClass}>
								City &amp; state
							</label>
							<input
								id="location"
								name="location"
								type="text"
								required
								value={location}
								onChange={(e) => setLocation(e.target.value)}
								placeholder="e.g. Syracuse, NY"
								autoComplete="address-level2"
								className={inputClass}
							/>
						</div>
					</div>
				</fieldset>

				{status === "error" && (
					<div
						className="rounded-xl border border-rose-500/35 bg-rose-950/35 px-4 py-3 text-sm text-rose-100/95"
						role="alert"
						aria-live="polite"
					>
						{errorMsg}
					</div>
				)}

				{turnstileSiteKey && (
					<div className="flex flex-col items-center gap-2 py-4">
						<Turnstile
							siteKey={turnstileSiteKey}
							onSuccess={(token) => setTurnstileToken(token)}
							onExpire={() => setTurnstileToken(null)}
							onError={() => setTurnstileToken(null)}
							options={{ theme: "dark", size: "flexible" }}
						/>
						<p className="text-[0.7rem] font-bold uppercase tracking-widest text-white/30">
							Security check required to proceed
						</p>
					</div>
				)}

				<div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
					<button
						type="submit"
						disabled={isSubmitDisabled}
						aria-disabled={isSubmitDisabled}
						className={`${btnPrimaryAudit} w-full sm:w-auto sm:min-w-[260px]`}
					>
						<span className="relative inline-flex items-center justify-center gap-2">
							{status === "loading" ? "Running audit…" : "Run free audit"}
							{status !== "loading" && (
								<span
									className="transition-transform duration-300 group-hover:translate-x-0.5"
									aria-hidden
								>
									→
								</span>
							)}
						</span>
					</button>

					<div className="text-center sm:text-right">
						<p className="font-mono text-[11px] tracking-tight text-white/45">
							~60-90s · Private report · Shareable URL
						</p>
					</div>
				</div>
			</form>
		</div>
	);
}

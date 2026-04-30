"use client";

import type { AuditData } from "@lh/auditReport";
import { initCursorGlow } from "@lh/lib/cursorGlow";
import {
	RECAPTCHA_ENTERPRISE_ACTION,
	RECAPTCHA_ENTERPRISE_SITE_KEY,
} from "@lh/lib/recaptchaEnterpriseConfig";
import type React from "react";
import { useEffect, useState } from "react";
import { buildPublicApiUrl } from "@/lib/publicApi";
import { AuditResults } from "./AuditResults";
import { AuditScanProgress, type ScanPhase } from "./AuditScanProgress";

const LOADING_MESSAGES = [
	"Calling Google PageSpeed Insights for mobile lab scores…",
	"Reading your homepage HTML for titles, headings, and schema…",
	"Checking robots.txt, sitemap, and redirect behavior…",
	"Pulling optional local/maps context when configured…",
	"Running the AI pass for your executive summary and top fixes…",
];

type RecaptchaEnterpriseApi = {
	ready(callback: () => void): void;
	execute(siteKey: string, options: { action: string }): Promise<string>;
};

declare global {
	interface Window {
		grecaptcha?: {
			enterprise?: RecaptchaEnterpriseApi;
		};
	}
}

async function getRecaptchaEnterpriseToken(): Promise<string> {
	if (typeof window === "undefined") return "";

	const enterprise = window.grecaptcha?.enterprise;
	if (!enterprise) return "";

	return new Promise((resolve, reject) => {
		enterprise.ready(() => {
			enterprise
				.execute(RECAPTCHA_ENTERPRISE_SITE_KEY, {
					action: RECAPTCHA_ENTERPRISE_ACTION,
				})
				.then(resolve)
				.catch(reject);
		});
	});
}

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
			let recaptchaToken = "";
			try {
				recaptchaToken = await getRecaptchaEnterpriseToken();
			} catch {
				throw new Error(
					"Security check could not finish. Please refresh and try again.",
				);
			}
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
					recaptchaToken,
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

	/* WCAG: placeholder contrast bumped from white/28 → white/45 so the
	   hint text passes 4.5:1 on the dark input fill. Focus ring also
	   strengthened for keyboard a11y. */
	const inputClass =
		"lh-field w-full rounded-lg border border-white/[0.14] bg-[rgba(7,10,17,0.74)] px-4 py-3 text-[14.5px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] placeholder:text-white/45 transition-[border-color,box-shadow,background-color] focus:border-[rgb(var(--accent-bronze-rgb)/0.66)] focus:bg-[rgba(10,13,21,0.92)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-bronze-rgb)/0.32)]";

	const labelClass =
		"mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent-bronze-muted)]";

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

			<form onSubmit={handleSubmit} className="lh-form-grid">
				<div className="lh-form-header">
					<p className="lighthouse-result-eyebrow">
						Free · Private · No Account Needed
					</p>
					<h2 className="font-report text-[1.6rem] font-semibold tracking-tight text-white/98 sm:text-[1.85rem]">
						Get Your Free Report
					</h2>
					<p className="mt-3 max-w-xl text-[14px] leading-[1.7] text-white/58">
						Enter your site below. We score it on speed, SEO, and trust signals
						in about 60 seconds and send a private report link to your email.
					</p>
				</div>

				<div className="lh-url-block">
					<label htmlFor="url" className={labelClass}>
						Website to scan
					</label>
					{/* Phase-3 follow-up: removed the absolute-positioned `https://`
					    overlay span — it visually overlapped the placeholder
					    ("ghost" effect). The handler at line 108 still prepends
					    `https://` automatically if the user omits it. */}
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
						className="lh-field lh-url-input w-full rounded-lg border border-[rgb(var(--accent-bronze-rgb)/0.42)] bg-[rgba(10,14,22,0.88)] px-4 py-4 font-mono text-[15px] text-white shadow-[0_18px_40px_-20px_rgba(201,168,108,0.15),inset_0_1px_0_rgba(255,255,255,0.06)] placeholder:font-normal placeholder:text-white/35 transition-[border-color,box-shadow,background-color] focus:border-[rgb(var(--accent-bronze-rgb)/0.72)] focus:bg-[rgba(12,16,25,0.96)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-bronze-rgb)/0.32)]"
					/>
				</div>

				<fieldset className="lh-fieldset">
					<legend className="lh-legend">Where to send the report</legend>
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

				<div className="lh-submit-row">
					<button
						type="submit"
						disabled={status === "loading"}
						aria-disabled={status === "loading"}
						className="lh-submit-btn group relative w-full cursor-pointer overflow-hidden rounded-lg px-4 py-4 text-[15px] font-bold tracking-normal text-[#100d08] transition-[transform,box-shadow,opacity] hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[260px]"
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

					<div className="lh-submit-meta">
						<p className="font-mono text-[11px] tracking-tight text-white/45">
							~60-90s · Private report · Shareable URL
						</p>
						<p className="lh-recaptcha-note">
							Protected by reCAPTCHA Enterprise. Google{" "}
							<a href="https://policies.google.com/privacy">Privacy Policy</a>{" "}
							and <a href="https://policies.google.com/terms">Terms</a> apply.
						</p>
					</div>
				</div>
			</form>
		</div>
	);
}

"use client";

import type { AuditData } from "@lh/auditReport";
import type React from "react";
import { useEffect, useState } from "react";
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

	const [loadingTextIndex, setLoadingTextIndex] = useState(0);
	const [scanPhase, setScanPhase] = useState<ScanPhase>("pagespeed");

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
			const res = await fetch("/api/audit", {
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

	const inputClass =
		"lighthouse-field w-full rounded-xl border border-white/[0.1] bg-[rgba(6,10,18,0.55)] px-4 py-3.5 text-[15px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-white/35 transition-[border-color,box-shadow] focus:border-sky-400/45 focus:outline-none focus:ring-2 focus:ring-sky-500/25";

	return (
		<div className="relative isolate w-full">
			{status === "loading" ? (
				<div className="absolute inset-0 z-10 overflow-y-auto rounded-[1.25rem] bg-[rgba(6,10,18,0.97)] p-4 backdrop-blur-md md:p-6">
					<AuditScanProgress
						activePhase={scanPhase}
						message={LOADING_MESSAGES[loadingTextIndex]}
					/>
				</div>
			) : null}

			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="border-b border-white/[0.08] pb-6">
					<p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300/80">
						Free scan
					</p>
					<h2 className="font-display text-xl font-bold tracking-tight text-white md:text-2xl">
						Run your audit
					</h2>
					<p className="mt-2 max-w-xl text-sm leading-relaxed text-white/58">
						PageSpeed lab data, technical SEO signals, and a plain-English
						summary. We use your email to deliver the report link only — no
						third-party CRM embeds on this form.
					</p>
				</div>

				<div>
					<label
						htmlFor="url"
						className="mb-2 block text-xs font-semibold uppercase tracking-wider text-sky-200/75"
					>
						Website URL
					</label>
					<input
						id="url"
						name="url"
						type="text"
						required
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						placeholder="yoursite.com"
						autoComplete="url"
						className={inputClass}
					/>
				</div>

				<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
					<div>
						<label
							htmlFor="name"
							className="mb-2 block text-xs font-semibold uppercase tracking-wider text-sky-200/75"
						>
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
						<label
							htmlFor="company"
							className="mb-2 block text-xs font-semibold uppercase tracking-wider text-sky-200/75"
						>
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
				</div>

				<div>
					<label
						htmlFor="email"
						className="mb-2 block text-xs font-semibold uppercase tracking-wider text-sky-200/75"
					>
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
					<label
						htmlFor="location"
						className="mb-2 block text-xs font-semibold uppercase tracking-wider text-sky-200/75"
					>
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

				{status === "error" && (
					<div
						className="rounded-xl border border-rose-500/35 bg-rose-950/35 px-4 py-3 text-sm text-rose-100/95"
						role="alert"
						aria-live="polite"
					>
						{errorMsg}
					</div>
				)}

				<button
					type="submit"
					disabled={status === "loading"}
					aria-disabled={status === "loading"}
					className="lighthouse-submit mt-2 w-full cursor-pointer rounded-xl border border-sky-400/40 bg-gradient-to-br from-sky-500/90 to-blue-700/95 px-4 py-4 text-base font-bold tracking-tight text-white shadow-[0_20px_48px_-24px_rgba(37,99,235,0.95)] transition-[transform,box-shadow,opacity] hover:-translate-y-px hover:shadow-[0_24px_56px_-22px_rgba(56,189,248,0.45)] disabled:cursor-not-allowed disabled:opacity-65"
				>
					{status === "loading" ? "Running audit…" : "Run free audit"}
				</button>
				<p className="text-center text-[11px] leading-relaxed text-white/38">
					Lighthouse Scanner v2 · Shareable report when storage is enabled.
				</p>
			</form>
		</div>
	);
}

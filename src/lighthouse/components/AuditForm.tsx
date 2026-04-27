"use client";

import { LIGHTHOUSE_TURNSTILE_HOST_ID } from "@lh/constants";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { type AuditData, AuditResults } from "./AuditResults";

const LOADING_MESSAGES = [
	"Running Google PageSpeed scan…",
	"Analyzing Core Web Vitals…",
	"Checking render-blocking resources…",
	"Testing mobile accessibility…",
	"Compiling your diagnostic…",
];

type TurnstileApi = {
	ready: (fn: () => void) => void;
	render: (
		container: string | HTMLElement,
		options: Record<string, unknown>,
	) => string;
	reset: (widgetIdOrContainer: string | HTMLElement) => void;
	execute: (widgetIdOrContainer: string | HTMLElement) => void;
	remove: (widgetId: string) => void;
};

type WindowWithTurnstile = Window & {
	turnstile?: TurnstileApi;
};

export function AuditForm({ turnstileSiteKey }: { turnstileSiteKey: string }) {
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
	const widgetIdRef = useRef<string | null>(null);
	const pendingResolveRef = useRef<((token: string | null) => void) | null>(
		null,
	);
	const siteKeyTrimmed = turnstileSiteKey?.trim() ?? "";
	const hasTurnstile = Boolean(siteKeyTrimmed);

	const mountInvisibleWidget = useCallback(() => {
		if (!hasTurnstile) return;
		const w = window as WindowWithTurnstile;
		const host = document.getElementById(LIGHTHOUSE_TURNSTILE_HOST_ID);
		if (!host || !w.turnstile || widgetIdRef.current) return;

		const onSuccess = (token: string) => {
			pendingResolveRef.current?.(token);
			pendingResolveRef.current = null;
		};
		const onExpireOrError = () => {
			pendingResolveRef.current?.(null);
			pendingResolveRef.current = null;
		};

		const runRender = () => {
			try {
				const id = w.turnstile?.render(host, {
					sitekey: siteKeyTrimmed,
					size: "invisible",
					theme: "dark",
					appearance: "interaction-only",
					/** Cloudflare: use `execution: "execute"` + `turnstile.execute(id)` on submit. */
					execution: "execute",
					callback: onSuccess,
					"expired-callback": onExpireOrError,
					"error-callback": onExpireOrError,
					"timeout-callback": onExpireOrError,
				});
				if (id) widgetIdRef.current = id;
			} catch {
				widgetIdRef.current = null;
			}
		};

		if (w.turnstile.ready) {
			w.turnstile.ready(runRender);
		} else {
			runRender();
		}
	}, [hasTurnstile, siteKeyTrimmed]);

	useEffect(() => {
		if (typeof window === "undefined" || !hasTurnstile) return;

		const w = window as WindowWithTurnstile;
		const poll = window.setInterval(() => {
			mountInvisibleWidget();
			if (widgetIdRef.current) {
				window.clearInterval(poll);
			}
		}, 150);

		return () => {
			window.clearInterval(poll);
			const id = widgetIdRef.current;
			if (id && w.turnstile?.remove) {
				try {
					w.turnstile.remove(id);
				} catch {
					/* ignore */
				}
			}
			widgetIdRef.current = null;
		};
	}, [hasTurnstile, mountInvisibleWidget]);

	useEffect(() => {
		let interval: ReturnType<typeof setInterval> | undefined;
		if (status === "loading") {
			interval = setInterval(() => {
				setLoadingTextIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
			}, 3500);
		}
		return () => {
			if (interval) clearInterval(interval);
		};
	}, [status]);

	const requestTurnstileToken = useCallback((): Promise<string | null> => {
		if (!hasTurnstile) {
			return Promise.resolve("");
		}
		return new Promise((resolve) => {
			const w = window as WindowWithTurnstile;
			const host = document.getElementById(LIGHTHOUSE_TURNSTILE_HOST_ID);
			if (!host || !w.turnstile) {
				resolve(null);
				return;
			}
			mountInvisibleWidget();
			const wid = widgetIdRef.current;
			if (!wid) {
				resolve(null);
				return;
			}
			pendingResolveRef.current = resolve;
			try {
				w.turnstile.execute(wid);
			} catch {
				pendingResolveRef.current = null;
				resolve(null);
			}
			window.setTimeout(() => {
				if (pendingResolveRef.current === resolve) {
					pendingResolveRef.current = null;
					resolve(null);
				}
			}, 25_000);
		});
	}, [hasTurnstile, mountInvisibleWidget]);

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
			let turnstileToken = "";
			if (hasTurnstile) {
				turnstileToken = (await requestTurnstileToken()) ?? "";
				if (!turnstileToken) {
					setErrorMsg(
						"Security check did not complete. In Cloudflare Turnstile, add this site’s hostname (and Netlify preview hostnames) to the widget, then try again.",
					);
					setStatus("error");
					const w = window as WindowWithTurnstile;
					const wid = widgetIdRef.current;
					if (wid && w.turnstile?.reset) {
						try {
							w.turnstile.reset(wid);
						} catch {
							/* ignore */
						}
					}
					return;
				}
			}

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
					turnstileToken,
				}),
			});

			let data: {
				error?: string;
				results?: AuditData | null;
				reportId?: string;
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
			const w = window as WindowWithTurnstile;
			const wid = widgetIdRef.current;
			if (wid && w.turnstile?.reset) {
				try {
					w.turnstile.reset(wid);
				} catch {
					/* ignore */
				}
			}
		}
	};

	if (status === "success" && results) {
		return (
			<AuditResults
				data={results}
				reportId={reportId}
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
			{status === "loading" && (
				<div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[1.25rem] bg-[rgba(6,10,18,0.94)] p-8 text-center backdrop-blur-md">
					<div
						className="mb-6 h-14 w-14 animate-spin rounded-full border-2 border-sky-500/20 border-t-sky-400"
						aria-hidden
					/>
					<p className="mb-2 font-display text-lg font-semibold tracking-tight text-white md:text-xl">
						{LOADING_MESSAGES[loadingTextIndex]}
					</p>
					<p className="max-w-sm text-sm leading-relaxed text-white/55">
						Deep scan — usually under a minute. You can leave this tab open.
					</p>
				</div>
			)}

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
						summary. We use your email only to deliver the report link.
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

			{/* Outside <form>: avoids Turnstile iframe/hidden-input "form not connected" issues. Explicit render — no `cf-turnstile` class (Cloudflare docs). */}
			{hasTurnstile ? (
				<div
					id={LIGHTHOUSE_TURNSTILE_HOST_ID}
					className="pointer-events-none absolute left-0 top-0 h-px w-px overflow-hidden opacity-0"
					data-sitekey={siteKeyTrimmed}
					aria-hidden
				/>
			) : null}
		</div>
	);
}

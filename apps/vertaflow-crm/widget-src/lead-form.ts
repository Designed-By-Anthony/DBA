/**
 * Source for `public/widgets/lead-form.js` — bundled with esbuild (`pnpm build:lead-widget`).
 * IIFE: reads `tenant` + `sig` from the script tag query string, fetches skin from Agency OS,
 * POSTs to `/api/embed/lead/submit`.
 * (Excluded from Next `tsc` — see tsconfig.json.)
 */
type TurnstileApi = {
	render: (
		el: HTMLElement,
		opts: {
			sitekey: string;
			callback: (token: string) => void;
			"error-callback"?: () => void;
			"expired-callback"?: () => void;
		},
	) => string;
	reset?: (widgetId: string) => void;
};

type Skin = {
	tenantId: string;
	brandName: string;
	brandColor: string;
	brandLogoUrl: string | null;
	turnstileSiteKey: string | null;
};

function scriptParams(): { base: string; tenant: string; sig: string } {
	const cur = document.currentScript as HTMLScriptElement | null;
	const src = cur?.src || "";
	let u: URL;
	try {
		u = new URL(src);
	} catch {
		throw new Error("DBA Lead Widget: invalid script src");
	}
	const tenant = u.searchParams.get("tenant")?.trim() || "";
	const sig = u.searchParams.get("sig")?.trim() || "";
	if (!tenant || !sig) {
		throw new Error(
			"DBA Lead Widget: add ?tenant=<Clerk org id>&sig=<hmac> to the script URL",
		);
	}
	const base = `${u.origin}`;
	return { base, tenant, sig };
}

function el<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	props: Partial<HTMLElementTagNameMap[K]> & {
		style?: Partial<CSSStyleDeclaration>;
	},
	children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
	const n = document.createElement(tag);
	Object.assign(n, props);
	if (props.style) {
		Object.assign(n.style, props.style);
	}
	for (const c of children) {
		n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
	}
	return n;
}

async function fetchSkin(
	base: string,
	tenant: string,
	sig: string,
): Promise<Skin> {
	const url = `${base}/api/embed/lead/skin?tenant=${encodeURIComponent(tenant)}&sig=${encodeURIComponent(sig)}`;
	const res = await fetch(url, { method: "GET", credentials: "omit" });
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(
			(err as { error?: string }).error ||
				`Skin request failed (${res.status})`,
		);
	}
	return res.json() as Promise<Skin>;
}

function getTurnstile(): TurnstileApi | undefined {
	return (window as unknown as { turnstile?: TurnstileApi }).turnstile;
}

function resetTurnstileWidget(id: string | undefined) {
	if (!id) return;
	const t = getTurnstile();
	if (t?.reset) t.reset(id);
}

function loadTurnstileScript(): Promise<void> {
	if (getTurnstile()) return Promise.resolve();
	return new Promise((resolve, reject) => {
		const s = document.createElement("script");
		s.src =
			"https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
		s.async = true;
		s.onload = () => resolve();
		s.onerror = () => reject(new Error("Turnstile failed to load"));
		document.head.appendChild(s);
	});
}

(function boot() {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", () => init().catch(showErr));
	} else {
		void init().catch(showErr);
	}

	function showErr(e: unknown) {
		const msg = e instanceof Error ? e.message : "Lead widget failed";
		console.error("[DBA Lead Widget]", e);
		const d = el("div", {
			style: {
				padding: "12px",
				borderRadius: "8px",
				background: "#1a1a24",
				color: "#f87171",
				fontFamily: "system-ui, sans-serif",
				fontSize: "13px",
			},
		});
		d.textContent = msg;
		document.body.appendChild(d);
	}

	async function init() {
		const { base, tenant, sig } = scriptParams();
		const skin = await fetchSkin(base, tenant, sig);

		const root = el("div", {
			className: "dba-lead-widget",
			style: {
				boxSizing: "border-box",
				fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
				maxWidth: "420px",
				padding: "20px",
				borderRadius: "12px",
				border: "1px solid rgba(255,255,255,0.12)",
				background: "rgba(15,15,20,0.95)",
				color: "#f4f4f5",
			},
		});

		const accent = skin.brandColor || "#2563eb";
		const title = el("h3", {
			style: {
				margin: "0 0 16px",
				fontSize: "18px",
				fontWeight: "600",
				color: "#fff",
				display: "flex",
				alignItems: "center",
				gap: "10px",
			},
		});
		if (skin.brandLogoUrl) {
			const img = el("img", {
				src: skin.brandLogoUrl,
				alt: "",
				style: {
					width: "32px",
					height: "32px",
					objectFit: "contain",
					borderRadius: "6px",
				},
			});
			title.appendChild(img);
		}
		title.appendChild(
			document.createTextNode(skin.brandName || "Get in touch"),
		);
		root.appendChild(title);

		const form = el("form", {
			style: { display: "flex", flexDirection: "column", gap: "12px" },
		});

		const inp = (
			name: string,
			label: string,
			type: string,
			required: boolean,
			ph?: string,
		) => {
			const wrap = el("label", {
				style: { display: "flex", flexDirection: "column", gap: "4px" },
			});
			wrap.appendChild(
				el("span", { style: { fontSize: "12px", color: "#a1a1aa" } }, [label]),
			);
			const input = el("input", {
				name,
				type,
				required,
				placeholder: ph || "",
				style: {
					padding: "10px 12px",
					borderRadius: "8px",
					border: "1px solid rgba(255,255,255,0.15)",
					background: "rgba(0,0,0,0.25)",
					color: "#fff",
					fontSize: "14px",
					outline: "none",
				},
			});
			wrap.appendChild(input);
			return wrap;
		};

		form.appendChild(inp("name", "Name", "text", true));
		form.appendChild(inp("email", "Email", "email", true));
		form.appendChild(inp("phone", "Phone", "tel", false));
		form.appendChild(inp("company", "Company", "text", false));
		const msgWrap = el("label", {
			style: { display: "flex", flexDirection: "column", gap: "4px" },
		});
		msgWrap.appendChild(
			el("span", { style: { fontSize: "12px", color: "#a1a1aa" } }, [
				"Message",
			]),
		);
		const ta = el("textarea", {
			name: "message",
			rows: 4,
			style: {
				padding: "10px 12px",
				borderRadius: "8px",
				border: "1px solid rgba(255,255,255,0.15)",
				background: "rgba(0,0,0,0.25)",
				color: "#fff",
				fontSize: "14px",
				resize: "vertical",
				outline: "none",
			},
		});
		msgWrap.appendChild(ta);
		form.appendChild(msgWrap);

		// Honeypot
		const hp = el("input", {
			type: "text",
			name: "_hp",
			tabIndex: -1,
			autoComplete: "off",
			style: {
				position: "absolute",
				left: "-9999px",
				opacity: "0",
				height: "0",
				width: "0",
			},
		});
		form.appendChild(hp);

		const tsHost = el("div", { id: "dba-turnstile-host" });
		form.appendChild(tsHost);

		const status = el("p", {
			style: {
				margin: "0",
				minHeight: "1.2em",
				fontSize: "13px",
				color: "#a1a1aa",
			},
		});
		form.appendChild(status);

		const btn = el(
			"button",
			{
				type: "submit",
				style: {
					marginTop: "4px",
					padding: "12px 16px",
					borderRadius: "8px",
					border: "none",
					background: accent,
					color: "#fff",
					fontWeight: "600",
					fontSize: "15px",
					cursor: "pointer",
				},
			},
			["Send"],
		);
		form.appendChild(btn);

		let turnstileToken = "";
		let turnstileWidgetId: string | undefined;

		if (skin.turnstileSiteKey) {
			await loadTurnstileScript();
			const ts = getTurnstile();
			if (ts) {
				turnstileWidgetId = ts.render(tsHost, {
					sitekey: skin.turnstileSiteKey,
					callback: (t: string) => {
						turnstileToken = t;
					},
					"error-callback": () => {
						turnstileToken = "";
					},
					"expired-callback": () => {
						turnstileToken = "";
					},
				});
			}
		}

		form.addEventListener("submit", async (ev) => {
			ev.preventDefault();
			status.textContent = "Sending…";
			btn.setAttribute("disabled", "true");

			const fd = new FormData(form);
			const name = String(fd.get("name") || "").trim();
			const email = String(fd.get("email") || "").trim();
			const phone = String(fd.get("phone") || "").trim();
			const company = String(fd.get("company") || "").trim();
			const message = String(fd.get("message") || "").trim();
			const hpVal = String(fd.get("_hp") || "").trim();

			const payload: Record<string, unknown> = {
				tenantId: tenant,
				sig,
				name,
				email,
				phone: phone || undefined,
				company: company || undefined,
				message: message || undefined,
				source: "embed_widget",
				_hp: hpVal,
				pageUrl: typeof location !== "undefined" ? location.href : undefined,
				referrerUrl:
					typeof document !== "undefined"
						? document.referrer || undefined
						: undefined,
			};

			if (skin.turnstileSiteKey) {
				payload.cfTurnstileResponse = turnstileToken;
			}

			try {
				const res = await fetch(`${base}/api/embed/lead/submit`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
					credentials: "omit",
				});
				const data = (await res.json().catch(() => ({}))) as {
					error?: string;
					success?: boolean;
				};
				if (!res.ok) {
					status.style.color = "#f87171";
					status.textContent = data.error || "Something went wrong.";
					resetTurnstileWidget(turnstileWidgetId);
					return;
				}
				status.style.color = "#4ade80";
				status.textContent = "Thanks — we received your message.";
				form.reset();
				resetTurnstileWidget(turnstileWidgetId);
			} catch {
				status.style.color = "#f87171";
				status.textContent = "Network error. Please try again.";
			} finally {
				btn.removeAttribute("disabled");
			}
		});

		root.appendChild(form);

		const mount =
			document.getElementById("dba-lead-form") ||
			document.currentScript?.parentElement;
		if (mount) {
			mount.appendChild(root);
		} else {
			document.body.appendChild(root);
		}
	}
})();

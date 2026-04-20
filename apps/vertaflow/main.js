import { installGlobalSyncProvider } from "./src/providers/GlobalSyncProvider";
import { registerServiceWorker } from "./src/pwa/registerServiceWorker";
import {
	captureHandledError,
	captureMessage,
	initSentryFromRuntimeConfig,
	setSentryTags,
} from "./src/telemetry/sentry";
import { registerGlobalErrorHandlers } from "./src/telemetry/globalErrorHandlers";
import { getRuntimeConfig } from "./src/runtime/config";
import { buildFaqStructuredData, buildBlogCollectionStructuredData } from "./src/seo/structuredData";
import {
	marketingVerticalLabels as verticalLabels,
	marketingVerticals as verticals,
} from "./src/marketing-verticals";

// ─── VertaFlow Marketing — Interactive Logic ───

const runtimeConfig = getRuntimeConfig();

initSentryFromRuntimeConfig(runtimeConfig);
registerGlobalErrorHandlers();

setSentryTags({
	app: "vertaflow-marketing",
	env: runtimeConfig.envName,
	host: runtimeConfig.appHost,
});

// ── Render vertical preview ──
function renderVertical(id) {
	const v = verticals[id];
	if (!v) return;

	const sidebar = document.getElementById("previewSidebar");
	const pipeline = document.getElementById("previewPipeline");
	const kpis = document.getElementById("previewKpis");

	// Sidebar
	sidebar.innerHTML = v.sidebar
		.map(
			(item, i) =>
				`<div class="switcher-sidebar-item${i === 0 ? " active" : ""}">${item}</div>`,
		)
		.join("");

	// Pipeline
	pipeline.innerHTML = v.pipeline
		.map(
			(s) =>
				`<span class="switcher-stage" style="color:${s.color};border-color:${s.color}33;background:${s.color}11">${s.label}</span>`,
		)
		.join("");

	// KPIs
	kpis.innerHTML = v.kpis
		.map(
			(k) =>
				`<div class="switcher-kpi"><div class="switcher-kpi-value">${k.value}</div><div class="switcher-kpi-label">${k.label}</div></div>`,
		)
		.join("");

	// Animate in
	sidebar.style.opacity = "0";
	pipeline.style.opacity = "0";
	kpis.style.opacity = "0";
	requestAnimationFrame(() => {
		sidebar.style.transition = "opacity .4s ease";
		pipeline.style.transition = "opacity .4s ease .1s";
		kpis.style.transition = "opacity .4s ease .2s";
		sidebar.style.opacity = "1";
		pipeline.style.opacity = "1";
		kpis.style.opacity = "1";
	});

	document.body.setAttribute("data-active-vertical", id);
	const canonicalForVertical = `${runtimeConfig.siteUrl}/?vertical=${verticalLabels[id] ?? "service-pro"}`;
	const canonicalLink = document.querySelector('link[rel="canonical"]');
	if (canonicalLink) {
		canonicalLink.setAttribute("href", canonicalForVertical);
	}

	setSentryTags({
		vertical: id,
	});
	captureMessage("vertical_preview_loaded", {
		area: "ui",
		feature: "vertical_tab",
		severity: "info",
		metadata: { vertical: id },
	});
}

// ── Tab switching ──
function activateVerticalTab(verticalId) {
	const tab = document.querySelector(`.switcher-tab[data-vertical="${verticalId}"]`);
	if (!tab) return false;
	document.querySelectorAll(".switcher-tab").forEach((t) => {
		t.classList.remove("active");
		t.setAttribute("aria-selected", "false");
	});
	tab.classList.add("active");
	tab.setAttribute("aria-selected", "true");
	renderVertical(verticalId);
	return true;
}

document.getElementById("verticalTabs")?.addEventListener("click", (e) => {
	const tab = e.target.closest(".switcher-tab");
	if (!tab?.dataset.vertical) return;
	activateVerticalTab(tab.dataset.vertical);
});

// Deep link: /?vertical=service-pro → tab + preview
function verticalIdFromQueryParam(param) {
	if (!param) return null;
	const slug = String(param).toLowerCase();
	const entry = Object.entries(verticalLabels).find(([, label]) => label === slug);
	return entry ? entry[0] : verticals[param] ? param : null;
}

const initialVertical =
	verticalIdFromQueryParam(new URLSearchParams(window.location.search).get("vertical")) ??
	"contractor";

activateVerticalTab(initialVertical);

installGlobalSyncProvider();
void registerServiceWorker(undefined, {
	onFailure: (err) =>
		captureHandledError(err, {
			area: "pwa",
			feature: "service_worker_register",
			severity: "warning",
		}),
});

const faqJsonLdTag = document.getElementById("vf-faq-jsonld");
if (faqJsonLdTag) {
	faqJsonLdTag.textContent = JSON.stringify(buildFaqStructuredData(), null, 2);
}
const blogJsonLdTag = document.getElementById("vf-blog-jsonld");
if (blogJsonLdTag) {
	blogJsonLdTag.textContent = JSON.stringify(buildBlogCollectionStructuredData(runtimeConfig.siteUrl), null, 2);
}

// ── Scroll reveal ──
const observer = new IntersectionObserver(
	(entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				entry.target.classList.add("visible");
				observer.unobserve(entry.target);
			}
		});
	},
	{ threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
);

document.querySelectorAll(".reveal").forEach((el) => {
	observer.observe(el);
});

// ── Nav scroll state ──
const nav = document.getElementById("mainNav");
window.addEventListener(
	"scroll",
	() => {
		nav?.classList.toggle("scrolled", window.scrollY > 40);
	},
	{ passive: true },
);

// ── FAQ accordion ──
document.querySelectorAll(".faq-question").forEach((btn) => {
	btn.addEventListener("click", () => {
		const item = btn.closest(".faq-item");
		const wasOpen = item.classList.contains("open");
		document.querySelectorAll(".faq-item.open").forEach((i) => {
			i.classList.remove("open");
		});
		if (!wasOpen) item.classList.add("open");
	});
});

// ── Mobile hamburger (simple toggle) ──
document.getElementById("hamburgerBtn")?.addEventListener("click", () => {
	const links = document.querySelector(".nav-links");
	if (!links) return;
	const isOpen = links.style.display === "flex";
	links.style.display = isOpen ? "none" : "flex";
	links.style.flexDirection = "column";
	links.style.position = "absolute";
	links.style.top = "100%";
	links.style.left = "0";
	links.style.right = "0";
	links.style.background = "rgba(7,9,14,.97)";
	links.style.padding = "1rem 2rem 2rem";
	links.style.borderBottom = "1px solid rgba(255,255,255,.08)";
	if (isOpen) links.removeAttribute("style");
});

// ── Request Access form → POST to Agency OS `POST /api/lead` (public contract) ──
document.getElementById("requestForm")?.addEventListener("submit", async (e) => {
	e.preventDefault();
	const form = e.target;
	const btn = document.getElementById("requestSubmitBtn");
	const formData = new FormData(form);
	if (String(formData.get("_hp") || "").trim() !== "") return;

	const vfPublic =
		typeof window !== "undefined" && window.__VF_PUBLIC__ && typeof window.__VF_PUBLIC__ === "object"
			? window.__VF_PUBLIC__
			: {};
	const vertical = String(formData.get("vertical") || "");
	const webDesign = formData.get("webDesignInterest") === "yes";

	const send = async (cfTurnstileResponse) => {
		const payload = {
			name: String(formData.get("name") || "").trim(),
			email: String(formData.get("email") || "").trim(),
			company: String(formData.get("business") || "").trim() || undefined,
			website: String(formData.get("website") || "").trim() || undefined,
			message: `VertaFlow early access | vertical=${vertical} | web_design_interest=${webDesign ? "yes" : "no"}`,
			source: `vertaflow_io|lane:vertaflow_product|vertical:${vertical}`,
			agencyId: String(vfPublic.crmDefaultAgencyId || "").trim() || undefined,
			offer_type: "vertaflow_early_access",
			cta_source: "vertaflow_io_request_access",
			page_context: "vertaflow_marketing_home",
			lead_source: "VertaFlow marketing — early access",
			page_url: window.location.href,
			page_title: document.title,
			source_page: window.location.pathname,
			referrer_url: document.referrer || "",
			_hp: "",
			cfTurnstileResponse: cfTurnstileResponse || undefined,
		};

		const res = await fetch(runtimeConfig.crmLeadUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json", Accept: "application/json" },
			body: JSON.stringify(payload),
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
	};

	btn.disabled = true;
	btn.textContent = "Submitting...";

	const turnstileEl = form.querySelector(".cf-turnstile");
	const ts = window.turnstile;
	const siteKey =
		(turnstileEl && turnstileEl.getAttribute("data-sitekey") && turnstileEl.getAttribute("data-sitekey").trim()) ||
		String(vfPublic.turnstileSiteKey || "").trim();

	try {
		if (siteKey && ts && typeof ts.execute === "function" && turnstileEl) {
			await new Promise((resolve) => {
				form.__vfResolve = (token) => {
					delete form.__vfResolve;
					send(token || "").then(resolve).catch(resolve);
				};
				try {
					ts.execute(turnstileEl);
				} catch {
					delete form.__vfResolve;
					send("").then(resolve).catch(resolve);
				}
			});
		} else {
			await send("");
		}

		form.hidden = true;
		document.getElementById("requestSuccess").hidden = false;
	} catch (_err) {
		captureHandledError(_err, {
			area: "network",
			feature: "request_access_form",
			severity: "error",
			metadata: {
				crmLeadUrl: runtimeConfig.crmLeadUrl,
			},
		});
		form.hidden = true;
		document.getElementById("requestSuccess").hidden = false;
	} finally {
		btn.disabled = false;
		btn.textContent = "Request Early Access";
		if (turnstileEl && window.turnstile?.reset) {
			try {
				window.turnstile.reset(turnstileEl);
			} catch {
				/* ignore */
			}
		}
	}
});

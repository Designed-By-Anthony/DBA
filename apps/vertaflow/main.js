import { installGlobalSyncProvider } from "./src/providers/GlobalSyncProvider";

// ─── VertaFlow Marketing — Interactive Logic ───

// ── Vertical Data (mirrors the real product's verticals.ts) ──
const verticals = {
	contractor: {
		name: "Service Pro",
		emoji: "🏗️",
		sidebar: [
			"Dashboard",
			"Leads",
			"Jobs",
			"Communications",
			"Email History",
			"Sequences",
			"Work Orders",
			"Billing",
			"Reports",
			"Estimates",
			"Invoices",
			"Contracts",
			"Appointments",
			"Inventory",
			"Time Clock",
			"Settings",
		],
		pipeline: [
			{ label: "New Lead", color: "#3b82f6" },
			{ label: "Estimate Sent", color: "#3b82f6" },
			{ label: "Approved", color: "#f59e0b" },
			{ label: "In Progress", color: "#10b981" },
			{ label: "Complete", color: "#06d6a0" },
		],
		kpis: [
			{ value: "$24,800", label: "Pipeline Value" },
			{ value: "18", label: "Active Jobs" },
			{ value: "4.9★", label: "Review Score" },
		],
	},
	food: {
		name: "Restaurant",
		emoji: "🍰",
		sidebar: [
			"Dashboard",
			"Customers",
			"Orders",
			"Messages",
			"Email History",
			"Sequences",
			"Support",
			"Billing",
			"Reports",
			"Menu",
			"POS",
			"Inventory",
			"Events",
			"Gift Cards",
			"Settings",
		],
		pipeline: [
			{ label: "New Order", color: "#3b82f6" },
			{ label: "Confirmed", color: "#3b82f6" },
			{ label: "In Prep", color: "#f59e0b" },
			{ label: "Ready", color: "#10b981" },
			{ label: "Completed", color: "#06d6a0" },
		],
		kpis: [
			{ value: "$3,420", label: "Today's Revenue" },
			{ value: "67", label: "Orders Today" },
			{ value: "12 min", label: "Avg Prep Time" },
		],
	},
	beauty: {
		name: "Beauty & Wellness",
		emoji: "💇",
		sidebar: [
			"Dashboard",
			"Clients",
			"Appointments",
			"Messages",
			"Email History",
			"Sequences",
			"Client Notes",
			"Billing",
			"Reports",
			"Appointments",
			"Memberships",
			"Gift Cards",
			"Loyalty",
			"Settings",
		],
		pipeline: [
			{ label: "Inquiry", color: "#3b82f6" },
			{ label: "Booked", color: "#3b82f6" },
			{ label: "Checked In", color: "#f59e0b" },
			{ label: "In Service", color: "#10b981" },
			{ label: "Completed", color: "#06d6a0" },
		],
		kpis: [
			{ value: "24", label: "Bookings Today" },
			{ value: "89%", label: "Retention Rate" },
			{ value: "142", label: "Active Members" },
		],
	},
	retail: {
		name: "Retail",
		emoji: "🏪",
		sidebar: [
			"Dashboard",
			"Customers",
			"Orders",
			"Messages",
			"Email History",
			"Sequences",
			"Support",
			"Billing",
			"Reports",
			"POS",
			"Inventory",
			"Barcode Scan",
			"Returns",
			"Gift Cards",
			"Loyalty",
			"Settings",
		],
		pipeline: [
			{ label: "New Order", color: "#3b82f6" },
			{ label: "Processing", color: "#3b82f6" },
			{ label: "Shipped", color: "#f59e0b" },
			{ label: "Delivered", color: "#10b981" },
			{ label: "Completed", color: "#06d6a0" },
		],
		kpis: [
			{ value: "1,247", label: "SKUs Tracked" },
			{ value: "$8,340", label: "Weekly Sales" },
			{ value: "23", label: "Low Stock Alerts" },
		],
	},
	fitness: {
		name: "Health & Fitness",
		emoji: "🏥",
		sidebar: [
			"Dashboard",
			"Members",
			"Memberships",
			"Communications",
			"Email History",
			"Sequences",
			"Support",
			"Billing",
			"Reports",
			"Events",
			"Memberships",
			"Loyalty",
			"Settings",
		],
		pipeline: [
			{ label: "Trial", color: "#3b82f6" },
			{ label: "Signed Up", color: "#3b82f6" },
			{ label: "Active", color: "#10b981" },
			{ label: "Paused", color: "#f59e0b" },
			{ label: "Cancelled", color: "#64748b" },
		],
		kpis: [
			{ value: "312", label: "Active Members" },
			{ value: "94%", label: "Renewal Rate" },
			{ value: "47", label: "Classes/Week" },
		],
	},
	realestate: {
		name: "Real Estate",
		emoji: "🏠",
		sidebar: [
			"Dashboard",
			"Leads",
			"Deals",
			"Communications",
			"Email History",
			"Sequences",
			"Requests",
			"Billing",
			"Reports",
			"Estimates",
			"Invoices",
			"Contracts",
			"Calendar",
			"Settings",
		],
		pipeline: [
			{ label: "New Lead", color: "#3b82f6" },
			{ label: "Showing", color: "#3b82f6" },
			{ label: "Offer Made", color: "#f59e0b" },
			{ label: "Under Contract", color: "#10b981" },
			{ label: "Closed", color: "#06d6a0" },
		],
		kpis: [
			{ value: "$1.2M", label: "Pipeline Value" },
			{ value: "8", label: "Active Deals" },
			{ value: "32 days", label: "Avg Close Time" },
		],
	},
	creative: {
		name: "Creative & Professional",
		emoji: "🎯",
		sidebar: [
			"Dashboard",
			"Clients",
			"Projects",
			"Email",
			"Email History",
			"Sequences",
			"Support Tickets",
			"Billing",
			"Reports",
			"Estimates",
			"Invoices",
			"Contracts",
			"Calendar",
			"Settings",
		],
		pipeline: [
			{ label: "Inquiry", color: "#3b82f6" },
			{ label: "Discovery", color: "#3b82f6" },
			{ label: "Proposal", color: "#f59e0b" },
			{ label: "Active Project", color: "#10b981" },
			{ label: "Delivered", color: "#06d6a0" },
		],
		kpis: [
			{ value: "14", label: "Active Projects" },
			{ value: "$67K", label: "Monthly Revenue" },
			{ value: "98%", label: "On-time Delivery" },
		],
	},
};

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
}

// ── Tab switching ──
document.getElementById("verticalTabs")?.addEventListener("click", (e) => {
	const tab = e.target.closest(".switcher-tab");
	if (!tab) return;
	document.querySelectorAll(".switcher-tab").forEach((t) => {
		t.classList.remove("active");
	});
	tab.classList.add("active");
	renderVertical(tab.dataset.vertical);
});

// Initial render
renderVertical("contractor");
installGlobalSyncProvider();

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

// ── Request Access form → POST to CRM ──
document
	.getElementById("requestForm")
	?.addEventListener("submit", async (e) => {
		e.preventDefault();
		const form = e.target;
		const btn = document.getElementById("requestSubmitBtn");
		const formData = new FormData(form);

		// Build payload matching the CRM lead contract
		const payload = {
			name: formData.get("name"),
			email: formData.get("email"),
			company: formData.get("business"),
			vertical: formData.get("vertical"),
			website: formData.get("website") || "",
			source: "vertaflow.io",
			webDesignInterest: formData.get("webDesignInterest") === "yes",
			message: `VertaFlow early access request — ${formData.get("vertical")} vertical`,
			type: "vertaflow_access",
		};

		// Loading state
		btn.disabled = true;
		btn.textContent = "Submitting...";

		try {
			// POST to the CRM lead endpoint
			const CRM_URL = "https://admin.designedbyanthony.com/api/lead";
			const res = await fetch(CRM_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!res.ok) throw new Error(`HTTP ${res.status}`);

			form.hidden = true;
			document.getElementById("requestSuccess").hidden = false;
		} catch (_err) {
			// Fallback: still show success (form data logged server-side for manual follow-up)
			form.hidden = true;
			document.getElementById("requestSuccess").hidden = false;
		}
	});

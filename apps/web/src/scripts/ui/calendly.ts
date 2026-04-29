const CALENDLY_BASE_PATH =
	"https://calendly.com/anthony-designedbyanthony/web-design-consult";

function isCalendlyLink(href: string): boolean {
	try {
		const parsed = new URL(href, window.location.origin);
		return parsed.hostname === "calendly.com";
	} catch {
		return false;
	}
}

function buildCalendlyEmbedSrc(rawHref?: string): string {
	const url = new URL(rawHref || CALENDLY_BASE_PATH, window.location.origin);
	if (url.hostname !== "calendly.com") {
		return CALENDLY_BASE_PATH;
	}
	if (!url.searchParams.has("hide_gdpr_banner")) {
		url.searchParams.set("hide_gdpr_banner", "1");
	}
	if (!url.searchParams.has("background_color")) {
		url.searchParams.set("background_color", "0d1320");
	}
	if (!url.searchParams.has("text_color")) {
		url.searchParams.set("text_color", "ffffff");
	}
	if (!url.searchParams.has("primary_color")) {
		url.searchParams.set("primary_color", "3b82f6");
	}
	return url.toString();
}

/**
 * Full-screen Calendly iframe (lazy-loaded), opened from the reach-out tray.
 * Matches the embed behavior on the contact page.
 */
export function initLayoutCalendlyEmbed(): void {
	const modal =
		document.getElementById("layoutCalendlyModal") ||
		document.getElementById("calendlyModal");
	const body =
		modal?.querySelector<HTMLElement>(
			"#layoutCalendlyModalBody, #calendlyModalBody",
		) ||
		document.getElementById("layoutCalendlyModalBody") ||
		document.getElementById("calendlyModalBody");
	const closeBtn =
		modal?.querySelector<HTMLElement>(
			"#layoutCalendlyCloseBtn, #calendlyCloseBtn",
		) ||
		document.getElementById("layoutCalendlyCloseBtn") ||
		document.getElementById("calendlyCloseBtn");
	const openBtn = document.getElementById("reachOutCalendlyBtn");
	const reachDialog = document.getElementById(
		"reachOutModal",
	) as HTMLDialogElement | null;
	const legacyModal = document.getElementById("calendlyModal");
	const legacyBody = document.getElementById("calendlyModalBody");

	if (
		!modal ||
		!body ||
		!closeBtn ||
		modal.dataset.layoutCalendlyInit === "true"
	)
		return;
	modal.dataset.layoutCalendlyInit = "true";

	const calendlyModal = modal;
	const calendlyBody = body;
	const calendlyCloseBtn = closeBtn;

	let iframeLoaded = false;
	let iframe: HTMLIFrameElement | null = null;
	let legacyIframe: HTMLIFrameElement | null = null;
	let focusBeforeCalendly: HTMLElement | null = null;

	function setCalendlyLoading(container: HTMLElement, visible: boolean): void {
		const el = container.querySelector<HTMLElement>("[data-calendly-loading]");
		if (!el) return;
		if (visible) {
			el.removeAttribute("hidden");
		} else {
			el.setAttribute("hidden", "");
		}
	}

	function injectIframe(src: string): void {
		setCalendlyLoading(calendlyBody, true);
		if (legacyBody && legacyBody !== calendlyBody) {
			setCalendlyLoading(legacyBody, true);
		}

		if (!iframeLoaded) {
			iframeLoaded = true;
			iframe = document.createElement("iframe");
			iframe.style.cssText = "width:100%;height:100%;border:none;";
			iframe.title = "Schedule a free web design consultation with Anthony";
			iframe.setAttribute("loading", "lazy");
			iframe.addEventListener("load", () => {
				setCalendlyLoading(calendlyBody, false);
				if (legacyBody && legacyBody !== calendlyBody) {
					setCalendlyLoading(legacyBody, false);
				}
			});
			calendlyBody.appendChild(iframe);
		}

		if (iframe) {
			const prev = iframe.dataset.embedSrc ?? "";
			iframe.dataset.embedSrc = src;
			if (prev && prev === src) {
				setCalendlyLoading(calendlyBody, false);
				if (legacyBody && legacyBody !== calendlyBody) {
					setCalendlyLoading(legacyBody, false);
				}
			}
			iframe.src = src;
		}

		if (legacyBody && legacyBody !== calendlyBody) {
			if (!legacyIframe) {
				legacyIframe = document.createElement("iframe");
				legacyIframe.style.cssText = "width:100%;height:100%;border:none;";
				legacyIframe.title =
					"Schedule a free web design consultation with Anthony";
				legacyIframe.setAttribute("loading", "lazy");
				legacyIframe.addEventListener("load", () => {
					setCalendlyLoading(legacyBody, false);
					setCalendlyLoading(calendlyBody, false);
				});
				legacyBody.appendChild(legacyIframe);
			}
			if (legacyIframe) {
				const prevL = legacyIframe.dataset.embedSrc ?? "";
				legacyIframe.dataset.embedSrc = src;
				if (prevL && prevL === src) {
					setCalendlyLoading(legacyBody, false);
					setCalendlyLoading(calendlyBody, false);
				}
				legacyIframe.src = src;
			}
		}
	}

	function openModal(href?: string): void {
		const active = document.activeElement;
		focusBeforeCalendly = active instanceof HTMLElement ? active : null;
		reachDialog?.close();
		calendlyModal.removeAttribute("hidden");
		if (legacyModal && legacyModal !== calendlyModal) {
			legacyModal.removeAttribute("hidden");
		}
		document.body.style.overflow = "hidden";
		document.documentElement.style.overscrollBehavior = "contain";
		injectIframe(buildCalendlyEmbedSrc(href));
		window.requestAnimationFrame(() => {
			calendlyCloseBtn.focus();
		});
	}

	function closeModal(): void {
		calendlyModal.setAttribute("hidden", "");
		if (legacyModal && legacyModal !== calendlyModal) {
			legacyModal.setAttribute("hidden", "");
		}
		document.body.style.overflow = "";
		document.documentElement.style.removeProperty("overscroll-behavior");
		const prev = focusBeforeCalendly;
		focusBeforeCalendly = null;
		if (prev && document.body.contains(prev)) {
			prev.focus();
		}
	}

	if (openBtn) {
		openBtn.addEventListener("click", () => {
			openModal(CALENDLY_BASE_PATH);
		});
	}

	calendlyCloseBtn.addEventListener("click", closeModal);

	calendlyModal.addEventListener("click", (event: MouseEvent) => {
		if (event.target === calendlyModal) {
			closeModal();
		}
	});

	document.addEventListener("keydown", (event: KeyboardEvent) => {
		if (event.key === "Escape" && !calendlyModal.hasAttribute("hidden")) {
			closeModal();
		}
	});

	document.addEventListener("click", (event: MouseEvent) => {
		const target = event.target as HTMLElement | null;
		if (!target) return;
		const link = target.closest("a") as HTMLAnchorElement | null;
		if (link?.href) {
			const hasCalendlyMarker = link.hasAttribute("data-calendar-link");
			if (hasCalendlyMarker || isCalendlyLink(link.href)) {
				event.preventDefault();
				openModal(link.href);
			}
			return;
		}

		const trigger = target.closest(
			"[data-calendar-link][data-calendly-href]",
		) as HTMLElement | null;
		if (trigger?.dataset.calendlyHref) {
			event.preventDefault();
			openModal(trigger.dataset.calendlyHref);
		}
	});

	document
		.querySelectorAll<HTMLElement>("[data-calendar-link]")
		.forEach((trigger) => {
			if (trigger.dataset.calendlyBound === "true") return;
			trigger.dataset.calendlyBound = "true";
			trigger.addEventListener("click", (event: MouseEvent) => {
				const href =
					trigger instanceof HTMLAnchorElement
						? trigger.href
						: trigger.dataset.calendlyHref;
				if (!href) return;
				event.preventDefault();
				openModal(href);
			});
		});
}

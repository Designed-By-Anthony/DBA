function getElements() {
	const hamburger = document.querySelector<HTMLElement>(
		"[data-mobile-nav-toggle]",
	);
	const mobileNav = document.getElementById("mobile-nav");
	return { hamburger, mobileNav };
}

function setDocumentLocked(open: boolean): void {
	document.documentElement.classList.toggle("overflow-hidden", open);
	document.body.classList.toggle("overflow-hidden", open);
	document.documentElement.toggleAttribute("data-mobile-nav-open", open);
}

function setOpenState(mobileNav: HTMLElement, open: boolean): void {
	mobileNav.classList.toggle("hidden", !open);
	mobileNav.setAttribute("aria-hidden", open ? "false" : "true");
	setDocumentLocked(open);
}

export function closeMobileNav(): void {
	const { hamburger, mobileNav } = getElements();
	if (!hamburger || !mobileNav) return;
	setOpenState(mobileNav, false);
	hamburger.setAttribute("aria-expanded", "false");
	hamburger.setAttribute("aria-label", "Open navigation menu");
}

export function initMobileNav(): void {
	const { hamburger, mobileNav } = getElements();
	if (!hamburger || !mobileNav) return;
	if (hamburger.dataset.mobileNavInit === "true") return;
	hamburger.dataset.mobileNavInit = "true";

	const dismissEls = mobileNav.querySelectorAll<HTMLElement>(
		"[data-mobile-nav-dismiss], [data-mobile-nav-close], [data-mobile-nav-link]",
	);

	window.addEventListener("dba:page-ready", () => {
		closeMobileNav();
	});

	hamburger.addEventListener("click", () => {
		const open = mobileNav.classList.contains("hidden");
		setOpenState(mobileNav, open);
		hamburger.setAttribute("aria-expanded", String(open));
		hamburger.setAttribute(
			"aria-label",
			open ? "Close navigation menu" : "Open navigation menu",
		);
		if (open) {
			mobileNav
				.querySelector<HTMLButtonElement>("[data-mobile-nav-close]")
				?.focus();
		}
	});

	for (const el of dismissEls) {
		el.addEventListener("click", () => {
			closeMobileNav();
			hamburger.focus();
		});
	}

	document.addEventListener("keydown", (event: KeyboardEvent) => {
		if (event.key === "Escape" && !mobileNav.classList.contains("hidden")) {
			closeMobileNav();
			hamburger.focus();
		}
	});
}

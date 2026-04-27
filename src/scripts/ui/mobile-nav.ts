const BODY_LOCK_ATTR = "data-mobile-nav-scroll-lock";

function getElements() {
	const hamburger = document.getElementById("hamburger-btn");
	const mobileNav = document.getElementById("mobile-nav");
	return { hamburger, mobileNav };
}

function isOpen(mobileNav: HTMLElement): boolean {
	return mobileNav.classList.contains("open");
}

function setOpenState(mobileNav: HTMLElement, open: boolean): void {
	mobileNav.classList.toggle("open", open);
	mobileNav.setAttribute("aria-hidden", open ? "false" : "true");
}

function lockBodyScroll(): void {
	if (document.body.hasAttribute(BODY_LOCK_ATTR)) return;
	const y = window.scrollY;
	document.body.setAttribute(BODY_LOCK_ATTR, String(y));
	document.body.style.position = "fixed";
	document.body.style.top = `-${y}px`;
	document.body.style.left = "0";
	document.body.style.right = "0";
	document.body.style.width = "100%";
}

function unlockBodyScroll(): void {
	const raw = document.body.getAttribute(BODY_LOCK_ATTR);
	document.body.removeAttribute(BODY_LOCK_ATTR);
	document.body.style.position = "";
	document.body.style.top = "";
	document.body.style.left = "";
	document.body.style.right = "";
	document.body.style.width = "";
	if (raw !== null) {
		const y = Number.parseInt(raw, 10);
		if (!Number.isNaN(y)) {
			window.scrollTo(0, y);
		}
	}
}

export function closeMobileNav(): void {
	const { hamburger, mobileNav } = getElements();
	if (!hamburger || !mobileNav) return;

	setOpenState(mobileNav, false);
	hamburger.classList.remove("active");
	hamburger.setAttribute("aria-expanded", "false");
	hamburger.setAttribute("aria-label", "Open navigation menu");
	unlockBodyScroll();
}

export function initMobileNav(): void {
	const { hamburger, mobileNav } = getElements();

	if (!hamburger || !mobileNav) return;
	if (hamburger.dataset.mobileNavInit === "true") return;
	hamburger.dataset.mobileNavInit = "true";

	const dismissEls = mobileNav.querySelectorAll<HTMLElement>(
		"[data-mobile-nav-dismiss], [data-mobile-nav-close]",
	);

	window.addEventListener("dba:page-ready", () => {
		closeMobileNav();
	});

	hamburger.addEventListener("click", () => {
		const open = !isOpen(mobileNav);
		setOpenState(mobileNav, open);
		hamburger.classList.toggle("active", open);
		hamburger.setAttribute("aria-expanded", String(open));
		hamburger.setAttribute(
			"aria-label",
			open ? "Close navigation menu" : "Open navigation menu",
		);
		if (open) {
			lockBodyScroll();
			mobileNav
				.querySelector<HTMLButtonElement>("[data-mobile-nav-close]")
				?.focus();
		} else {
			unlockBodyScroll();
		}
	});

	for (const el of dismissEls) {
		el.addEventListener("click", (e) => {
			e.preventDefault();
			closeMobileNav();
			hamburger.focus();
		});
	}

	mobileNav.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
		link.addEventListener("click", () => {
			closeMobileNav();
		});
	});

	document.addEventListener("keydown", (event: KeyboardEvent) => {
		if (event.key === "Escape" && isOpen(mobileNav)) {
			closeMobileNav();
			hamburger.focus();
		}
	});
}

function closeMobileNav(): void {
	const hamburger = document.getElementById("hamburger-btn");
	const mobileNav = document.getElementById("mobile-nav");

	if (!hamburger || !mobileNav) return;

	mobileNav.classList.remove("open");
	hamburger.classList.remove("active");
	hamburger.setAttribute("aria-expanded", "false");
	document.body.style.overflow = "";
}

export function initMobileNav(): void {
	const hamburger = document.getElementById("hamburger-btn");
	const mobileNav = document.getElementById("mobile-nav");

	if (!hamburger || !mobileNav) return;
	if (hamburger.dataset.mobileNavInit === "true") return;
	hamburger.dataset.mobileNavInit = "true";

	hamburger.addEventListener("click", () => {
		const isOpen = mobileNav.classList.toggle("open");
		hamburger.classList.toggle("active");
		hamburger.setAttribute("aria-expanded", String(isOpen));
		document.body.style.overflow = isOpen ? "hidden" : "";
		if (isOpen) {
			mobileNav.querySelector<HTMLAnchorElement>("a")?.focus();
		}
	});

	mobileNav.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
		link.addEventListener("click", () => {
			closeMobileNav();
		});
	});

	document.addEventListener("keydown", (event: KeyboardEvent) => {
		if (event.key === "Escape" && mobileNav.classList.contains("open")) {
			closeMobileNav();
			hamburger.focus();
		}
	});
}

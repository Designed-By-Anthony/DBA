export function initMagneticLinks(): void {
	const prefersReducedMotion = window.matchMedia(
		"(prefers-reduced-motion: reduce)",
	).matches;
	const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
	if (prefersReducedMotion || !hasFinePointer) return;

	const targets = Array.from(
		document.querySelectorAll<HTMLElement>(
			[
				"#nav-book-call-btn",
				".site-banner-link",
				".nav-contact-link",
				".hero-cta-glow",
				".nav-rail-link--book",
				".nav-rail-link--audit",
			].join(", "),
		),
	);
	if (targets.length === 0) return;

	const MAX_SHIFT = 6;
	targets.forEach((target) => {
		if (target.dataset.magneticInit === "true") return;
		target.dataset.magneticInit = "true";

		target.addEventListener(
			"pointermove",
			(event: PointerEvent) => {
				const rect = target.getBoundingClientRect();
				const dx = event.clientX - (rect.left + rect.width / 2);
				const dy = event.clientY - (rect.top + rect.height / 2);
				const xShift = (dx / (rect.width / 2)) * MAX_SHIFT;
				const yShift = (dy / (rect.height / 2)) * MAX_SHIFT;
				target.style.transform = `translate(${xShift.toFixed(2)}px, ${yShift.toFixed(2)}px)`;
			},
			{ passive: true },
		);

		target.addEventListener("pointerleave", () => {
			target.style.transform = "";
		});
	});
}

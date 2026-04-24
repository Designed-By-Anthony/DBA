const STAGGER_REVEAL_UP_MS = 58;
const STAGGER_REVEAL_MS = 70;
const MAX_STAGGER_INDEX = 20;

function scheduleReveal(
	el: HTMLElement,
	className: "reveal-active" | "active",
	indexInList: number,
	staggerMs: number,
): void {
	const delay =
		Math.min(Math.max(indexInList, 0), MAX_STAGGER_INDEX) * staggerMs;
	window.setTimeout(() => {
		el.classList.add(className);
	}, delay);
}

export function initRevealAnimations(): void {
	const revealUpElements = Array.from(
		document.querySelectorAll<HTMLElement>(".reveal-up"),
	);
	const revealElements = Array.from(
		document.querySelectorAll<HTMLElement>(".reveal"),
	);
	const prefersReducedMotion = window.matchMedia(
		"(prefers-reduced-motion: reduce)",
	).matches;

	if (revealUpElements.length === 0 && revealElements.length === 0) return;

	if (prefersReducedMotion) {
		for (const element of revealUpElements) {
			element.classList.add("reveal-active");
		}
		for (const element of revealElements) {
			element.classList.add("active");
		}
		return;
	}

	document.documentElement.classList.add("reveal-ready");

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				const el = entry.target as HTMLElement;
				observer.unobserve(el);

				if (el.classList.contains("reveal-up")) {
					const idx = revealUpElements.indexOf(el);
					scheduleReveal(
						el,
						"reveal-active",
						idx === -1 ? 0 : idx,
						STAGGER_REVEAL_UP_MS,
					);
				} else if (el.classList.contains("reveal")) {
					const idx = revealElements.indexOf(el);
					scheduleReveal(el, "active", idx === -1 ? 0 : idx, STAGGER_REVEAL_MS);
				}
			}
		},
		{
			root: null,
			/* Slight “early” trigger + top breathing room for hero strips */
			rootMargin: "72px 0px -7% 0px",
			threshold: 0.06,
		},
	);

	for (const el of revealUpElements) {
		if (el.dataset.revealIoBound === "1") continue;
		if (el.classList.contains("reveal-active")) continue;
		el.dataset.revealIoBound = "1";
		observer.observe(el);
	}

	for (const el of revealElements) {
		if (el.dataset.revealIoBound === "1") continue;
		if (el.classList.contains("active")) continue;
		el.dataset.revealIoBound = "1";
		observer.observe(el);
	}
}

const STAGGER_REVEAL_UP_MS = 58;
const STAGGER_REVEAL_MS = 70;
const MAX_STAGGER_INDEX = 20;

/** All CSS classes that use the reveal-active animation system */
const DIRECTIONAL_REVEAL_CLASSES = [
	"reveal-up",
	"reveal-left",
	"reveal-right",
	"reveal-scale",
] as const;

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

function isDirectionalReveal(el: Element): boolean {
	return DIRECTIONAL_REVEAL_CLASSES.some((cls) => el.classList.contains(cls));
}

export function initRevealAnimations(): void {
	const directionalElements = Array.from(
		document.querySelectorAll<HTMLElement>(
			DIRECTIONAL_REVEAL_CLASSES.map((c) => `.${c}`).join(","),
		),
	);
	const revealElements = Array.from(
		document.querySelectorAll<HTMLElement>(".reveal"),
	);
	const prefersReducedMotion = window.matchMedia(
		"(prefers-reduced-motion: reduce)",
	).matches;

	if (directionalElements.length === 0 && revealElements.length === 0) return;

	if (prefersReducedMotion) {
		for (const element of directionalElements) {
			element.classList.add("reveal-active");
		}
		for (const element of revealElements) {
			element.classList.add("active");
		}
		return;
	}

	const aboveFoldCutoff = window.innerHeight * 0.92;
	for (const el of directionalElements) {
		const rect = el.getBoundingClientRect();
		if (rect.top <= aboveFoldCutoff) {
			el.classList.add("reveal-active");
		}
	}
	for (const el of revealElements) {
		const rect = el.getBoundingClientRect();
		if (rect.top <= aboveFoldCutoff) {
			el.classList.add("active");
		}
	}

	document.documentElement.classList.add("reveal-ready");

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				const el = entry.target as HTMLElement;
				observer.unobserve(el);

				if (isDirectionalReveal(el)) {
					const idx = directionalElements.indexOf(el);
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
			/* Slight "early" trigger + top breathing room for hero strips */
			rootMargin: "72px 0px -7% 0px",
			threshold: 0.06,
		},
	);

	/* If IO never intersects (layout quirks, embedded previews), force-visible so
	   content is never stuck at opacity:0 under html.reveal-ready. */
	window.setTimeout(() => {
		for (const el of directionalElements) {
			if (!el.classList.contains("reveal-active")) {
				el.classList.add("reveal-active");
			}
		}
		for (const el of revealElements) {
			if (!el.classList.contains("active")) {
				el.classList.add("active");
			}
		}
	}, 3400);

	for (const el of directionalElements) {
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

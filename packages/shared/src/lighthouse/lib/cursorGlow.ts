/**
 * Cursor glow tracking for glass cards
 * Updates CSS custom properties --mouse-x and --mouse-y on hover
 */

export function initCursorGlow(selector: string = ".glass-card"): () => void {
	if (typeof window === "undefined") return () => {};

	const cards = document.querySelectorAll<HTMLElement>(selector);
	if (cards.length === 0) return () => {};

	const controllers: AbortController[] = [];

	for (const card of cards) {
		const controller = new AbortController();
		controllers.push(controller);

		card.addEventListener(
			"mousemove",
			(e: MouseEvent) => {
				const rect = card.getBoundingClientRect();
				const x = e.clientX - rect.left;
				const y = e.clientY - rect.top;
				card.style.setProperty("--mouse-x", `${x}px`);
				card.style.setProperty("--mouse-y", `${y}px`);
			},
			{ signal: controller.signal },
		);
	}

	return () => {
		for (const controller of controllers) {
			controller.abort();
		}
	};
}

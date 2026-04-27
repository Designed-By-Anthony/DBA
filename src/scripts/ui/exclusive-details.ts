/**
 * At most one `<details>` open per `[data-exclusive-details]` container.
 * Use on FAQ-style lists site-wide.
 */
function directDetailsChildren(container: HTMLElement): HTMLDetailsElement[] {
	return Array.from(container.children).filter(
		(n): n is HTMLDetailsElement => n instanceof HTMLDetailsElement,
	);
}

export function initExclusiveDetails(): void {
	const groups = document.querySelectorAll<HTMLElement>(
		"[data-exclusive-details]",
	);

	for (const container of groups) {
		if (container.dataset.exclusiveDetailsBound === "1") continue;
		container.dataset.exclusiveDetailsBound = "1";

		container.addEventListener("toggle", (ev) => {
			const el = ev.target;
			if (!(el instanceof HTMLDetailsElement)) return;
			if (el.closest("[data-exclusive-details]") !== container) return;
			if (!el.open) return;

			for (const d of directDetailsChildren(container)) {
				if (d !== el) d.open = false;
			}
		});
	}
}

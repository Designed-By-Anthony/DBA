export function initCursorGlow(): void {
	if (window.matchMedia("(hover: none)").matches) return;

	document.addEventListener(
		"mousemove",
		(e: MouseEvent) => {
			const cards = document.elementsFromPoint(e.clientX, e.clientY);
			for (const el of cards) {
				if (el.classList.contains("surface-card")) {
					const rect = el.getBoundingClientRect();
					(el as HTMLElement).style.setProperty(
						"--mouse-x",
						`${e.clientX - rect.left}px`,
					);
					(el as HTMLElement).style.setProperty(
						"--mouse-y",
						`${e.clientY - rect.top}px`,
					);
					break;
				}
			}
		},
		{ passive: true },
	);
}

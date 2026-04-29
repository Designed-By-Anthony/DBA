export function initTabbedProof(): void {
	const groups = Array.from(
		document.querySelectorAll<HTMLElement>("[data-tabbed-proof]"),
	);

	groups.forEach((group) => {
		const triggers = Array.from(
			group.querySelectorAll<HTMLButtonElement>("[data-tab-trigger]"),
		);
		const panels = Array.from(
			group.querySelectorAll<HTMLElement>("[data-tab-panel]"),
		);

		if (triggers.length === 0 || panels.length === 0) return;

		const setActive = (target: string) => {
			triggers.forEach((trigger) => {
				const isActive = trigger.dataset.tabTarget === target;
				trigger.setAttribute("aria-selected", String(isActive));
				trigger.tabIndex = isActive ? 0 : -1;
			});

			panels.forEach((panel) => {
				panel.hidden = panel.dataset.tabPanel !== target;
			});
		};

		triggers.forEach((trigger, index) => {
			trigger.addEventListener("click", () => {
				const target = trigger.dataset.tabTarget;
				if (!target) return;
				setActive(target);
			});

			trigger.addEventListener("keydown", (event: KeyboardEvent) => {
				if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;

				event.preventDefault();
				const direction = event.key === "ArrowRight" ? 1 : -1;
				const nextIndex =
					(index + direction + triggers.length) % triggers.length;
				const nextTrigger = triggers[nextIndex];
				nextTrigger.focus();
				nextTrigger.click();
			});
		});

		const defaultTarget = triggers.find(
			(trigger) => trigger.getAttribute("aria-selected") === "true",
		)?.dataset.tabTarget;
		if (defaultTarget) {
			setActive(defaultTarget);
		}
	});
}

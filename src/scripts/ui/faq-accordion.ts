function initExclusiveDetails(): void {
	const containers = document.querySelectorAll<HTMLElement>(".home-faq-list");
	containers.forEach((container) => {
		if (container.dataset.exclusiveBound === "true") return;
		container.dataset.exclusiveBound = "true";
		container.addEventListener(
			"toggle",
			(e) => {
				const target = e.target;
				if (!(target instanceof HTMLDetailsElement) || !target.open) return;
				const siblings =
					container.querySelectorAll<HTMLDetailsElement>("details");
				siblings.forEach((d) => {
					if (d !== target) d.open = false;
				});
			},
			true,
		);
	});
}

export function initFaqAccordion(): void {
	initExclusiveDetails();

	const accordions = Array.from(
		document.querySelectorAll<HTMLElement>("[data-faq-accordion]"),
	);

	accordions.forEach((accordion) => {
		if (accordion.dataset.faqBound === "true") return;
		accordion.dataset.faqBound = "true";
		const triggers = Array.from(
			accordion.querySelectorAll<HTMLElement>(".faq-trigger"),
		);

		triggers.forEach((trigger) => {
			trigger.addEventListener("click", () => {
				const parent = trigger.closest(".faq-item");
				const panel = parent?.querySelector<HTMLElement>(".faq-panel");

				if (!parent || !panel) return;

				const isOpen = trigger.getAttribute("aria-expanded") === "true";
				const triggerTopBefore = trigger.getBoundingClientRect().top;

				triggers.forEach((otherTrigger) => {
					const otherParent = otherTrigger.closest(".faq-item");
					const otherPanel =
						otherParent?.querySelector<HTMLElement>(".faq-panel");

					otherTrigger.setAttribute("aria-expanded", "false");
					otherPanel?.classList.remove("is-open");
				});

				if (!isOpen) {
					trigger.setAttribute("aria-expanded", "true");
					panel.classList.add("is-open");
				}

				window.requestAnimationFrame(() => {
					const triggerTopAfter = trigger.getBoundingClientRect().top;
					const drift = triggerTopAfter - triggerTopBefore;

					if (Math.abs(drift) > 1) {
						window.scrollBy(0, drift);
					}
				});
			});
		});
	});
}

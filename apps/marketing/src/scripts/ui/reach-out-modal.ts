export function initReachOutModal(): void {
	const dialog = document.getElementById(
		"reachOutModal",
	) as HTMLDialogElement | null;
	const openBtn = document.getElementById("reachOutOpenBtn");

	if (!dialog || !openBtn || openBtn.dataset.reachOutInit === "true") return;
	openBtn.dataset.reachOutInit = "true";
	const reachOutOpenBtn = openBtn;

	function setExpanded(open: boolean): void {
		reachOutOpenBtn.setAttribute("aria-expanded", open ? "true" : "false");
	}

	reachOutOpenBtn.addEventListener("click", () => {
		if (!dialog.open) {
			dialog.showModal();
			setExpanded(true);
		}
	});

	dialog.addEventListener("click", (event: MouseEvent) => {
		if (event.target === dialog) {
			dialog.close();
		}
	});

	dialog.addEventListener("close", () => {
		setExpanded(false);
		if (document.body.contains(reachOutOpenBtn)) {
			reachOutOpenBtn.focus();
		}
	});

	dialog
		.querySelectorAll<HTMLElement>("[data-reach-out-close]")
		.forEach((el) => {
			el.addEventListener("click", () => dialog.close());
		});

	setExpanded(false);
}

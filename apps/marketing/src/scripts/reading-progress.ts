const BLOG_SCROLL_KEY = "dba:blog:scroll-y";
const BLOG_RESTORE_KEY = "dba:blog:restore-scroll";

export function initBlogScrollState(signal?: AbortSignal): void {
	const blogLinks = Array.from(
		document.querySelectorAll<HTMLElement>("[data-blog-post-link]"),
	);
	const backButtons = Array.from(
		document.querySelectorAll<HTMLElement>("[data-blog-back-button]"),
	);

	backButtons.forEach((button) => {
		button.addEventListener(
			"click",
			() => {
				try {
					sessionStorage.setItem(BLOG_RESTORE_KEY, "1");
				} catch {
					// Ignore storage failures.
				}
			},
			{ signal },
		);
	});

	if (blogLinks.length === 0) return;

	const saveScrollPosition = () => {
		try {
			sessionStorage.setItem(BLOG_SCROLL_KEY, String(window.scrollY));
		} catch {
			// Ignore storage failures.
		}
	};

	const restoreScrollPosition = () => {
		let savedScroll = 0;

		try {
			const storedValue = Number(
				sessionStorage.getItem(BLOG_SCROLL_KEY) || "0",
			);
			const shouldRestore = sessionStorage.getItem(BLOG_RESTORE_KEY) === "1";

			if (!shouldRestore) return;

			sessionStorage.removeItem(BLOG_RESTORE_KEY);
			savedScroll = Number.isFinite(storedValue) ? storedValue : 0;
		} catch {
			return;
		}

		window.requestAnimationFrame(() => {
			window.requestAnimationFrame(() => {
				window.scrollTo(0, savedScroll);
			});
		});
	};

	blogLinks.forEach((link) => {
		link.addEventListener("click", saveScrollPosition, { signal });
	});

	window.addEventListener("pagehide", saveScrollPosition, { signal });
	restoreScrollPosition();
}

export function initReadingProgress(signal?: AbortSignal): void {
	const bar = document.getElementById("reading-progress-bar");
	if (!bar) return;

	// Only show on article/blog pages
	if (!document.body.classList.contains("has-progress-bar")) return;

	const updateProgress = () => {
		const scrollTop = window.scrollY;
		const docHeight =
			document.documentElement.scrollHeight - window.innerHeight;
		const progress =
			docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
		bar.style.width = `${progress}%`;
	};

	window.addEventListener("scroll", updateProgress, { passive: true, signal });
	updateProgress();
}

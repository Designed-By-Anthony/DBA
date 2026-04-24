"use client";

import { useEffect } from "react";

/**
 * Blog articles: enable the top reading bar (`#reading-progress-bar` in MarketingChrome).
 * `site.js` runs before hydration, so `reading-progress.ts` may miss `body.has-progress-bar`;
 * we attach scroll listeners here after the class is applied.
 */
export function BlogArticleEnhancements() {
	useEffect(() => {
		document.body.classList.add("has-progress-bar");
		const bar = document.getElementById("reading-progress-bar");
		if (!bar) {
			return () => {
				document.body.classList.remove("has-progress-bar");
			};
		}

		const updateProgress = () => {
			const scrollTop = window.scrollY;
			const docHeight =
				document.documentElement.scrollHeight - window.innerHeight;
			const progress =
				docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
			bar.style.width = `${progress}%`;
		};

		window.addEventListener("scroll", updateProgress, { passive: true });
		updateProgress();

		return () => {
			document.body.classList.remove("has-progress-bar");
			window.removeEventListener("scroll", updateProgress);
			bar.style.width = "0%";
		};
	}, []);

	return null;
}

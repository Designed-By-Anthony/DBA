"use client";

import { useEffect } from "react";

type InnerPageMotionSystemProps = {
	kind?: string;
};

export function InnerPageMotionSystem({
	kind = "default",
}: InnerPageMotionSystemProps) {
	useEffect(() => {
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
		if (reducedMotion.matches) {
			return;
		}

		let disposed = false;
		let cleanup = () => {};

		async function setupScrollMotion() {
			const [{ gsap }, { ScrollTrigger }] = await Promise.all([
				import("gsap"),
				import("gsap/ScrollTrigger"),
			]);

			if (disposed) {
				return;
			}

			gsap.registerPlugin(ScrollTrigger);

			const context = gsap.context(() => {
				document.documentElement.classList.add("inner-scrolltrigger-ready");

				const hero = document.querySelector<HTMLElement>(
					".marketing-page-hero",
				);
				if (hero) {
					gsap.to(".marketing-hero-blueprint", {
						yPercent: 10,
						opacity: 0.34,
						ease: "none",
						scrollTrigger: {
							trigger: hero,
							start: "top top",
							end: "bottom top",
							scrub: true,
						},
					});

					gsap.to(".marketing-hero-motif", {
						yPercent: -9,
						rotation: 5,
						ease: "none",
						scrollTrigger: {
							trigger: hero,
							start: "top top",
							end: "bottom top",
							scrub: true,
						},
					});
				}

				gsap.utils
					.toArray<HTMLElement>(".marketing-page-hero ~ .section-shell")
					.forEach((section) => {
						const setProgress = gsap.quickSetter(section, "--section-progress");
						setProgress(0);

						ScrollTrigger.create({
							trigger: section,
							start: "top 82%",
							end: "bottom 38%",
							scrub: true,
							onEnter: () => section.classList.add("section-scroll-active"),
							onEnterBack: () => section.classList.add("section-scroll-active"),
							onUpdate: (self) => setProgress(self.progress.toFixed(3)),
						});
					});

				gsap.utils
					.toArray<HTMLElement>(
						".blog-index-card__media, .featured-image-wrap, .blog-article-cover",
					)
					.forEach((media) => {
						gsap.fromTo(
							media,
							{ "--media-parallax-y": "-10px" },
							{
								"--media-parallax-y": "10px",
								ease: "none",
								scrollTrigger: {
									trigger: media,
									start: "top bottom",
									end: "bottom top",
									scrub: true,
								},
							},
						);
					});

				gsap.utils.toArray<HTMLElement>(".pricing-tier").forEach((tier, i) => {
					gsap.fromTo(
						tier,
						{ "--tier-signal": "0" },
						{
							"--tier-signal": "1",
							duration: 0.85,
							delay: i * 0.08,
							ease: "power3.out",
							scrollTrigger: {
								trigger: tier,
								start: "top 82%",
								once: true,
							},
						},
					);
				});
			});

			cleanup = () => {
				context.revert();
				document.documentElement.classList.remove("inner-scrolltrigger-ready");
			};
		}

		void setupScrollMotion();

		return () => {
			disposed = true;
			cleanup();
		};
	}, []);

	return (
		<div
			className="inner-page-motion-system"
			data-motion-kind={kind}
			aria-hidden="true"
		>
			<div className="marketing-hero-blueprint">
				<span className="marketing-hero-blueprint__trace marketing-hero-blueprint__trace--one" />
				<span className="marketing-hero-blueprint__trace marketing-hero-blueprint__trace--two" />
				<span className="marketing-hero-blueprint__trace marketing-hero-blueprint__trace--three" />
			</div>
			<div className="marketing-hero-motif">
				<span className="marketing-hero-motif__shape" />
				<span className="marketing-hero-motif__shape" />
				<span className="marketing-hero-motif__shape" />
				<span className="marketing-hero-motif__shape" />
			</div>
		</div>
	);
}

"use client";

/**
 * Reusable horizontal highlight strip. Sits between a PageHero and
 * the first prose section on service / marketing pages. Mobile: one
 * card at a time, swipe-scrollable. Desktop: 3–4 visible at once.
 */

type InfoItem = {
	tag: string;
	title: string;
	body: string;
};

export function InfoCarousel({ items }: { items: InfoItem[] }) {
	if (items.length === 0) return null;

	return (
		<section aria-label="Highlights" className="info-carousel">
			<div className="info-carousel__track">
				{items.map((item) => (
					<article
						key={item.title}
						className="info-carousel__card surface-card"
					>
						<p className="info-carousel__tag">{item.tag}</p>
						<h3 className="info-carousel__title">{item.title}</h3>
						<p className="info-carousel__body">{item.body}</p>
					</article>
				))}
			</div>
		</section>
	);
}

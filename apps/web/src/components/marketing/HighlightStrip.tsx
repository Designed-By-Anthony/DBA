"use client";

import {
	MotionReveal,
	MotionStagger,
	MotionStaggerChild,
} from "./MotionReveal";

type HighlightItem = {
	label: string;
	value: string;
	note?: string;
};

/**
 * Horizontal strip of info-highlight tiles used on content pages.
 * Renders as a scrollable row of surface-card tiles with label/value pairs.
 */
export function HighlightStrip({
	items,
	eyebrow,
}: {
	items: HighlightItem[];
	eyebrow?: string;
}) {
	return (
		<section className="section-shell section-shell--wash">
			<div className="section-container">
				{eyebrow ? (
					<MotionReveal
						className="section-header centered"
						y={16}
						duration={0.5}
					>
						<p className="section-eyebrow">{eyebrow}</p>
					</MotionReveal>
				) : null}
				<MotionStagger className="highlight-strip" staggerDelay={0.06}>
					{items.map((item) => (
						<MotionStaggerChild
							key={item.label}
							className="surface-card highlight-strip__tile reveal-up"
						>
							<span className="highlight-strip__value">{item.value}</span>
							<span className="highlight-strip__label">{item.label}</span>
							{item.note ? (
								<span className="highlight-strip__note">{item.note}</span>
							) : null}
						</MotionStaggerChild>
					))}
				</MotionStagger>
			</div>
		</section>
	);
}

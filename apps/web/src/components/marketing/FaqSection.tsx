export type FaqEntry = {
	question: string;
	answer: string;
};

export type FaqSectionProps = {
	entries: readonly FaqEntry[];
	className?: string;
	itemClassName?: string;
};

/** Summary + answer markup shared by `<details>` FAQ accordions. */
export function FaqAccordionSummaryAndAnswer({ question, answer }: FaqEntry) {
	return (
		<>
			<summary>
				<span className="home-faq-question">{question}</span>
				<span className="home-faq-toggle" aria-hidden="true" />
			</summary>
			<div className="home-faq-answer">
				<p>{answer}</p>
			</div>
		</>
	);
}

/**
 * Shared FAQ accordion — Atelier glass rows (`.text-bubble.is-bordered`).
 */
export function FaqSection({
	entries,
	className,
	itemClassName = "",
}: FaqSectionProps) {
	return (
		<div className={className} data-exclusive-details>
			{entries.map((entry) => (
				<details
					key={entry.question}
					className={`text-bubble is-bordered home-faq-item ${itemClassName}`.trim()}
				>
					<FaqAccordionSummaryAndAnswer {...entry} />
				</details>
			))}
		</div>
	);
}

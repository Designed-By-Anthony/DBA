import type { ArticleBlock } from "@/data/blogArticleBlocks";

function slugifyHeading(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

/** Stable key from block payload (avoids array index keys). */
function blockKey(block: ArticleBlock): string {
	const raw = JSON.stringify(block);
	let h = 2166136261;
	for (let i = 0; i < raw.length; i++) {
		h ^= raw.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return `b-${(h >>> 0).toString(36)}`;
}

export function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
	return (
		<div className="article-body article-shell">
			{blocks.map((block) => {
				const key = blockKey(block);
				switch (block.type) {
					case "p":
						return (
							<p key={key} className="reveal-up">
								{block.text}
							</p>
						);
					case "h2":
						return (
							<h2
								key={key}
								id={slugifyHeading(block.text)}
								className="reveal-up"
							>
								{block.text}
							</h2>
						);
					case "h3":
						return (
							<h3
								key={key}
								id={slugifyHeading(block.text)}
								className="reveal-up"
							>
								{block.text}
							</h3>
						);
					case "h4":
						return (
							<h4
								key={key}
								id={slugifyHeading(block.text)}
								className="reveal-up"
							>
								{block.text}
							</h4>
						);
					case "h5":
						return (
							<h5
								key={key}
								id={slugifyHeading(block.text)}
								className="reveal-up"
							>
								{block.text}
							</h5>
						);
					case "ul":
						return (
							<ul key={key} className="reveal-up">
								{block.items.map((item) => (
									<li key={item}>{item}</li>
								))}
							</ul>
						);
					case "blockquote":
						return (
							<blockquote key={key} className="article-pullquote reveal-up">
								{block.text}
							</blockquote>
						);
					default:
						return null;
				}
			})}
		</div>
	);
}

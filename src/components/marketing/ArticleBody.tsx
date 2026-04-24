import type { ArticleBlock } from "@/data/blogArticleBlocks";

function slugifyHeading(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

export function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
	return (
		<div className="article-body article-shell">
			{blocks.map((block, i) => {
				switch (block.type) {
					case "p":
						return (
							<p key={i} className="reveal-up">
								{block.text}
							</p>
						);
					case "h2":
						return (
							<h2 key={i} id={slugifyHeading(block.text)} className="reveal-up">
								{block.text}
							</h2>
						);
					case "h3":
						return (
							<h3 key={i} id={slugifyHeading(block.text)} className="reveal-up">
								{block.text}
							</h3>
						);
					case "ul":
						return (
							<ul key={i} className="reveal-up">
								{block.items.map((item) => (
									<li key={item}>{item}</li>
								))}
							</ul>
						);
					case "blockquote":
						return (
							<blockquote key={i} className="article-pullquote reveal-up">
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

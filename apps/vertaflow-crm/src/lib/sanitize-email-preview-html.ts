import sanitizeHtml from "sanitize-html";

/**
 * Sanitize HTML for the admin email composer preview.
 *
 * Uses `sanitize-html` (htmlparser2) instead of `isomorphic-dompurify` so we do not
 * pull `jsdom` into the bundle — Turbopack + Node on Vercel hit ERR_REQUIRE_ESM when
 * jsdom/html-encoding-sniffer load ESM-only `@exodus/bytes`.
 */
export function sanitizeEmailPreviewHtml(dirty: string): string {
	return sanitizeHtml(dirty, {
		allowedTags: [
			"h1",
			"h2",
			"h3",
			"h4",
			"h5",
			"h6",
			"p",
			"br",
			"hr",
			"blockquote",
			"ul",
			"ol",
			"li",
			"a",
			"b",
			"i",
			"strong",
			"em",
			"u",
			"s",
			"strike",
			"span",
			"div",
			"section",
			"article",
			"table",
			"thead",
			"tbody",
			"tr",
			"th",
			"td",
			"code",
			"pre",
			"img",
		],
		allowedAttributes: {
			a: ["href", "name", "target", "rel"],
			img: ["src", "alt", "width", "height"],
		},
		allowedSchemesByTag: {
			img: ["http", "https"],
			a: ["http", "https", "mailto", "tel"],
		},
	});
}

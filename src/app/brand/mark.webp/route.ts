import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Serves the brand mark at `/brand/mark.webp` from source or public copy so
 * direct requests succeed when the host does not expose `public/` statics.
 */
export async function GET() {
	const candidates = [
		join(process.cwd(), "src", "design-system", "brand-mark.webp"),
		join(process.cwd(), "public", "brand", "mark.webp"),
	];
	for (const path of candidates) {
		try {
			const buf = await readFile(path);
			return new NextResponse(buf, {
				headers: {
					"Content-Type": "image/webp",
					"Cache-Control": "public, max-age=31536000, immutable",
				},
			});
		} catch {
			/* try next path */
		}
	}
	return new NextResponse(null, { status: 404 });
}

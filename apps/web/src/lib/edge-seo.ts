import type { NextRequest } from "next/server";

/** Known search crawler user-agent substrings (conservative list). */
const CRAWLER_SUBSTRINGS = [
	"googlebot",
	"bingbot",
	"duckduckbot",
	"applebot",
	"facebookexternalhit",
	"linkedinbot",
	"slackbot",
	"twitterbot",
] as const;

export function isSearchEngineBot(request: NextRequest): boolean {
	const ua = request.headers.get("user-agent")?.toLowerCase() ?? "";
	return CRAWLER_SUBSTRINGS.some((s) => ua.includes(s));
}

/** Hero A/B bucket cookie — set at Edge before HTML streams (no client flicker). */
export const HERO_AB_COOKIE = "dba_hero_ab";

export type HeroAbVariant = "control" | "alt";

export function heroVariantFromCookie(raw: string | undefined): HeroAbVariant {
	return raw === "alt" ? "alt" : "control";
}

export function pickHeroAbVariant(request: NextRequest): HeroAbVariant {
	const existing = request.cookies.get(HERO_AB_COOKIE)?.value;
	if (existing === "alt" || existing === "control") {
		return existing;
	}
	return Math.random() < 0.5 ? "control" : "alt";
}

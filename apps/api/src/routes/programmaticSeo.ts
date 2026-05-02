import {
listAllInfrastructurePaths,
parseInfrastructureParams,
} from "../../../../packages/shared/src/lib/programmaticSeo";
import { createD1Client } from "@dba/shared/db/client";
import { seo_metadata } from "@dba/shared/db/schema";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

interface CloudflareEnv {
// D1Database is a CF Workers global; use unknown for TS compat outside worker context
DB?: unknown;
}

/**
 * Programmatic SEO data for Next.js — served from the Worker (not Node) for low latency.
 */
export const programmaticSeoRoute = new Elysia({ prefix: "/api/seo" })
.get("/metadata", async ({ query, set, request }) => {
	const pageUrl = query.page_url;
	if (!pageUrl || typeof pageUrl !== "string") {
		set.status = 400;
		return { error: "page_url query parameter is required" };
	}
	const env = (request as Request & { cf?: unknown } & { env?: CloudflareEnv }).env ?? ((globalThis as unknown as { __env__?: CloudflareEnv }).__env__);
	const d1 = (env as CloudflareEnv | undefined)?.DB;
	if (!d1) {
		set.status = 503;
		return { error: "database_unavailable" };
	}
	const db = createD1Client(d1);
	const rows = await db
		.select()
		.from(seo_metadata)
		.where(eq(seo_metadata.page_url, pageUrl))
		.limit(1);
	const row = rows[0];
	if (!row || row.status !== "Published") {
		set.status = 404;
		return { error: "not_found" };
	}
	set.headers["Cache-Control"] = "public, s-maxage=3600, stale-while-revalidate=86400";
	return { title: row.title, description: row.description ?? "", keywords: row.keywords ?? "" };
})
	.get("/infrastructure/:city/:industry", ({ params, set }) => {
		const payload = parseInfrastructureParams(params);
		if (!payload) {
			set.status = 404;
			return { error: "not_found" as const };
		}
		set.headers["Cache-Control"] =
			"public, s-maxage=86400, stale-while-revalidate=604800";
		return payload;
	})
	.get("/infrastructure-index", ({ set }) => {
		set.headers["Cache-Control"] =
			"public, s-maxage=3600, stale-while-revalidate=86400";
		return {
			paths: listAllInfrastructurePaths().map(({ city, industry }) => ({
				city,
				industry,
				path: `/infrastructure/${city}/${industry}`,
			})),
		};
	});

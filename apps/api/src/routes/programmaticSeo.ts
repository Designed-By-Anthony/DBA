import {
	listAllInfrastructurePaths,
	parseInfrastructureParams,
} from "../../../../packages/shared/src/lib/programmaticSeo";
import { Elysia } from "elysia";

/**
 * Programmatic SEO data for Next.js — served from the Worker (not Node) for low latency.
 */
export const programmaticSeoRoute = new Elysia({ prefix: "/api/seo" })
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

import { cors } from "@elysiajs/cors";
import { setReportKV } from "@lh/lib/report-store";
import { Elysia } from "elysia";
import { CloudflareAdapter } from "elysia/adapter/cloudflare-worker";
import { isTrustedMarketingBrowserOrigin } from "@/lib/marketingBrowserOrigins";
import { auditRoute } from "./routes/audit";
import { auditEmailSummaryRoute } from "./routes/auditEmailSummary";
import { leadEmailRoute } from "./routes/leadEmail";
import { reportRoute } from "./routes/report";
import { reportEmailRoute } from "./routes/reportEmail";
import { testEmailsRoute } from "./routes/testEmails";

const app = new Elysia({ adapter: CloudflareAdapter })
	.onRequest(({ request }) => {
		const env = (
			request as unknown as { cf?: { env?: Record<string, unknown> } }
		).cf?.env;
		const kvBinding =
			(globalThis as unknown as Record<string, unknown>).AUDIT_REPORTS_KV ??
			env?.AUDIT_REPORTS_KV;
		if (kvBinding) {
			setReportKV(kvBinding as Parameters<typeof setReportKV>[0]);
		}
	})
	.use(
		cors({
			origin: (request) =>
				isTrustedMarketingBrowserOrigin(request.headers.get("origin")),
			allowedHeaders: ["Content-Type", "Authorization"],
			methods: ["GET", "POST", "DELETE", "OPTIONS"],
		}),
	)
	.get("/", ({ set }) => {
		set.headers["Cache-Control"] = "no-store";
		return { ok: true, service: "dba-api" };
	})
	.get("/health", ({ set }) => {
		set.headers["Cache-Control"] = "no-store";
		return { ok: true, service: "dba-api" };
	})
	.get(
		"/favicon.ico",
		() =>
			new Response(null, {
				status: 204,
				headers: { "Cache-Control": "public, max-age=86400" },
			}),
	)
	.use(auditRoute)
	.use(auditEmailSummaryRoute)
	.use(leadEmailRoute)
	.use(reportRoute)
	.use(reportEmailRoute)
	.use(testEmailsRoute)
	// This is required to make Elysia work on Cloudflare Worker
	.compile();

export default app;

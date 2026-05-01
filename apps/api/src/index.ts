import { env } from "cloudflare:workers";
import { cors } from "@elysiajs/cors";
import { createD1Client } from "@dba/shared/db/client";
import { setLeadsDb } from "@/lib/d1Leads";
import { setReportKV } from "@lh/lib/report-store";
import { Elysia } from "elysia";
import { CloudflareAdapter } from "elysia/adapter/cloudflare-worker";
import { isTrustedMarketingBrowserOrigin } from "@/lib/marketingBrowserOrigins";
import { auditRoute } from "./routes/audit";
import { auditEmailSummaryRoute } from "./routes/auditEmailSummary";
import { leadEmailRoute } from "./routes/leadEmail";
import { reportRoute } from "./routes/report";
import { reportEmailRoute } from "./routes/reportEmail";
import { reportPdfRoute } from "./routes/reportPdf";
import { testEmailsRoute } from "./routes/testEmails";

const kvBinding = (env as Record<string, unknown>).AUDIT_REPORTS_KV;
if (kvBinding) {
	setReportKV(kvBinding as Parameters<typeof setReportKV>[0]);
}

// Wire the D1 binding so route handlers can insert leads without carrying
// the binding through every function signature.
const d1Binding = (env as Record<string, unknown>).DBA_LEADS_DB;
if (d1Binding) {
	setLeadsDb(createD1Client(d1Binding));
}

const app = new Elysia({ adapter: CloudflareAdapter })
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
	.use(reportPdfRoute)
	.use(testEmailsRoute)
	// This is required to make Elysia work on Cloudflare Worker
	.compile();

export default app;

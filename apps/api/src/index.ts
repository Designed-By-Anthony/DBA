import { createD1Client } from "@dba/shared/db/client";
import { cors } from "@elysiajs/cors";
import { setReportKV } from "@dba/shared/lighthouse/lib/report-store";
import { Elysia } from "elysia";
import { CloudflareAdapter } from "elysia/adapter/cloudflare-worker";
import { setLedgerDb } from "@dba/shared/lib/d1Leads";
import { isTrustedMarketingBrowserOrigin } from "@dba/shared/lib/marketingBrowserOrigins";
import { auditRoute } from "./routes/audit";
import { auditEmailSummaryRoute } from "./routes/auditEmailSummary";
import { leadEmailRoute } from "./routes/leadEmail";
import { programmaticSeoRoute } from "./routes/programmaticSeo";
import { reportRoute } from "./routes/report";
import { reportEmailRoute } from "./routes/reportEmail";
import { reportPdfRoute } from "./routes/reportPdf";
import { testEmailsRoute } from "./routes/testEmails";
import { leadsRoute } from "./routes/leads";

// Mock the Cloudflare Workers environment for non-Worker environments
const env = typeof process !== "undefined" && process.env ? process.env : {
	AUDIT_REPORTS_KV: undefined,
	DB: undefined,
};

const workerBindings = env as unknown as {
	AUDIT_REPORTS_KV?: any;
	DB?: any;
};

const kvBinding = workerBindings.AUDIT_REPORTS_KV;
if (kvBinding) {
	setReportKV(kvBinding);
}

// Wire the D1 binding so route handlers can insert leads without carrying
// the binding through every function signature.
const d1Binding = workerBindings.DB;
if (d1Binding) {
	setLedgerDb(createD1Client(d1Binding));
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
  .use(leadsRoute)
  .use(programmaticSeoRoute)
  .use(reportRoute)
  .use(reportEmailRoute)
  .use(reportPdfRoute)
  .use(testEmailsRoute)
	.use(programmaticSeoRoute)
	// This is required to make Elysia work on Cloudflare Worker
	.compile();

export default app;

// Export the App type for Eden Treaty client generation
export type App = typeof app;

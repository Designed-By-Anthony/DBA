import { cors } from "@elysiajs/cors";
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
	.use(
		cors({
			origin: (request) =>
				isTrustedMarketingBrowserOrigin(request.headers.get("origin")),
			allowedHeaders: ["Content-Type", "Authorization"],
			methods: ["GET", "POST", "DELETE", "OPTIONS"],
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

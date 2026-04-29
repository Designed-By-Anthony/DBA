import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { auditRoute } from "./routes/audit";
import { auditEmailSummaryRoute } from "./routes/auditEmailSummary";
import { leadEmailRoute } from "./routes/leadEmail";
import { reportRoute } from "./routes/report";
import { reportEmailRoute } from "./routes/reportEmail";
import { testEmailsRoute } from "./routes/testEmails";

const ALLOWED_ORIGINS = [
	"https://designedbyanthony.com",
	"https://www.designedbyanthony.com",
	"http://localhost:3000",
	"http://localhost:4321",
	"http://127.0.0.1:3000",
	"http://127.0.0.1:4321",
];

const app = new Elysia()
	.use(
		cors({
			origin: (origin) => {
				if (!origin) return false;
				if (ALLOWED_ORIGINS.includes(origin)) return true;
				// Allow *.designedbyanthony.com subdomains and preview hostnames
				try {
					const url = new URL(origin);
					if (
						url.protocol === "https:" &&
						url.hostname.endsWith(".designedbyanthony.com")
					)
						return true;
					const h = url.hostname.toLowerCase();
					return (
						h.endsWith(".hosted.app") ||
						h.endsWith(".web.app") ||
						h.endsWith(".firebaseapp.com")
					);
				} catch {
					return false;
				}
			},
			allowedHeaders: ["Content-Type", "Authorization"],
			methods: ["GET", "POST", "DELETE", "OPTIONS"],
		}),
	)
	.use(auditRoute)
	.use(auditEmailSummaryRoute)
	.use(leadEmailRoute)
	.use(reportRoute)
	.use(reportEmailRoute)
	.use(testEmailsRoute);

export default app;

import {
	clearGmailTestOutbox,
	getGmailTestOutbox,
	isGmailTestMode,
} from "@dba/shared/lighthouse/lib/gmail";
import { Elysia } from "elysia";

export const testEmailsRoute = new Elysia({ aot: false })
	.get("/api/test/emails", ({ set }) => {
		if (!isGmailTestMode()) {
			set.status = 404;
			return { error: "Not Found" };
		}
		const emails = getGmailTestOutbox();
		return { count: emails.length, emails };
	})
	.delete("/api/test/emails", ({ set }) => {
		if (!isGmailTestMode()) {
			set.status = 404;
			return { error: "Not Found" };
		}
		clearGmailTestOutbox();
		return { success: true };
	});

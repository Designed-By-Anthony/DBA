import { getEmailHistory } from "../../actions";
import EmailHistoryClient from "./EmailHistoryClient";

export const dynamic = "force-dynamic";

export default async function EmailHistoryPage() {
	let initialEmails: Awaited<ReturnType<typeof getEmailHistory>> = [];
	try {
		initialEmails = await getEmailHistory();
	} catch {
		initialEmails = [];
	}

	return <EmailHistoryClient initialEmails={initialEmails} />;
}

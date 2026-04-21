import type { Metadata } from "next";
import AutomationsClient from "./AutomationsClient";
import { getAutomations } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Automations | Agency OS",
	description: "Agentic workflow automation rules",
};

export default async function AutomationsPage() {
	const rules = await getAutomations();

	return <AutomationsClient initialRules={rules} />;
}

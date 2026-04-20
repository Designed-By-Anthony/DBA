import { getAutomations } from "./actions";
import AutomationsClient from "./AutomationsClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Automations | Agency OS",
  description: "Agentic workflow automation rules",
};

export default async function AutomationsPage() {
  const rules = await getAutomations();

  return <AutomationsClient initialRules={rules} />;
}

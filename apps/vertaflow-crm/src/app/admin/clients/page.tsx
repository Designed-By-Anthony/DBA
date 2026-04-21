import type { Metadata } from "next";
import { listClientOrgs } from "./actions";
import ClientsClient from "./ClientsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "My Clients | Agency OS",
	description: "Manage your client organizations",
};

export default async function ClientsPage() {
	const orgs = await listClientOrgs();

	return <ClientsClient initialOrgs={orgs} />;
}

import PreviewShell from "@/components/PreviewShell";
import { notFound } from "next/navigation";
import { getDb, leads } from "@dba/database";
import { eq } from "drizzle-orm";

export default async function CustomerPreviewPage({ params }: { params: Promise<{ customer: string }> }) {
  const { customer } = await params;
  const customerSlug = customer.toLowerCase();

  // Try to find a lead / client record by prospectId slug
  let clientData = null;
  const db = getDb();
  if (db) {
    try {
      const rows = await db
        .select({ name: leads.name, targetUrl: leads.targetUrl })
        .from(leads)
        .where(eq(leads.prospectId, customerSlug))
        .limit(1);

      if (rows.length > 0 && rows[0].targetUrl) {
        clientData = {
          name: rows[0].name,
          targetUrl: rows[0].targetUrl,
        };
      }
    } catch (error) {
      console.warn("Database fetch failed. Using fallback.", error);
    }
  }

  // Graceful fallback for demo testing
  if (!clientData && customerSlug === 'demo') {
    clientData = {
      name: "Acme Corp (Fallback)",
      targetUrl: "https://example.com"
    };
  }

  if (!clientData) {
    return notFound();
  }

  return <PreviewShell clientName={clientData.name} targetUrl={clientData.targetUrl} />;
}

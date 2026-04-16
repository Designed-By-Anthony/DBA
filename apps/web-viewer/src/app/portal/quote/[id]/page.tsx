import { db } from "@/lib/firebase";
import type { Quote } from "@/lib/types";
import { formatCents } from "@/lib/currency";
import { notFound } from "next/navigation";
import QuoteClientInteractive from "./QuoteClientInteractive";

/** One-line server summary using the same formatter as the client to avoid price display drift. */
function quoteInvestmentSummary(quote: Quote): string | null {
  const pkgs = quote.packages;
  if (!pkgs?.length) return null;
  const oneTime = pkgs.map((p) => p.totalOneTimeCents);
  const rec = pkgs.map((p) => p.totalRecurringCents).filter((n) => n > 0);
  const minO = Math.min(...oneTime);
  const maxO = Math.max(...oneTime);
  const parts: string[] = [];
  if (minO === maxO) parts.push(`${formatCents(minO)} upfront`);
  else parts.push(`${formatCents(minO)}–${formatCents(maxO)} upfront`);
  if (rec.length) {
    const rMin = Math.min(...rec);
    const rMax = Math.max(...rec);
    if (rMin === rMax) parts.push(`${formatCents(rMin)}/mo ongoing`);
    else parts.push(`${formatCents(rMin)}–${formatCents(rMax)}/mo ongoing`);
  }
  return parts.join(" · ");
}

export default async function PortalQuotePage({ params }: { params: { id: string } }) {
  // Try to find the quote across any prospect using collectionGroup
  const quoteQuery = await db.collectionGroup("quotes").where("id", "==", params.id).limit(1).get();
  
  if (quoteQuery.empty) {
    notFound();
  }

  const quoteDoc = quoteQuery.docs[0];
  const quote = quoteDoc.data() as Quote;

  // Mark as viewed if it's currently draft or sent
  if (quote.status === 'draft' || quote.status === 'sent') {
    await quoteDoc.ref.update({ status: 'viewed' });
  }

  const prospectDoc = await db.collection("prospects").doc(quote.prospectId).get();
  const prospectName = prospectDoc.data()?.company || prospectDoc.data()?.name || "Valued Client";
  const investmentLine = quoteInvestmentSummary(quote);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Project Proposal</h1>
        <p className="text-text-muted">Prepared for {prospectName}</p>
        {investmentLine && (
          <p className="text-sm text-text-gray mt-3 font-mono tabular-nums">
            {investmentLine}
          </p>
        )}
      </div>

      <QuoteClientInteractive quote={quote} companyName={prospectName} />
    </div>
  );
}

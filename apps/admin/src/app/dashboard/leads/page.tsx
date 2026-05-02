export const dynamic = "force-dynamic";

import { api } from "../../../lib/api";
import { type Lead } from "@dba/shared/db/schema";
import { RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";

export default async function LeadsDashboardPage() {
  let leads: Lead[] = [];
  let error: string | null = null;
  
  try {
    const { data } = await api.leads.get();
    if (data && data.leads) {
      leads = data.leads;
    }
  } catch (err) {
    console.error("Failed to fetch leads:", err);
    error = "Failed to fetch leads. Please try again.";
  }
  
  // Calculate analytics
  const totalLeads = leads.length;
  const newLeads = leads.filter(lead => lead.status === "New").length;
  const contactedLeads = leads.filter(lead => lead.status === "Contacted").length;
  const qualifiedLeads = leads.filter(lead => lead.status === "Provisioning").length;
  const conversionRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;
  
  // Placeholder revenue projection - would come from transactions in real implementation
  const revenueProjection = "$15,000";

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-white">
          Lead Management
        </h1>
        <div className="flex items-center gap-4">
          <button 
            className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20 transition-colors"
            onClick={async () => {
              // Client-side refresh
              window.location.reload();
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Analytics Widgets */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-10">
        <div className="rounded-lg bg-white/5 p-6 border border-white/10">
          <h3 className="text-sm font-medium text-white/60 mb-2">Total Leads</h3>
          <p className="text-3xl font-bold text-white">{totalLeads}</p>
        </div>
        <div className="rounded-lg bg-white/5 p-6 border border-white/10">
          <h3 className="text-sm font-medium text-white/60 mb-2">Conversion Rate</h3>
          <p className="text-3xl font-bold text-white">{conversionRate}%</p>
        </div>
        <div className="rounded-lg bg-white/5 p-6 border border-white/10">
          <h3 className="text-sm font-medium text-white/60 mb-2">Revenue Projection</h3>
          <p className="text-3xl font-bold text-white">{revenueProjection}</p>
        </div>
      </div>

      {/* Lead Management Table */}
      <section className="mt-10">
        <h2 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold text-white mb-6">
          Lead Pipeline
        </h2>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-900/20 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="text-bubble is-bordered overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm font-[family-name:var(--font-inter)] text-white/90">
            <thead>
              <tr className="border-b border-white/10">
                <th className="font-[family-name:var(--font-fraunces)] py-2 pr-4 font-semibold">
                  ID
                </th>
                <th className="font-[family-name:var(--font-fraunces)] py-2 pr-4 font-semibold">
                  Email
                </th>
                <th className="font-[family-name:var(--font-fraunces)] py-2 pr-4 font-semibold">
                  Company
                </th>
                <th className="font-[family-name:var(--font-fraunces)] py-2 pr-4 font-semibold">
                  Status
                </th>
                <th className="font-[family-name:var(--font-fraunces)] py-2 pr-4 font-semibold">
                  Created At
                </th>
                <th className="font-[family-name:var(--font-fraunces)] py-2 pr-4 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-white/50">
                    {error ? "Failed to load leads" : "No leads found"}
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2 pr-4 font-mono text-xs">
                      <Link href={`/dashboard/leads/${lead.id}`} className="hover:text-white transition-colors">
                        {lead.id.slice(0, 8)}...
                      </Link>
                    </td>
                    <td className="py-2 pr-4">
                      <Link href={`mailto:${lead.email}`} className="hover:text-white transition-colors">
                        {lead.email}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-amber-400">
                      {lead.company_name ?? "—"}
                    </td>
                    <td className="py-2 pr-4">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="py-2 pr-4 tabular-nums">
                      {lead.created_at ? new Date(lead.created_at).toLocaleString() : "—"}
                    </td>
                    <td className="py-2 pr-4">
                      <DeleteLeadButton leadId={lead.id} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusColors = {
    New: "bg-blue-900/50 text-blue-300",
    Contacted: "bg-yellow-900/50 text-yellow-300",
    Qualified: "bg-green-900/50 text-green-300",
    Provisioning: "bg-purple-900/50 text-purple-300",
    Closed: "bg-gray-900/50 text-gray-300"
  };
  
  const colorClass = statusColors[status as keyof typeof statusColors] || "bg-gray-900/50 text-gray-300";
  
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  );
}

function DeleteLeadButton({ leadId }: { leadId: string }) {
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this lead?")) {
      try {
        const response = await fetch(`/api/leads/${leadId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          }
        });
        
        if (response.ok) {
          window.location.reload();
        } else {
          alert("Failed to delete lead");
        }
      } catch (error) {
        console.error("Error deleting lead:", error);
        alert("Error deleting lead");
      }
    }
  };
  
  return (
    <button 
      onClick={handleDelete}
      className="text-red-400 hover:text-red-300 transition-colors"
      title="Delete lead"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

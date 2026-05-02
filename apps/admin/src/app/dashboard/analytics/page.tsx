export const dynamic = "force-dynamic";

import { api } from "../../../lib/api";
import { type Lead, type Transaction } from "@dba/shared/db/schema";
import { BarChart, Users, DollarSign, TrendingUp } from "lucide-react";

export default async function AnalyticsDashboardPage() {
  let leads: Lead[] = [];
  let transactions: Transaction[] = [];
  let error: string | null = null;
  
  try {
    // Fetch leads
    const leadsResponse = await api.leads.get();
    if (leadsResponse.data && leadsResponse.data.leads) {
      leads = leadsResponse.data.leads;
    }
    
    // Note: Transactions endpoint would be added similarly to leads endpoint
    // For now, we'll use placeholder data
  } catch (err) {
    console.error("Failed to fetch analytics data:", err);
    error = "Failed to fetch analytics data. Please try again.";
  }
  
  // Calculate metrics
  const totalLeads = leads.length;
  const leadsByStatus = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const leadsBySource = leads.reduce((acc, lead) => {
    acc[lead.source] = (acc[lead.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Placeholder data for transactions (would come from real API)
  const totalRevenue = "$12,500"; // Would calculate from transactions
  const averageDealSize = "$1,250"; // Would calculate from transactions
  const conversionRate = totalLeads > 0 ? Math.round((leadsByStatus["Qualified"] || 0) / totalLeads * 100) : 0;

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-white">
          Analytics Dashboard
        </h1>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
        <div className="rounded-lg bg-white/5 p-6 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-medium text-white/60">Total Leads</h3>
          </div>
          <p className="text-3xl font-bold text-white">{totalLeads}</p>
          <p className="text-xs text-white/50 mt-1">All time</p>
        </div>
        
        <div className="rounded-lg bg-white/5 p-6 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <h3 className="text-sm font-medium text-white/60">Conversion Rate</h3>
          </div>
          <p className="text-3xl font-bold text-white">{conversionRate}%</p>
          <p className="text-xs text-white/50 mt-1">Qualified leads</p>
        </div>
        
        <div className="rounded-lg bg-white/5 p-6 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-yellow-400" />
            <h3 className="text-sm font-medium text-white/60">Total Revenue</h3>
          </div>
          <p className="text-3xl font-bold text-white">{totalRevenue}</p>
          <p className="text-xs text-white/50 mt-1">All time</p>
        </div>
        
        <div className="rounded-lg bg-white/5 p-6 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <BarChart className="h-5 w-5 text-purple-400" />
            <h3 className="text-sm font-medium text-white/60">Avg Deal Size</h3>
          </div>
          <p className="text-3xl font-bold text-white">{averageDealSize}</p>
          <p className="text-xs text-white/50 mt-1">Per customer</p>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Leads by Status */}
        <div className="rounded-lg bg-white/5 p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Leads by Status
          </h3>
          
          <div className="space-y-4">
            {Object.entries(leadsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusBadge status={status} />
                  <span className="text-white/80">{status}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-white font-medium">{count}</span>
                  <span className="text-white/50 text-sm">
                    {Math.round(count / totalLeads * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leads by Source */}
        <div className="rounded-lg bg-white/5 p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Leads by Source
          </h3>
          
          <div className="space-y-4">
            {Object.entries(leadsBySource).map(([source, count]) => (
              <div key={source} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-white/80">{formatSourceName(source)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-white font-medium">{count}</span>
                  <span className="text-white/50 text-sm">
                    {Math.round(count / totalLeads * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        
        <div className="rounded-lg bg-white/5 p-6 border border-white/10">
          {leads.length === 0 ? (
            <p className="text-white/50 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {leads.slice(0, 5).map((lead) => (
                <div key={lead.id} className="flex items-start gap-3 p-3 hover:bg-white/5 rounded-md transition-colors">
                  <div className="mt-1">
                    <StatusBadge status={lead.status} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-medium">{lead.email}</p>
                      <span className="text-white/50 text-sm">
                        {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "—"}
                      </span>
                    </div>
                    <p className="text-white/70 text-sm">
                      {lead.company_name || "No company"} · {lead.source}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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

function formatSourceName(source: string): string {
  return source
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

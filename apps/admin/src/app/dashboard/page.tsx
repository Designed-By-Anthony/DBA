export const dynamic = "force-dynamic";

import Link from "next/link";
import { Users, BarChart, TrendingUp, DollarSign } from "lucide-react";

export default function DashboardHomePage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-white">
          Admin Dashboard
        </h1>
        <p className="text-white/60 mt-2">Welcome to the ANTHONY. command center</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link 
          href="/dashboard/leads"
          className="rounded-lg bg-white/5 p-8 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-blue-900/30 p-3">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Lead Management</h3>
              <p className="text-white/60 text-sm">View and manage all leads</p>
            </div>
          </div>
        </Link>

        <Link 
          href="/dashboard/analytics"
          className="rounded-lg bg-white/5 p-8 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-purple-900/30 p-3">
              <BarChart className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Analytics</h3>
              <p className="text-white/60 text-sm">Performance metrics and insights</p>
            </div>
          </div>
        </Link>

        <div className="rounded-lg bg-white/5 p-8 border border-white/10 opacity-50 cursor-not-allowed">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-green-900/30 p-3">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Revenue</h3>
              <p className="text-white/60 text-sm">Financial overview (coming soon)</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white/5 p-8 border border-white/10 opacity-50 cursor-not-allowed">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-yellow-900/30 p-3">
              <DollarSign className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Transactions</h3>
              <p className="text-white/60 text-sm">Payment history (coming soon)</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

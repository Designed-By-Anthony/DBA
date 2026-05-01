import type { ReactNode } from "react";
import Link from "next/link";
import { Home, Users, BarChart, Settings } from "lucide-react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/10 bg-black p-6 hidden md:block">
          <div className="mb-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Home className="h-6 w-6 text-white" />
              <span className="text-xl font-semibold text-white">Dashboard</span>
            </Link>
          </div>
          
          <nav className="space-y-2">
            <Link 
              href="/dashboard/leads"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Users className="h-4 w-4" />
              Leads
            </Link>
            
            <Link 
              href="/dashboard/analytics"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <BarChart className="h-4 w-4" />
              Analytics
            </Link>
            
            <Link 
              href="/dashboard/settings"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </nav>
        </aside>
        
        {/* Main content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import type { BookingEvent } from "@/lib/types";

export default function AdminCalendarPage() {
  const [bookings] = useState<BookingEvent[]>([]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Calendar & Bookings</h1>
          <p className="text-text-muted">Manage your schedule and enforce No-Show policies.</p>
        </div>
        <button className="bg-(--color-brand) px-4 py-2 rounded-lg text-sm text-white font-medium hover:bg-brand-hover transition-colors">
          + Add Time Off
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mock Calendar Grid */}
        <div className="flex-1 bg-surface-1 border border-glass-border rounded-2xl p-6 min-h-[500px]">
          <h2 className="font-semibold text-white mb-6">Upcoming Week (Mock View)</h2>
          <div className="border border-dashed border-glass-border h-full rounded-xl flex items-center justify-center text-text-muted">
            Full Calendar Sync integration required.
          </div>
        </div>

        {/* Auth Hold Sidebar */}
        <div className="w-full lg:w-96 space-y-4">
          <div className="bg-surface-1 border border-glass-border rounded-2xl p-6">
             <h2 className="font-semibold text-white border-b border-glass-border pb-3 mb-4">Pending Deposits</h2>
             <p className="text-xs text-text-muted mb-4">Cards authorized but not yet captured.</p>

             {bookings.length === 0 ? (
               <div className="text-center py-6 text-text-muted text-sm bg-surface-2 rounded-lg border border-dashed border-glass-border">
                 No pending deposits.
               </div>
             ) : (
               <div className="space-y-3">
                 {/* Logic to map pending Stripe Intends would go here */}
               </div>
             )}
          </div>
          
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
             <h2 className="font-semibold text-amber-500 mb-2">Revenue Protection Active</h2>
             <p className="text-xs text-amber-400 opacity-80 leading-relaxed">
               All online bookings currently require a credit card vault to secure a timeslot. You have full authority to manually capture Vaulted penalties if a client no-shows.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use server";

import { db } from "@/lib/firebase";
import { verifyAuth } from "@/app/admin/actions";

export interface InboxItem {
  id: string;
  type: 'email' | 'ticket' | 'whatsapp' | 'sms';
  subject: string;
  preview: string;
  sender: string;
  prospectId?: string;
  createdAt: string;
  status: string;
  isRead: boolean;
}

/**
 * Omnichannel Unified Inbox Fetcher
 * Aggregates distinct communication protocols into a single feed.
 */
export async function getInboxStream(): Promise<InboxItem[]> {
  const session = await verifyAuth();
  const agencyId = session.user.agencyId;
  
  try {
    // 1. Parallel fetch disparate collections
    const [emailsSnap, ticketsSnap] = await Promise.all([
      db.collection("emails").where("agencyId", "==", agencyId).orderBy("createdAt", "desc").limit(30).get(),
      db.collection("tickets").where("agencyId", "==", agencyId).orderBy("createdAt", "desc").limit(30).get()
    ]);
    
    const items: InboxItem[] = [];
    
    // 2. Normalize Schema
    emailsSnap.docs.forEach(d => {
      const data = d.data();
      items.push({
        id: d.id,
        type: 'email',
        subject: data.subject || "No Subject",
        preview: data.bodyText?.substring(0, 100) || "No preview",
        sender: data.toEmail || "Unknown",
        prospectId: data.prospectId,
        createdAt: data.createdAt,
        status: data.status,
        isRead: true, // Simplified
      });
    });
    
    ticketsSnap.docs.forEach(d => {
      const data = d.data();
      items.push({
        id: d.id,
        type: 'ticket',
        subject: `Support Ticket`,
        preview: data.description?.substring(0, 100) || "No details",
        sender: "Portal Client",
        prospectId: data.prospectId,
        createdAt: data.createdAt,
        status: data.status,
        isRead: data.status !== 'open',
      });
    });
    
    // 3. Chronological Sort
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error("[Inbox Fetch] Error:", err);
    return [];
  }
}

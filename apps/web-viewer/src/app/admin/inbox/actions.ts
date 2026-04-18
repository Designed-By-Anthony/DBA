"use server";

import {
  getDb,
  withTenantContext,
  emails,
  tickets,
  type EmailRow,
  type TicketRow,
} from "@dba/database";
import { eq, desc } from "drizzle-orm";
import { verifyAuth } from "@/app/admin/actions";

export interface InboxItem {
  id: string;
  type: "email" | "ticket" | "whatsapp" | "sms";
  subject: string;
  preview: string;
  sender: string;
  prospectId?: string;
  createdAt: string;
  status: string;
  isRead: boolean;
}

/**
 * Maps database EmailRow to InboxItem
 */
function emailToInboxItem(row: EmailRow): InboxItem {
  const bodyText = row.bodyHtml || "";
  return {
    id: row.id,
    type: "email",
    subject: row.subject || "No Subject",
    preview: bodyText.substring(0, 100) || "No preview",
    sender: row.leadEmail || "Unknown",
    prospectId: row.leadId,
    createdAt: row.createdAt,
    status: row.status || "sent",
    isRead: true, // Simplified - no tracking column
  };
}

/**
 * Maps database TicketRow to InboxItem
 */
function ticketToInboxItem(row: TicketRow): InboxItem {
  const description = row.description || "";
  const status = row.status || "open";
  return {
    id: row.id,
    type: "ticket",
    subject: `Support Ticket`,
    preview: description.substring(0, 100) || "No details",
    sender: row.leadName || "Portal Client",
    prospectId: row.leadId,
    createdAt: row.createdAt,
    status,
    isRead: status !== "open",
  };
}

/**
 * Fetches aggregated inbox stream combining emails and tickets
 * Returns last 30 of each, sorted by createdAt DESC
 */
export async function getInboxStream(): Promise<InboxItem[]> {
  const session = await verifyAuth();
  const tenantId = session.user.agencyId;
  const db = getDb();

  if (!db) {
    return [];
  }

  try {
    // Fetch emails and tickets in parallel
    const [emailRows, ticketRows] = await withTenantContext(db, tenantId, async (tx) => {
      return Promise.all([
        tx
          .select()
          .from(emails)
          .where(eq(emails.tenantId, tenantId))
          .orderBy(desc(emails.createdAt))
          .limit(30),
        tx
          .select()
          .from(tickets)
          .where(eq(tickets.tenantId, tenantId))
          .orderBy(desc(tickets.createdAt))
          .limit(30),
      ]);
    });

    // Map to InboxItem format
    const items: InboxItem[] = [];

    emailRows.forEach((row) => {
      items.push(emailToInboxItem(row));
    });

    ticketRows.forEach((row) => {
      items.push(ticketToInboxItem(row));
    });

    // Sort combined array by createdAt DESC
    return items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (err) {
    console.error("[Inbox Fetch] Error:", err);
    return [];
  }
}

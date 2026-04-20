import { getInboxStream } from "./actions";
import InboxClient from "./InboxClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shared Inbox | Agency OS",
  description: "Omnichannel communication feed",
};

export default async function InboxPage() {
  const items = await getInboxStream();

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)] px-4 sm:px-8 py-6">
      <div className="flex flex-col gap-2 mb-2 animate-fade-in">
        <h1 className="text-2xl font-bold text-white tracking-tight">Omnichannel Inbox</h1>
        <p className="text-[var(--color-text-muted)] text-sm">Manage support tickets, emails, and integrated chats in a single collaborative interface.</p>
      </div>

      <InboxClient initialItems={items} />
    </div>
  );
}

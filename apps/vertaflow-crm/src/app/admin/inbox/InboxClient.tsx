"use client";

import { motion } from "framer-motion";
import { Inbox, Mail, MessageSquare, Reply, Ticket } from "lucide-react";
import { useState } from "react";
import type { InboxItem } from "./actions";

export default function InboxClient({
	initialItems,
}: {
	initialItems: InboxItem[];
}) {
	const [items] = useState<InboxItem[]>(initialItems);
	const [activeItemId, setActiveItemId] = useState<string | null>(
		initialItems[0]?.id || null,
	);
	const [replyText, setReplyText] = useState("");
	const [isInternalNote, setIsInternalNote] = useState(false);

	const activeItem = items.find((i) => i.id === activeItemId);

	const getTypeIcon = (type: string) => {
		switch (type) {
			case "email":
				return <Mail size={14} className="text-blue-400" />;
			case "whatsapp":
				return <MessageSquare size={14} className="text-emerald-400" />;
			case "ticket":
				return <Ticket size={14} className="text-amber-400" />;
			default:
				return <Mail size={14} />;
		}
	};

	const handleReply = (e: React.FormEvent) => {
		e.preventDefault();
		if (!replyText.trim()) return;
		// In a real app, send backend mutation here
		setReplyText("");
	};

	return (
		<div className="flex h-[calc(100vh-120px)] border border-glass-border rounded-xl overflow-hidden glass-card mt-6">
			{/* Left Sidebar: Feed */}
			<div className="w-[350px] border-r border-glass-border bg-surface-1 flex flex-col">
				<div className="p-4 border-b border-glass-border flex items-center justify-between">
					<h2 className="font-semibold text-white">Unified Inbox</h2>
					<span className="text-xs bg-surface-3 px-2 py-1 rounded text-text-muted font-mono">
						{items.length} records
					</span>
				</div>

				<div className="flex-1 overflow-y-auto workspace-scroll">
					{items.map((item) => (
						<button
							key={item.id}
							onClick={() => setActiveItemId(item.id)}
							className={`w-full text-left p-4 border-b border-glass-border transition-colors ${activeItemId === item.id ? "bg-surface-2 border-l-2 border-l-(--color-brand)" : "hover:bg-surface-2 border-l-2 border-l-transparent"}`}
						>
							<div className="flex justify-between items-start mb-1">
								<p className="text-sm font-medium text-white truncate pr-2">
									{item.sender}
								</p>
								<p className="text-[10px] text-text-muted whitespace-nowrap pt-0.5">
									{new Date(item.createdAt).toLocaleDateString()}
								</p>
							</div>
							<div className="flex items-center gap-2 mb-1">
								{getTypeIcon(item.type)}
								<p className="text-xs text-text-gray truncate font-medium">
									{item.subject}
								</p>
							</div>
							<p className="text-xs text-text-muted truncate opacity-80">
								{item.preview}
							</p>

							{!item.isRead && (
								<div className="mt-2 text-[10px] bg-red-500/20 text-red-300 w-max px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
									Unread
								</div>
							)}
						</button>
					))}
					{items.length === 0 && (
						<div className="p-8 text-center">
							<Inbox
								size={36}
								className="mx-auto mb-3 text-text-gray opacity-30"
							/>
							<p className="text-sm font-medium text-white mb-1">
								No messages yet
							</p>
							<p className="text-xs text-text-muted mb-4 max-w-[240px] mx-auto">
								Emails, tickets, and chat messages will flow here as your
								clients interact.
							</p>
							<a
								href="/email"
								className="text-xs text-(--color-brand) hover:underline"
							>
								Send your first email →
							</a>
						</div>
					)}
				</div>
			</div>

			{/* Right Column: Detail View */}
			<div className="flex-1 flex flex-col bg-(--color-surface-0) relative">
				{activeItem ? (
					<>
						{/* Header */}
						<div className="p-6 border-b border-glass-border">
							<div className="flex justify-between items-start mb-4">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-full bg-surface-3 flex items-center justify-center">
										{getTypeIcon(activeItem.type)}
									</div>
									<div>
										<h2 className="text-lg font-semibold text-white">
											{activeItem.subject}
										</h2>
										<p className="text-xs text-text-muted">
											{activeItem.sender} •{" "}
											{new Date(activeItem.createdAt).toLocaleString()}
										</p>
									</div>
								</div>
								<div className="flex gap-2 text-[10px] uppercase font-bold tracking-wider">
									<span className="bg-surface-2 text-white px-2 py-1 rounded">
										{activeItem.type}
									</span>
									<span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">
										{activeItem.status}
									</span>
								</div>
							</div>
						</div>

						{/* Conversation Feed */}
						<div className="flex-1 overflow-y-auto p-6 workspace-scroll">
							{/* Stubbed Initial Message */}
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								className="max-w-[85%] bg-surface-1 border border-glass-border rounded-2xl rounded-tl-sm p-4 text-sm text-text-gray mb-6"
							>
								{activeItem.preview}
							</motion.div>
						</div>

						{/* Reply Composer */}
						<div className="p-4 border-t border-glass-border bg-surface-1">
							<form onSubmit={handleReply} className="relative">
								<div className="flex mb-2 gap-2">
									<button
										type="button"
										onClick={() => setIsInternalNote(false)}
										className={`text-xs px-3 py-1 rounded transition-colors ${!isInternalNote ? "bg-surface-3 text-white font-medium" : "text-text-muted"}`}
									>
										Public Reply
									</button>
									<button
										type="button"
										onClick={() => setIsInternalNote(true)}
										className={`text-xs px-3 py-1 rounded transition-colors ${isInternalNote ? "bg-amber-500/20 text-amber-300 font-medium" : "text-text-muted"}`}
									>
										Internal Note
									</button>
								</div>

								<textarea
									value={replyText}
									onChange={(e) => setReplyText(e.target.value)}
									placeholder={
										isInternalNote
											? "Leave a private note for the team..."
											: `Reply via ${activeItem.type}...`
									}
									className={`w-full bg-(--color-surface-0) border rounded-lg p-3 text-sm text-white placeholder-white/30 outline-none transition-colors resize-none h-24 ${isInternalNote ? "border-amber-500/30 bg-amber-500/5" : "border-glass-border focus:border-(--color-brand)"}`}
								/>

								<div className="absolute bottom-3 right-3">
									<button
										type="submit"
										disabled={!replyText.trim()}
										className={`flex items-center gap-2 px-4 py-1.5 rounded text-xs font-semibold transition-all disabled:opacity-50 ${isInternalNote ? "bg-amber-500 hover:bg-amber-600 text-black" : "bg-(--color-brand) hover:bg-brand-hover text-white"}`}
									>
										<Reply size={14} />
										{isInternalNote ? "Save Note" : "Send"}
									</button>
								</div>
							</form>
						</div>
					</>
				) : (
					<div className="m-auto text-center text-text-muted flex flex-col items-center gap-4">
						<MessageSquare size={48} className="opacity-20" />
						<p className="text-sm">Select a message stream to begin.</p>
					</div>
				)}
			</div>
		</div>
	);
}

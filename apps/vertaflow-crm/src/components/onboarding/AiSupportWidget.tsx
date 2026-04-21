"use client";

import { AlertTriangle, Loader2, MessageCircle, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Message = { role: "user" | "model"; content: string };

export default function AiSupportWidget() {
	const [open, setOpen] = useState(false);
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [escalated, setEscalated] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		scrollRef.current?.scrollTo({
			top: scrollRef.current.scrollHeight,
			behavior: "smooth",
		});
	}, [messages]);

	const sendMessage = useCallback(async () => {
		const text = input.trim();
		if (!text || loading) return;

		const userMsg: Message = { role: "user", content: text };
		const updated = [...messages, userMsg];
		setMessages(updated);
		setInput("");
		setLoading(true);

		try {
			const res = await fetch("/api/admin/ai-support", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ messages: updated }),
			});

			if (!res.ok) throw new Error("Failed");

			const data = await res.json();
			const aiMsg: Message = { role: "model", content: data.message };
			setMessages([...updated, aiMsg]);

			if (data.shouldEscalate && !escalated) {
				// Auto-escalate to ticket
				await fetch("/api/admin/ai-support/escalate", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						summary: text.slice(0, 200),
						transcript: [...updated, aiMsg],
						priority: "medium",
					}),
				});
				setEscalated(true);
			}
		} catch {
			setMessages([
				...updated,
				{
					role: "model",
					content:
						"Sorry, I'm having trouble connecting. Please try again or email anthony@designedbyanthony.com.",
				},
			]);
		} finally {
			setLoading(false);
		}
	}, [input, loading, messages, escalated]);

	if (!open) {
		return (
			<button
				onClick={() => setOpen(true)}
				className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-[var(--color-brand)] text-white shadow-lg shadow-[var(--color-brand-glow)] hover:scale-110 transition-transform flex items-center justify-center"
				title="Ask our setup specialist"
			>
				<MessageCircle size={24} />
			</button>
		);
	}

	return (
		<div
			className="fixed bottom-6 left-6 z-50 w-[360px] h-[500px] rounded-2xl shadow-2xl border border-[var(--color-glass-border)] flex flex-col overflow-hidden"
			style={{
				background: "var(--color-surface-0)",
				animation: "slideUp 0.3s ease-out",
			}}
		>
			{/* Header */}
			<div
				className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-glass-border)]"
				style={{ background: "var(--color-surface-1)" }}
			>
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 rounded-full bg-[var(--color-brand)] flex items-center justify-center">
						<span className="text-white text-xs font-bold">AI</span>
					</div>
					<div>
						<p className="text-sm font-semibold text-white">Setup Specialist</p>
						<p className="text-xs text-emerald-400">Online</p>
					</div>
				</div>
				<button
					onClick={() => setOpen(false)}
					className="text-[var(--color-text-muted)] hover:text-white transition-colors"
				>
					<X size={18} />
				</button>
			</div>

			{/* Messages */}
			<div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
				{messages.length === 0 && (
					<div className="text-center py-8">
						<div className="w-12 h-12 rounded-full bg-[var(--color-brand)]/20 flex items-center justify-center mx-auto mb-3">
							<MessageCircle size={24} className="text-[var(--color-brand)]" />
						</div>
						<p className="text-sm text-white font-medium">
							Hi! I&apos;m your setup specialist.
						</p>
						<p className="text-xs text-[var(--color-text-muted)] mt-1">
							Ask me anything about getting started with Agency OS.
						</p>
					</div>
				)}

				{messages.map((msg, i) => (
					<div
						key={i}
						className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
					>
						<div
							className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
								msg.role === "user"
									? "bg-[var(--color-brand)] text-white rounded-br-sm"
									: "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] rounded-bl-sm"
							}`}
						>
							{msg.content}
						</div>
					</div>
				))}

				{loading && (
					<div className="flex justify-start">
						<div className="bg-[var(--color-surface-2)] rounded-2xl rounded-bl-sm px-4 py-2.5">
							<Loader2
								size={16}
								className="animate-spin text-[var(--color-text-muted)]"
							/>
						</div>
					</div>
				)}

				{escalated && (
					<div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300">
						<AlertTriangle size={14} />
						<span>
							A support ticket has been created. Our team will follow up
							shortly.
						</span>
					</div>
				)}
			</div>

			{/* Input */}
			<div
				className="p-3 border-t border-[var(--color-glass-border)]"
				style={{ background: "var(--color-surface-1)" }}
			>
				<div className="flex items-center gap-2">
					<input
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && sendMessage()}
						placeholder="Ask me anything..."
						className="flex-1 bg-[var(--color-surface-2)] border border-[var(--color-glass-border)] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[var(--color-brand)] transition-colors placeholder:text-[var(--color-text-muted)]"
						disabled={loading}
					/>
					<button
						onClick={sendMessage}
						disabled={loading || !input.trim()}
						className="w-10 h-10 rounded-xl bg-[var(--color-brand)] text-white flex items-center justify-center hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-50"
					>
						<Send size={16} />
					</button>
				</div>
			</div>

			<style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
		</div>
	);
}

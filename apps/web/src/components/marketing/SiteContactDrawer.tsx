"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { BRAND_MARK_IMAGE } from "@/design-system/brand";
import { businessProfile } from "@/lib/seo";

function ContactDrawerForm({ onSuccess }: { onSuccess?: () => void }) {
	const formId = useId();

	return (
		<form
			action="https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8&orgId=00Dao00001YO4nx"
			method="POST"
			className="space-y-4"
			onSubmit={() => {
				setTimeout(() => onSuccess?.(), 100);
			}}
		>
			<input type="hidden" name="oid" value="00Dao00001YO4nx" />
			<input
				type="hidden"
				name="retURL"
				value="https://designedbyanthony.com/thank-you"
			/>

			<div className="grid gap-3 sm:grid-cols-2">
				<div className="space-y-2">
					<label
						htmlFor={`${formId}-first_name`}
						className="block text-xs font-semibold uppercase tracking-[0.14em] text-white/70"
					>
						First Name
					</label>
					<input
						id={`${formId}-first_name`}
						maxLength={40}
						name="first_name"
						type="text"
						autoComplete="given-name"
						required
						className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/50 focus:bg-black/40"
					/>
				</div>
				<div className="space-y-2">
					<label
						htmlFor={`${formId}-email`}
						className="block text-xs font-semibold uppercase tracking-[0.14em] text-white/70"
					>
						Email
					</label>
					<input
						id={`${formId}-email`}
						maxLength={80}
						name="email"
						type="email"
						autoComplete="email"
						required
						className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/50 focus:bg-black/40"
					/>
				</div>
				<div className="space-y-2 sm:col-span-2">
					<label
						htmlFor={`${formId}-phone`}
						className="block text-xs font-semibold uppercase tracking-[0.14em] text-white/70"
					>
						Phone
					</label>
					<input
						id={`${formId}-phone`}
						maxLength={40}
						name="phone"
						type="tel"
						autoComplete="tel"
						className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/50 focus:bg-black/40"
					/>
				</div>
				<div className="space-y-2 sm:col-span-2">
					<label
						htmlFor={`${formId}-description`}
						className="block text-xs font-semibold uppercase tracking-[0.14em] text-white/70"
					>
						Message
					</label>
					<textarea
						id={`${formId}-description`}
						name="description"
						rows={4}
						placeholder="How can we help?"
						required
						className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/50 focus:bg-black/40"
					/>
				</div>
			</div>
			<button
				type="submit"
				className="inline-flex w-full items-center justify-center rounded-full border border-sky-300/40 bg-sky-500/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-sky-200/60 hover:bg-sky-500/30"
			>
				Send Message
			</button>
		</form>
	);
}

export function SiteContactDrawer() {
	const panelId = "site-contact-drawer-panel";
	const tabRef = useRef<HTMLButtonElement>(null);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (typeof document === "undefined") return;
		document.documentElement.classList.toggle("overflow-hidden", open);
		document.body.classList.toggle("overflow-hidden", open);
		return () => {
			document.documentElement.classList.remove("overflow-hidden");
			document.body.classList.remove("overflow-hidden");
		};
	}, [open]);

	useEffect(() => {
		if (!open || typeof document === "undefined") return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault();
				setOpen(false);
				tabRef.current?.focus();
			}
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [open]);

	const toggle = useCallback(() => setOpen((value) => !value), []);
	const close = useCallback(() => {
		setOpen(false);
		tabRef.current?.focus();
	}, []);

	return (
		<>
			<button
				ref={tabRef}
				type="button"
				onClick={toggle}
				aria-expanded={open}
				aria-controls={panelId}
				className="fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(8,12,20,0.92)] px-4 py-3 text-sm font-semibold text-white shadow-[0_20px_50px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl transition hover:bg-[rgba(8,12,20,0.98)]"
			>
				<span className="inline-flex size-2 rounded-full bg-[rgb(var(--accent-bronze-rgb))]" />
				Contact
			</button>
			{open ? (
				<button
					type="button"
					className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
					aria-label="Close contact drawer"
					onClick={close}
				/>
			) : null}
			<aside
				id={panelId}
				aria-hidden={!open}
				className={`fixed inset-x-0 bottom-0 z-[95] max-h-[85vh] rounded-t-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,23,35,0.98),rgba(6,10,18,0.99))] shadow-[0_-24px_60px_-28px_rgba(0,0,0,0.8)] transition duration-300 md:bottom-6 md:left-auto md:right-6 md:inset-x-auto md:w-[420px] md:max-w-[calc(100vw-3rem)] md:rounded-[28px] ${open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0 md:translate-y-8"}`}
			>
				<div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
					<div className="flex items-center gap-3">
						<Image
							src={BRAND_MARK_IMAGE}
							alt=""
							width={BRAND_MARK_IMAGE.width}
							height={BRAND_MARK_IMAGE.height}
							aria-hidden
						/>
						<div>
							<p className="text-sm font-semibold text-white">
								Start the conversation
							</p>
							<p className="text-xs uppercase tracking-[0.14em] text-white/45">
								Replies within one business day
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={close}
						className="inline-flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
						aria-label="Close contact drawer"
					>
						×
					</button>
				</div>
				<div className="space-y-5 overflow-y-auto px-5 py-5">
					<ContactDrawerForm onSuccess={close} />
					<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
						<p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
							Prefer a call?
						</p>
						<a
							href={businessProfile.telephoneHref}
							onClick={close}
							className="mt-2 block text-lg font-semibold text-white transition hover:text-sky-200"
						>
							{businessProfile.telephone.replace("+1-", "")}
						</a>
					</div>
				</div>
			</aside>
		</>
	);
}

"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { BRAND_MARK_IMAGE } from "@/design-system/brand";
import { btnPrimary, btnSm } from "@/design-system/buttons";
import {
	descriptionAlreadyHasRegionPrefix,
	regionTagFromPhone,
} from "@/lib/leadRegion";
import { businessProfile } from "@/lib/seo";

const BODY_LOCK_CLASS = "site-contact-drawer-open";

/* ── Inline Tailwind: site-quick-rail + nav-rail (layout-shell.css) ── */

/*
 * Host wraps the tab + panel. Mobile (<1200px): bottom-sheet, slides up.
 * Desktop (>=1200px): left-edge drawer, slides in from the left.
 * Marker classes preserved for JS hooks: site-quick-rail-host,
 * site-quick-rail-host--open, site-quick-rail-host--hydrated.
 */
const HOST_BASE =
	"site-quick-rail-host block min-w-0 motion-reduce:[&_*]:!transition-none print:hidden";
const HOST_RESPONSIVE =
	"max-[1199px]:fixed max-[1199px]:inset-0 max-[1199px]:z-[88] max-[1199px]:invisible max-[1199px]:pointer-events-none max-[1199px]:[transform-origin:50%_100%] [&.site-quick-rail-host--hydrated]:max-[1199px]:visible min-[1200px]:fixed min-[1200px]:left-0 min-[1200px]:top-44 min-[1200px]:z-[88] min-[1200px]:invisible min-[1200px]:pointer-events-none min-[1200px]:[transform-origin:0%_100%] min-[1200px]:[transform:translate3d(-100%,0,0)] min-[1200px]:transition-transform min-[1200px]:duration-[280ms] min-[1200px]:[transition-timing-function:cubic-bezier(0.22,1,0.36,1)] [&.site-quick-rail-host--hydrated]:min-[1200px]:visible [&.site-quick-rail-host--open]:min-[1200px]:[transform:translate3d(0,0,0)]";
const HOST = `${HOST_BASE} ${HOST_RESPONSIVE}`;

const BACKDROP =
	"hidden max-[1199px]:fixed max-[1199px]:inset-0 max-[1199px]:block max-[1199px]:bg-[rgba(2,6,14,0.72)] max-[1199px]:opacity-0 max-[1199px]:pointer-events-none max-[1199px]:transition-opacity max-[1199px]:duration-[280ms] max-[1199px]:[transition-timing-function:cubic-bezier(0.22,1,0.36,1)] max-[1199px]:z-0 max-[1199px]:p-0 max-[1199px]:m-0 max-[1199px]:cursor-pointer max-[1199px]:border-0 [.site-quick-rail-host--open_&]:max-[1199px]:opacity-100 [.site-quick-rail-host--open_&]:max-[1199px]:pointer-events-auto motion-reduce:transition-none";

/* Tab — bronze (was legacy blue/ink) */
const TAB =
	"bg-transparent border-0 p-0 text-inherit cursor-pointer pointer-events-auto inline-flex items-center justify-center gap-2 max-[1199px]:fixed max-[1199px]:inset-x-0 max-[1199px]:bottom-0 max-[1199px]:z-[2] max-[1199px]:min-h-11 max-[1199px]:w-full max-[1199px]:flex-row max-[1199px]:rounded-t-[0.85rem] max-[1199px]:py-[0.55rem] max-[1199px]:px-4 max-[1199px]:[padding-bottom:calc(0.55rem+env(safe-area-inset-bottom,0px))] max-[1199px]:bg-[linear-gradient(180deg,rgba(28,22,11,0.98)_0%,rgba(8,12,22,0.99)_100%)] max-[1199px]:border max-[1199px]:border-[rgba(212,175,55,0.22)] max-[1199px]:border-b-0 max-[1199px]:shadow-[0_-12px_40px_-18px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,252,245,0.06)] max-[1199px]:text-[rgba(252,240,210,0.95)] min-[1200px]:absolute min-[1200px]:right-[-1.75rem] min-[1200px]:top-4 min-[1200px]:w-7 min-[1200px]:h-[5.25rem] min-[1200px]:flex-col min-[1200px]:gap-[0.3rem] min-[1200px]:rounded-l-none min-[1200px]:rounded-r-[0.65rem] min-[1200px]:bg-[linear-gradient(180deg,rgba(20,14,6,0.94)_0%,rgba(8,13,22,0.94)_100%)] min-[1200px]:border min-[1200px]:border-[rgba(212,175,55,0.18)] min-[1200px]:border-l-0 min-[1200px]:text-[rgba(247,244,238,0.82)]";
const TAB_CHEVRON =
	"shrink-0 leading-none max-[1199px]:text-base min-[1200px]:text-[0.88rem]";
const TAB_LABEL =
	"uppercase font-[640] max-[1199px]:[writing-mode:horizontal-tb] max-[1199px]:tracking-[0.18em] max-[1199px]:text-[0.68rem] min-[1200px]:[writing-mode:vertical-rl] min-[1200px]:tracking-[0.14em] min-[1200px]:text-[0.56rem] min-[1200px]:py-[0.35rem]";

const RAIL_DRAWER =
	"site-quick-rail pointer-events-auto max-[1199px]:fixed max-[1199px]:inset-x-0 max-[1199px]:[bottom:calc(3.85rem+env(safe-area-inset-bottom,0px))] max-[1199px]:z-[1] max-[1199px]:w-full max-[1199px]:max-w-screen max-[1199px]:max-h-[min(72dvh,28rem)] max-[1199px]:overflow-x-hidden max-[1199px]:overflow-y-auto max-[1199px]:[overscroll-behavior:contain] max-[1199px]:p-[0.75rem_1rem_0.25rem] max-[1199px]:rounded-t-2xl max-[1199px]:shadow-[0_-20px_50px_-24px_rgba(0,0,0,0.55)] max-[1199px]:[transform:translate3d(0,108%,0)] max-[1199px]:transition-transform max-[1199px]:duration-300 max-[1199px]:[transition-timing-function:cubic-bezier(0.22,1,0.36,1)] [.site-quick-rail-host--open_&]:max-[1199px]:[transform:translate3d(0,0,0)] min-[1200px]:relative min-[1200px]:w-[min(17.5rem,44vw)] min-[1200px]:max-h-none min-[1200px]:invisible min-[1200px]:[transition:visibility_0s_linear_280ms] [.site-quick-rail-host--open_&]:min-[1200px]:visible [.site-quick-rail-host--open_&]:min-[1200px]:[transition:visibility_0s_linear_0s]";

const HEAD = "flex items-center justify-between p-[0_0_0.5rem]";
const MARK = "opacity-85";
const CLOSE_BTN =
	"bg-transparent border-0 p-0 text-inherit cursor-pointer inline-flex items-center justify-center w-11 h-11 rounded-full text-[1.2rem] text-[rgba(247,244,238,0.7)] bg-white/[0.04] border border-white/[0.08]";

const INNER =
	"flex flex-col gap-[0.4rem] p-[0.75rem_0.6rem] rounded-[0.95rem] bg-[linear-gradient(165deg,rgba(28,22,12,0.55)_0%,rgba(10,12,16,0.72)_100%)] backdrop-blur-[16px] border border-[rgba(212,175,55,0.18)] shadow-[inset_0_1px_0_rgba(255,252,245,0.04),12px_28px_48px_-28px_rgba(0,0,0,0.55)] pointer-events-auto max-[1199px]:bg-[linear-gradient(175deg,rgba(20,14,6,0.97)_0%,rgba(6,10,18,0.98)_100%)] max-[1199px]:overflow-hidden";
const LEAD =
	"m-0 mb-1 px-[0.1rem] text-[0.66rem] font-medium tracking-[0.04em] leading-[1.4] text-white/70";

const RAIL_LINK =
	"flex items-start gap-2 p-[0.55rem_0.6rem] rounded-[0.75rem] no-underline text-[rgba(247,244,238,0.86)] border border-white/[0.05] bg-white/[0.02] transition-[border-color,background,color,transform,box-shadow] duration-[220ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] min-h-11 hover:border-[rgba(212,175,55,0.25)] hover:bg-white/[0.05] hover:text-[var(--text-cream)] hover:-translate-y-px hover:shadow-[0_12px_32px_-22px_rgba(0,0,0,0.45)] focus-visible:outline focus-visible:outline-[2px] focus-visible:outline-[rgba(212,175,55,0.55)] focus-visible:outline-offset-2";
const RAIL_TEXT = "flex flex-col gap-[0.08rem] leading-[1.2] min-w-0";
const RAIL_TEXT_TITLE =
	"text-[0.68rem] font-[650] tracking-[0.16em] uppercase font-[family-name:var(--font-display,'Outfit_Variable')] text-[rgba(247,244,238,0.88)]";
const RAIL_TEXT_SUB =
	"text-[0.66rem] font-[450] text-white/[0.48] tracking-[0.03em] leading-[1.35]";

/* ── Phase 5: salesforce-form-* classes migrated to inline Tailwind ── */
const SF_DRAWER_FORM = "block";
const SF_DRAWER_GRID =
	"grid grid-cols-2 max-[480px]:grid-cols-1 gap-x-4 gap-y-3 max-[480px]:gap-[0.6rem] mb-4";
const SF_DRAWER_FIELD =
	"flex flex-col gap-[0.4rem] [&>label]:text-[0.8rem] [&>label]:font-semibold [&>label]:text-[var(--text-cream)] [&>label]:uppercase [&>label]:tracking-[0.08em] [&_input]:w-full [&_textarea]:w-full [&_input]:min-w-0 [&_textarea]:min-w-0 [&_input]:px-[0.85rem] [&_textarea]:px-[0.85rem] [&_input]:py-[0.6rem] [&_textarea]:py-[0.6rem] [&_input]:rounded-[0.65rem] [&_textarea]:rounded-[0.65rem] [&_input]:border [&_textarea]:border [&_input]:border-[rgb(var(--accent-bronze-rgb)/0.32)] [&_textarea]:border-[rgb(var(--accent-bronze-rgb)/0.32)] [&_input]:bg-[rgba(8,12,18,0.78)] [&_textarea]:bg-[rgba(8,12,18,0.78)] [&_input]:text-white [&_textarea]:text-white [&_input]:[caret-color:rgb(var(--accent-bronze-rgb)/0.95)] [&_input]:text-[0.9rem] [&_textarea]:text-[0.9rem] [&_input]:font-[inherit] [&_textarea]:font-[inherit] [&_input]:transition-[border-color,box-shadow,background-color] [&_textarea]:transition-[border-color,box-shadow,background-color] [&_input]:duration-200 [&_textarea]:duration-200 [&_input:focus]:outline-none [&_textarea:focus]:outline-none [&_input:focus]:border-[rgb(var(--accent-bronze-rgb)/0.7)] [&_textarea:focus]:border-[rgb(var(--accent-bronze-rgb)/0.7)] [&_input:focus]:bg-[rgba(10,14,22,0.92)] [&_textarea:focus]:bg-[rgba(10,14,22,0.92)] [&_input:focus]:shadow-[0_0_0_3px_rgb(var(--accent-bronze-rgb)/0.18)] [&_textarea:focus]:shadow-[0_0_0_3px_rgb(var(--accent-bronze-rgb)/0.18)] [&_input::placeholder]:text-white/[0.42] [&_textarea::placeholder]:text-white/[0.42]";
const SF_DRAWER_FIELD_FULL = "col-span-full";
const SF_DRAWER_ACTIONS =
	"flex justify-start max-[600px]:justify-center mt-4 [&>button]:max-[600px]:w-full [&>button]:max-[600px]:min-h-11";

/* Inline Salesforce Web-to-Lead form for the contact drawer. */
function ContactDrawerForm({ onSuccess }: { onSuccess?: () => void }) {
	const formId = useId();
	const phoneRef = useRef<HTMLInputElement>(null);
	const descriptionRef = useRef<HTMLTextAreaElement>(null);

	const injectRegionPrefix = () => {
		const phone = phoneRef.current?.value ?? "";
		const region = regionTagFromPhone(phone);
		if (!region || !descriptionRef.current) return;
		const tag = `Region: ${region}. `;
		const cur = descriptionRef.current.value;
		if (descriptionAlreadyHasRegionPrefix(cur)) return;
		descriptionRef.current.value = tag + cur;
	};

	return (
		<form
			action="https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8&orgId=00Dao00001YO4nx"
			method="POST"
			className={SF_DRAWER_FORM}
			onSubmit={() => {
				injectRegionPrefix();
				setTimeout(() => onSuccess?.(), 100);
			}}
		>
			<input type="hidden" name="oid" value="00Dao00001YO4nx" />
			<input
				type="hidden"
				name="retURL"
				value="https://designedbyanthony.com/thank-you"
			/>

			<div className={SF_DRAWER_GRID}>
				<div className={SF_DRAWER_FIELD}>
					<label htmlFor={`${formId}-first_name`}>First Name</label>
					<input
						id={`${formId}-first_name`}
						maxLength={40}
						name="first_name"
						type="text"
						autoComplete="given-name"
						required
					/>
				</div>

				<div className={SF_DRAWER_FIELD}>
					<label htmlFor={`${formId}-email`}>Email</label>
					<input
						id={`${formId}-email`}
						maxLength={80}
						name="email"
						type="email"
						autoComplete="email"
						required
					/>
				</div>

				<div className={SF_DRAWER_FIELD}>
					<label htmlFor={`${formId}-phone`}>Phone</label>
					<input
						id={`${formId}-phone`}
						ref={phoneRef}
						maxLength={40}
						name="phone"
						type="tel"
						autoComplete="tel"
					/>
				</div>

				<div className={`${SF_DRAWER_FIELD} ${SF_DRAWER_FIELD_FULL}`}>
					<label htmlFor={`${formId}-description`}>Message</label>
					<textarea
						id={`${formId}-description`}
						ref={descriptionRef}
						name="description"
						rows={3}
						placeholder="How can we help?"
						required
					/>
				</div>
			</div>

			<div className={SF_DRAWER_ACTIONS}>
				<button type="submit" className={`${btnPrimary} ${btnSm}`}>
					Let&apos;s build something great.
				</button>
			</div>
		</form>
	);
}

/**
 * Contact drawer: desktop slides in from the left (transform-origin 0% 100%);
 * narrow viewports use a bottom sheet. High-contrast panel; CSS transitions only.
 */
export function SiteContactDrawer() {
	const panelId = "site-contact-drawer-panel";
	const tabRef = useRef<HTMLButtonElement>(null);
	const [open, setOpen] = useState(false);
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		setHydrated(true);
	}, []);

	useEffect(() => {
		if (!open || typeof document === "undefined") return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				setOpen(false);
				tabRef.current?.focus();
			}
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [open]);

	useEffect(() => {
		if (typeof document === "undefined" || !hydrated) return;
		const mq = window.matchMedia("(max-width: 1199px)");
		const sync = () => {
			if (mq.matches && open) {
				document.body.classList.add(BODY_LOCK_CLASS);
			} else {
				document.body.classList.remove(BODY_LOCK_CLASS);
			}
		};
		sync();
		mq.addEventListener("change", sync);
		return () => {
			mq.removeEventListener("change", sync);
			document.body.classList.remove(BODY_LOCK_CLASS);
		};
	}, [open, hydrated]);

	const toggle = useCallback(() => {
		setOpen((prev) => !prev);
	}, []);

	const close = useCallback(() => {
		setOpen(false);
		tabRef.current?.focus();
	}, []);

	return (
		<div
			className={`${HOST}${open ? " site-quick-rail-host--open" : ""}${hydrated ? " site-quick-rail-host--hydrated" : ""}`}
		>
			<button
				type="button"
				className={BACKDROP}
				aria-label="Close contact drawer"
				tabIndex={-1}
				aria-hidden={!open}
				onClick={close}
			/>
			<button
				ref={tabRef}
				type="button"
				className={TAB}
				aria-expanded={open}
				aria-controls={panelId}
				onClick={toggle}
			>
				<span className={TAB_CHEVRON} aria-hidden="true">
					{open ? "⟨" : "⟩"}
				</span>
				<span className={TAB_LABEL}>Contact</span>
			</button>
			<aside
				id={panelId}
				className={RAIL_DRAWER}
				role="dialog"
				aria-modal={open}
				aria-label="Contact form"
				aria-hidden={!open}
				data-nav-rail
			>
				<div className={HEAD}>
					<Image
						src={BRAND_MARK_IMAGE}
						alt=""
						width={BRAND_MARK_IMAGE.width}
						height={BRAND_MARK_IMAGE.height}
						className={MARK}
						aria-hidden
					/>
					<button
						type="button"
						className={CLOSE_BTN}
						onClick={close}
						aria-label="Close contact drawer"
					>
						×
					</button>
				</div>
				<div className={INNER}>
					<p className={LEAD}>
						Send a quick message — we reply within one business day.
					</p>
					<ContactDrawerForm onSuccess={close} />
					<div className="site-quick-rail__divider" />
					<a
						href={businessProfile.telephoneHref}
						className={`nav-rail-link nav-rail-link--phone ${RAIL_LINK}`}
						onClick={close}
					>
						<span className={RAIL_TEXT}>
							<strong className={RAIL_TEXT_TITLE}>Or call now</strong>
							<span className={RAIL_TEXT_SUB}>
								{businessProfile.telephone.replace("+1-", "")}
							</span>
						</span>
					</a>
				</div>
			</aside>
		</div>
	);
}

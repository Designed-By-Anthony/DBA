"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BRAND_MARK_IMAGE } from "@/design-system/brand";
import { businessProfile } from "@/lib/seo";

const STORAGE_KEY = "dba_contact_drawer_open";
const LEGACY_STORAGE_KEY = "dba_quick_rail_open";

function readStoredOpen(): boolean {
	try {
		const v = window.localStorage.getItem(STORAGE_KEY);
		if (v === "1" || v === "0") return v === "1";
		const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
		if (legacy === "1") {
			window.localStorage.setItem(STORAGE_KEY, "1");
			return true;
		}
		return false;
	} catch {
		return false;
	}
}

function writeStoredOpen(open: boolean): void {
	try {
		window.localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
	} catch {
		/* private mode */
	}
}

const mailtoContactHref = `mailto:${businessProfile.email}?subject=${encodeURIComponent("Website inquiry — Designed by Anthony")}`;

const BODY_LOCK_CLASS = "site-contact-drawer-open";

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
		setOpen(readStoredOpen());
		setHydrated(true);
	}, []);

	useEffect(() => {
		if (!open || typeof document === "undefined") return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				setOpen(false);
				writeStoredOpen(false);
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
		setOpen((prev) => {
			const next = !prev;
			writeStoredOpen(next);
			return next;
		});
	}, []);

	const close = useCallback(() => {
		setOpen(false);
		writeStoredOpen(false);
		tabRef.current?.focus();
	}, []);

	return (
		<div
			className={`site-quick-rail-host${open ? " site-quick-rail-host--open" : ""}${hydrated ? " site-quick-rail-host--hydrated" : ""}`}
		>
			<button
				type="button"
				className="site-quick-rail-backdrop"
				aria-label="Close contact drawer"
				tabIndex={-1}
				aria-hidden={!open}
				onClick={close}
			/>
			<button
				ref={tabRef}
				type="button"
				className="site-quick-rail-tab"
				aria-expanded={open}
				aria-controls={panelId}
				onClick={toggle}
			>
				<span className="site-quick-rail-tab__chevron" aria-hidden="true">
					{open ? "⟨" : "⟩"}
				</span>
				<span className="site-quick-rail-tab__label">Contact</span>
			</button>
			<aside
				id={panelId}
				className="site-quick-rail site-quick-rail--drawer"
				aria-label="Contact options"
				aria-hidden={!open}
				data-nav-rail
			>
				<div className="site-quick-rail__head">
					<Image
						src={BRAND_MARK_IMAGE}
						alt=""
						width={BRAND_MARK_IMAGE.width}
						height={BRAND_MARK_IMAGE.height}
						className="site-quick-rail__mark"
						aria-hidden
					/>
					<button
						type="button"
						className="site-quick-rail__close"
						onClick={close}
						aria-label="Close contact drawer"
					>
						×
					</button>
				</div>
				<div className="site-quick-rail__inner">
					<p className="site-quick-rail__lead">
						Pick whichever channel is easiest:
					</p>
					<Link
						href="/lighthouse"
						className="nav-rail-link nav-rail-link--audit"
						onClick={close}
					>
						<span className="nav-rail-text">
							<strong>Audit my site</strong>
							<span className="nav-rail-sub">Free SEO + performance scan</span>
						</span>
					</Link>
					<Link
						href="/contact"
						className="nav-rail-link nav-rail-link--contact"
						onClick={close}
					>
						<span className="nav-rail-text">
							<strong>Open contact form</strong>
							<span className="nav-rail-sub">
								Human reply, usually same day
							</span>
						</span>
					</Link>
					<a
						href={mailtoContactHref}
						className="nav-rail-link nav-rail-link--phone"
						onClick={close}
					>
						<span className="nav-rail-text">
							<strong>Email directly</strong>
							<span className="nav-rail-sub">{businessProfile.email}</span>
						</span>
					</a>
					<a
						href={businessProfile.telephoneHref}
						className="nav-rail-link nav-rail-link--phone"
						onClick={close}
					>
						<span className="nav-rail-text">
							<strong>Call now</strong>
							<span className="nav-rail-sub">
								{businessProfile.telephone.replace("+1-", "")}
							</span>
						</span>
					</a>
				</div>
			</aside>
		</div>
	);
}

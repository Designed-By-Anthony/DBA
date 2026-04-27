"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";
import { BRAND_ASSETS } from "@/design-system/brand";
import { businessProfile } from "@/lib/seo";

const STORAGE_KEY = "dba_quick_rail_open";

function readStoredOpen(): boolean {
	try {
		return window.localStorage.getItem(STORAGE_KEY) === "1";
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

/**
 * Desktop quick actions: slides in from the left; tab on the edge toggles open/closed.
 */
export function SiteQuickRailDrawer() {
	const panelId = useId();
	const [open, setOpen] = useState(false);
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		setOpen(readStoredOpen());
		setHydrated(true);
	}, []);

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
	}, []);

	return (
		<div
			className={`site-quick-rail-host${open ? " site-quick-rail-host--open" : ""}${hydrated ? " site-quick-rail-host--hydrated" : ""}`}
		>
			<button
				type="button"
				className="site-quick-rail-tab"
				aria-expanded={open}
				aria-controls={panelId}
				onClick={toggle}
			>
				<span className="site-quick-rail-tab__chevron" aria-hidden="true">
					{open ? "⟨" : "⟩"}
				</span>
				<span className="site-quick-rail-tab__label">Quick</span>
			</button>
			<aside
				id={panelId}
				className="site-quick-rail site-quick-rail--drawer"
				aria-label="Quick actions"
				aria-hidden={!open}
				data-nav-rail
			>
				<div className="site-quick-rail__head">
					<Image
						src={BRAND_ASSETS.mark}
						alt=""
						width={28}
						height={21}
						className="site-quick-rail__mark"
						aria-hidden
					/>
					<button
						type="button"
						className="site-quick-rail__close"
						onClick={close}
						aria-label="Close quick actions"
					>
						×
					</button>
				</div>
				<div className="site-quick-rail__inner">
					<Link
						href="/contact"
						className="nav-rail-link nav-rail-link--audit"
						onClick={close}
					>
						<span className="nav-rail-text">
							<strong>Request site audit</strong>
							<span className="nav-rail-sub">Manual performance review</span>
						</span>
					</Link>
					<Link
						href="/contact"
						className="nav-rail-link nav-rail-link--contact"
						onClick={close}
					>
						<span className="nav-rail-text">
							<strong>Email the studio</strong>
							<span className="nav-rail-sub">
								Human reply, usually same day
							</span>
						</span>
					</Link>
					<a
						href="https://calendly.com/anthony-designedbyanthony/web-design-consult"
						className="nav-rail-link nav-rail-link--book"
						data-calendar-link
						onClick={close}
					>
						<span className="nav-rail-text">
							<strong>Book a call</strong>
							<span className="nav-rail-sub">15 minutes · pick a time</span>
						</span>
					</a>
					<a
						href={mailtoContactHref}
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

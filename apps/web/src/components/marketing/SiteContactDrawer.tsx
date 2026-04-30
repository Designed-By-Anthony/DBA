"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { BRAND_MARK_IMAGE } from "@/design-system/brand";
import { businessProfile } from "@/lib/seo";

const STORAGE_KEY = "dba_contact_drawer_open";

function readStoredOpen(): boolean {
	try {
		const v = window.localStorage.getItem(STORAGE_KEY);
		return v === "1";
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
 * Inline Salesforce Web-to-Lead form for the contact drawer.
 */
function ContactDrawerForm({ onSuccess }: { onSuccess?: () => void }) {
	const formId = useId();

	return (
		<>
			<Script
				src="https://www.google.com/recaptcha/api.js"
				strategy="lazyOnload"
			/>
			<form
				action="https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8&orgId=00Dao00001YO4nx"
				method="POST"
				className="salesforce-contact-form salesforce-contact-form--compact"
				onSubmit={() => {
					// Close drawer after short delay to let form submit
					setTimeout(() => onSuccess?.(), 100);
				}}
			>
				<input
					type="hidden"
					name="captcha_settings"
					value='{"keyname":"DBA","fallback":"true","orgId":"00Dao00001YO4nx","ts":""}'
				/>
				<input type="hidden" name="oid" value="00Dao00001YO4nx" />
				<input
					type="hidden"
					name="retURL"
					value="https://designedbyanthony.com/thank-you"
				/>

				<div className="salesforce-form-grid salesforce-form-grid--compact">
					<div className="salesforce-form-field">
						<label htmlFor={`${formId}-first_name`}>First Name</label>
						<input
							id={`${formId}-first_name`}
							maxLength={40}
							name="first_name"
							size={20}
							type="text"
							autoComplete="given-name"
							required
						/>
					</div>

					<div className="salesforce-form-field">
						<label htmlFor={`${formId}-email`}>Email</label>
						<input
							id={`${formId}-email`}
							maxLength={80}
							name="email"
							size={20}
							type="email"
							autoComplete="email"
							required
						/>
					</div>

					<div className="salesforce-form-field">
						<label htmlFor={`${formId}-phone`}>Phone</label>
						<input
							id={`${formId}-phone`}
							maxLength={40}
							name="phone"
							size={20}
							type="tel"
							autoComplete="tel"
						/>
					</div>

					<div className="salesforce-form-field salesforce-form-field-full">
						<label htmlFor={`${formId}-description`}>Message</label>
						<textarea
							id={`${formId}-description`}
							name="description"
							rows={3}
							placeholder="How can we help?"
							required
						/>
					</div>
				</div>

				<div
					className="g-recaptcha"
					data-sitekey="6LfnB9EsAAAAAPhbLN_enDV4s07F00YiLYANq3-Y"
					data-size="compact"
				/>

				<div className="salesforce-form-actions">
					<button type="submit" className="btn btn-primary-audit btn-sm">
						Send Message
					</button>
				</div>
			</form>
		</>
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
				aria-label="Contact form"
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
						Send a quick message — we reply within one business day.
					</p>
					<ContactDrawerForm onSuccess={close} />
					<div className="site-quick-rail__divider" />
					<a
						href={businessProfile.telephoneHref}
						className="nav-rail-link nav-rail-link--phone"
						onClick={close}
					>
						<span className="nav-rail-text">
							<strong>Or call now</strong>
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

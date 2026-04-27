"use client";

import { useLayoutEffect } from "react";

const SCRIPT_ID = "freshworks-fw-cdn-web-chat";
const STORAGE_KEY = "dba_fc_external_id";
let anonymousIdCounter = 0;

function createEntropyId(prefix: string): string {
	try {
		const cryptoRef =
			typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
		if (cryptoRef?.randomUUID) {
			return `${prefix}_${cryptoRef.randomUUID()}`;
		}
		if (cryptoRef?.getRandomValues) {
			const bytes = new Uint8Array(8);
			cryptoRef.getRandomValues(bytes);
			const token = Array.from(bytes, (b) =>
				b.toString(16).padStart(2, "0"),
			).join("");
			return `${prefix}_${token}`;
		}
	} catch {
		// Ignore and use deterministic fallback below.
	}
	anonymousIdCounter += 1;
	return `${prefix}_${Date.now().toString(36)}_${anonymousIdCounter.toString(36)}`;
}

function getOrCreateAnonymousExternalId(): string {
	try {
		const existing = window.localStorage.getItem(STORAGE_KEY);
		if (existing) return existing;
		const id = createEntropyId("anon");
		window.localStorage.setItem(STORAGE_KEY, id);
		return id;
	} catch {
		return createEntropyId("anon");
	}
}

/**
 * Freshworks Web Chat: set `fcSettings.onInit` *before* the fw-cdn script loads so the vendor can
 * call the same APIs as their docs (`setExternalId`, `user.setFirstName`, `user.setEmail`,
 * `user.setProperties` with `cf_*` keys mapped from `NEXT_PUBLIC_FRESHCHAT_*`).
 *
 * Without env vars, a stable anonymous `externalId` is stored in `localStorage` for continuity.
 */
export function FreshworksChatBootstrap() {
	useLayoutEffect(() => {
		const envExternal = process.env.NEXT_PUBLIC_FRESHCHAT_EXTERNAL_ID?.trim();
		const externalId = envExternal || getOrCreateAnonymousExternalId();
		const firstName = process.env.NEXT_PUBLIC_FRESHCHAT_FIRST_NAME?.trim();
		const email = process.env.NEXT_PUBLIC_FRESHCHAT_USER_EMAIL?.trim();
		const cfPlan = process.env.NEXT_PUBLIC_FRESHCHAT_CF_PLAN?.trim();
		const cfStatus = process.env.NEXT_PUBLIC_FRESHCHAT_CF_STATUS?.trim();

		window.fcSettings = window.fcSettings ?? {};
		const previousOnInit = window.fcSettings.onInit;

		window.fcSettings.onInit = () => {
			previousOnInit?.();
			const w = window.fcWidget;
			if (!w?.user) return;
			w.setExternalId(externalId);
			if (firstName) w.user.setFirstName(firstName);
			if (email) w.user.setEmail(email);
			const props: Record<string, string> = {};
			if (cfPlan) props.cf_plan = cfPlan;
			if (cfStatus) props.cf_status = cfStatus;
			if (Object.keys(props).length > 0) {
				w.user.setProperties(props);
			}
		};

		if (document.getElementById(SCRIPT_ID)) return;

		const s = document.createElement("script");
		s.id = SCRIPT_ID;
		s.async = true;
		s.src = "//fw-cdn.com/16171925/7111349.js";
		s.setAttribute("chat", "true");
		(document.head ?? document.documentElement).appendChild(s);
	}, []);

	return null;
}

"use client";

import { useLayoutEffect } from "react";

const SCRIPT_ID = "freshworks-fw-cdn-web-chat";
const STORAGE_KEY = "dba_fc_external_id";

function getOrCreateAnonymousExternalId(): string {
	try {
		const existing = window.localStorage.getItem(STORAGE_KEY);
		if (existing) return existing;
		const id =
			typeof crypto !== "undefined" && "randomUUID" in crypto
				? `anon_${crypto.randomUUID()}`
				: `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
		window.localStorage.setItem(STORAGE_KEY, id);
		return id;
	} catch {
		return `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
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

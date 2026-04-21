/**
 * Spam + abuse guards for public lead intake (`POST /api/lead`).
 *
 * The public lead endpoint sits in front of Resend — every accepted
 * submission fires an "New Lead" email to the CRM admin inbox. Without
 * these guards any bot script hitting the endpoint with a filled
 * honeypot-exempt payload produces inbox noise.
 *
 * This module is intentionally dependency-free so it can be unit-tested
 * without pulling in the DB / Resend stack.
 *
 * Defenses:
 *   - `validatePublicLead()`         — format + payload sanity checks.
 *   - `isLikelyBotSubmission()`      — content heuristics (message URLs,
 *                                     cyrillic name blobs, duplicate
 *                                     name/email, obvious link-bombs).
 *   - `checkLeadRateLimit()`         — in-memory per-IP sliding window.
 *   - `requireTurnstileInProd()`     — returns true when the current
 *                                     deployment MUST have
 *                                     `TURNSTILE_SECRET_KEY`. Prevents a
 *                                     silent bypass when the env var
 *                                     drops off the Vercel project.
 *
 * All functions are pure / side-effect-free except the rate limiter,
 * which keeps a bounded in-memory map keyed by IP.
 */

/** RFC-5322-lite: good enough for CRM rejection. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/** Known throwaway / disposable domains that produce nothing but spam. */
const DISPOSABLE_DOMAINS = new Set<string>([
	"mailinator.com",
	"guerrillamail.com",
	"10minutemail.com",
	"tempmail.com",
	"temp-mail.org",
	"trashmail.com",
	"yopmail.com",
	"sharklasers.com",
	"dispostable.com",
	"throwawaymail.com",
	"mvrht.com",
	"getnada.com",
	"mintemail.com",
	"fakeinbox.com",
]);

const URL_IN_TEXT_RE = /\bhttps?:\/\/|\bwww\.[a-z0-9-]+\.[a-z]{2,}/i;
/** Cheap "Russian-only spam" heuristic — blocks names that are purely Cyrillic. */
const CYRILLIC_ONLY_RE = /^[\s\p{Script=Cyrillic}]+$/u;

export type PublicLeadPayload = {
	name: string;
	email: string;
	phone?: string;
	company?: string;
	website?: string;
	message?: string;
};

export type ValidationIssue = { field?: string; message: string };

/**
 * Fail-fast shape + format checks. These produce user-facing 400 errors
 * so legitimate browsers can correct the input.
 */
export function validatePublicLead(
	payload: PublicLeadPayload,
): ValidationIssue | null {
	const name = (payload.name ?? "").trim();
	const email = (payload.email ?? "").trim().toLowerCase();

	if (!name) return { field: "name", message: "Name is required." };
	if (!email) return { field: "email", message: "Email is required." };
	if (name.length > 200) return { field: "name", message: "Name is too long." };
	if (email.length > 254)
		return { field: "email", message: "Email is too long." };
	if (!EMAIL_RE.test(email)) {
		return {
			field: "email",
			message: "That email address doesn't look valid.",
		};
	}

	const domain = email.split("@")[1] ?? "";
	if (DISPOSABLE_DOMAINS.has(domain)) {
		return { field: "email", message: "Please use a real email address." };
	}
	return null;
}

/**
 * Silent spam heuristics — these match submissions we treat as "accept
 * at the HTTP layer but never fire an email for". Returning true should
 * short-circuit the intake pipeline before `executeLeadIntake` runs.
 */
export function isLikelyBotSubmission(payload: PublicLeadPayload): boolean {
	const name = (payload.name ?? "").trim();
	const email = (payload.email ?? "").trim().toLowerCase();
	const message = (payload.message ?? "").trim();
	const website = (payload.website ?? "").trim();

	if (!name || !email) return true;

	if (CYRILLIC_ONLY_RE.test(name)) return true;
	if (URL_IN_TEXT_RE.test(name)) return true;

	if (name.toLowerCase() === email) return true;

	if (message) {
		const urlMatches = message.match(/\bhttps?:\/\//gi) ?? [];
		if (urlMatches.length >= 2) return true;
		if (/\[url=|\bvia\s+https?:\/\//i.test(message)) return true;
	}

	if (website && /[\s"'<>]/.test(website)) return true;

	return false;
}

type SlidingWindowBucket = { timestamps: number[] };

type RateLimitStore = Map<string, SlidingWindowBucket>;

type RateLimitGlobal = { store: RateLimitStore };

const RATE_LIMIT_KEY = "__DBA_LEAD_RATE_LIMIT__" as const;
const g = globalThis as unknown as Record<
	typeof RATE_LIMIT_KEY,
	RateLimitGlobal | undefined
>;

function getRateLimitStore(): RateLimitStore {
	if (!g[RATE_LIMIT_KEY]) {
		g[RATE_LIMIT_KEY] = { store: new Map() };
	}
	return g[RATE_LIMIT_KEY]!.store;
}

export type RateLimitResult = {
	allowed: boolean;
	remaining: number;
	retryAfterSeconds: number;
};

export type RateLimitOptions = {
	/** Max submissions per window. */
	limit: number;
	/** Window length in milliseconds. */
	windowMs: number;
	/** Overrides `Date.now()` — for tests. */
	now?: () => number;
};

/**
 * In-memory sliding-window rate limiter keyed by client identifier
 * (typically the first IP in `x-forwarded-for`). Suitable for Vercel's
 * regional Edge/serverless functions where per-instance state is enough
 * to blunt opportunistic bot storms; upgrade to Redis when traffic
 * justifies it.
 */
export function checkLeadRateLimit(
	clientId: string,
	opts: RateLimitOptions = { limit: 3, windowMs: 60_000 },
): RateLimitResult {
	const id = clientId.trim();
	if (!id)
		return { allowed: true, remaining: opts.limit, retryAfterSeconds: 0 };

	const now = opts.now ? opts.now() : Date.now();
	const store = getRateLimitStore();
	const bucket = store.get(id) ?? { timestamps: [] };
	const cutoff = now - opts.windowMs;
	const fresh = bucket.timestamps.filter((ts) => ts > cutoff);

	if (fresh.length >= opts.limit) {
		const oldest = fresh[0];
		const retryMs = Math.max(0, oldest + opts.windowMs - now);
		store.set(id, { timestamps: fresh });
		return {
			allowed: false,
			remaining: 0,
			retryAfterSeconds: Math.ceil(retryMs / 1000),
		};
	}

	fresh.push(now);
	store.set(id, { timestamps: fresh });

	if (store.size > 5000) {
		for (const [key, value] of store) {
			if (value.timestamps.every((ts) => ts <= cutoff)) store.delete(key);
			if (store.size <= 5000) break;
		}
	}

	return {
		allowed: true,
		remaining: opts.limit - fresh.length,
		retryAfterSeconds: 0,
	};
}

export function resetLeadRateLimitForTests(): void {
	getRateLimitStore().clear();
}

/**
 * Returns true when the current deployment MUST have
 * `TURNSTILE_SECRET_KEY`. When this returns true but the secret is
 * absent, `/api/lead` should respond 503 instead of accepting the
 * submission. Fail-closed is the right default because Turnstile is the
 * only per-request bot defense Agency OS has outside of the honeypot.
 */
export function requireTurnstileInProd(
	env: NodeJS.ProcessEnv = process.env,
): boolean {
	if (env.PUBLIC_LEAD_DISABLE_TURNSTILE === "true") return false;
	if (env.VERCEL_ENV === "production") return true;
	if (env.NODE_ENV === "production" && env.VERCEL === "1") return true;
	return false;
}

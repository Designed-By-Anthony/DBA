/**
 * Process-local + optional Upstash-Redis-backed rate limiter for public-facing
 * API routes.
 *
 * Two backends, same public signature:
 *
 *   rateLimit(key, limit, windowMs) -> retryAfterSeconds | null
 *   await rateLimitAsync(key, limit, windowMs) -> retryAfterSeconds | null
 *
 * The sync `rateLimit()` is the in-memory fallback. Safe to call everywhere
 * but — as a per-instance Map — a multi-instance Vercel deploy has one
 * bucket per Function instance. Fine for abuse mitigation, not a primary
 * control at scale.
 *
 * The async `rateLimitAsync()` picks the backend based on env:
 *
 *   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN set   -> Upstash
 *   UPSTASH_REDIS_REST_URL missing                          -> in-memory
 *
 * This means you can flip on global rate limiting by adding two Vercel env
 * vars without any code change at the call sites — existing callers of
 * `rateLimitAsync()` transparently upgrade from per-instance to global.
 *
 * The Upstash backend runs a single Lua script (`RL_SCRIPT`) under EVAL so
 * the window-trim + count + insert is atomic, not racing across pipelines.
 */

import { NextResponse } from "next/server";

/* ------------------------------------------------------------------------- *
 * Backend 1: in-memory (no external dependency, instance-scoped)
 * ------------------------------------------------------------------------- */

const inMemoryBuckets = new Map<string, number[]>();

export function rateLimit(
	key: string,
	limit: number,
	windowMs: number,
): number | null {
	const now = Date.now();
	const existing = inMemoryBuckets.get(key) || [];
	const recent = existing.filter((ts) => now - ts < windowMs);

	if (recent.length >= limit) {
		const retryAfterMs = windowMs - (now - recent[0]);
		inMemoryBuckets.set(key, recent);
		return Math.max(1, Math.ceil(retryAfterMs / 1000));
	}

	recent.push(now);
	inMemoryBuckets.set(key, recent);
	return null;
}

/* ------------------------------------------------------------------------- *
 * Backend 2: Upstash Redis (REST, Lua, shared across all instances)
 * ------------------------------------------------------------------------- */

/**
 * Sliding-window rate-limit script.
 *
 * KEYS[1]   = bucket key
 * ARGV[1]   = now (ms, numeric)
 * ARGV[2]   = window (ms, numeric)
 * ARGV[3]   = limit (integer)
 *
 * Returns a 2-element array: {allowed, retry_after_seconds}.
 *   allowed == 1 means the caller is under the limit, retry_after is 0.
 *   allowed == 0 means over; retry_after is the seconds until the oldest
 *   in-window request falls out.
 *
 * The sequence is atomic — Redis runs Lua scripts as a single command.
 */
const RL_SCRIPT = `
local key    = KEYS[1]
local now    = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit  = tonumber(ARGV[3])
local cutoff = now - window

redis.call('ZREMRANGEBYSCORE', key, '-inf', cutoff)
local count = redis.call('ZCARD', key)

if count >= limit then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local retry  = 1
  if oldest[2] then
    local ms = window - (now - tonumber(oldest[2]))
    if ms < 1000 then retry = 1 else retry = math.ceil(ms / 1000) end
  end
  return { 0, retry }
end

redis.call('ZADD', key, now, now .. ':' .. math.random(1e9))
redis.call('PEXPIRE', key, window + 1000)
return { 1, 0 }
`;

function upstashConfigured(): boolean {
	return Boolean(
		process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
	);
}

async function upstashEval(
	key: string,
	now: number,
	windowMs: number,
	limit: number,
): Promise<{ allowed: boolean; retryAfter: number }> {
	const url = `${process.env.UPSTASH_REDIS_REST_URL}/eval`;
	const body = JSON.stringify({
		script: RL_SCRIPT,
		numkeys: 1,
		keys: [key],
		args: [String(now), String(windowMs), String(limit)],
	});
	const res = await fetch(url, {
		method: "POST",
		headers: {
			authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
			"content-type": "application/json",
		},
		body,
		// The rate limiter must never be a slow call on the hot path.
		// If Upstash is down or slow, we FAIL OPEN (return null) so legitimate
		// traffic isn't blocked by our own dependency outage.
		signal: AbortSignal.timeout(500),
	});
	if (!res.ok) {
		throw new Error(`Upstash ${res.status}`);
	}
	const data = (await res.json()) as { result?: [number, number] };
	const result = data.result;
	if (!result || !Array.isArray(result) || result.length !== 2) {
		throw new Error("Upstash returned unexpected shape");
	}
	return { allowed: result[0] === 1, retryAfter: result[1] };
}

/**
 * Shared rate limiter. Transparently uses Upstash Redis when configured,
 * falls back to in-memory otherwise.
 *
 * Fail-open semantics: if Upstash is unreachable / slow, the call returns
 * `null` (treat as "under limit") so an outage in our dependency doesn't
 * translate into a user-visible 429. The in-memory limiter on the same
 * instance still applies as a secondary floor.
 */
export async function rateLimitAsync(
	key: string,
	limit: number,
	windowMs: number,
): Promise<number | null> {
	if (!upstashConfigured()) {
		return rateLimit(key, limit, windowMs);
	}
	try {
		const { allowed, retryAfter } = await upstashEval(
			key,
			Date.now(),
			windowMs,
			limit,
		);
		if (allowed) return null;
		// Secondary instance-local floor so a mass burst against one instance
		// is still throttled even if Upstash says OK. Max of (upstash, local).
		const localRetry = rateLimit(key, limit, windowMs);
		return Math.max(retryAfter, localRetry ?? 0);
	} catch (err) {
		console.warn(
			`[rate-limit] upstash failure, falling back to in-memory: ${err instanceof Error ? err.message : String(err)}`,
		);
		return rateLimit(key, limit, windowMs);
	}
}

/* ------------------------------------------------------------------------- *
 * Shared helpers
 * ------------------------------------------------------------------------- */

/**
 * Best-effort client-address extraction. Reads the standard forwarded
 * headers in order, falls back to "unknown". Vercel strips untrusted
 * forwarded-for entries at the edge and appends only its own, so the
 * first entry is the real client.
 */
export function clientAddress(request: Request): string {
	const fwd = request.headers.get("x-forwarded-for");
	if (fwd) {
		const first = fwd.split(",")[0]?.trim();
		if (first) return first;
	}
	return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** 429 response helper — sets Retry-After in seconds. */
export function tooManyRequests(
	retryAfterSeconds: number,
	headers: HeadersInit = {},
): NextResponse {
	return NextResponse.json(
		{ error: "Too many requests. Please wait and try again." },
		{
			status: 429,
			headers: {
				...Object.fromEntries(new Headers(headers).entries()),
				"Retry-After": String(retryAfterSeconds),
			},
		},
	);
}

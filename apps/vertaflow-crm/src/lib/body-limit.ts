import type { NextRequest } from "next/server";

/**
 * Read a request body as text with a hard byte-length limit.
 *
 * Next.js route handlers do not enforce a body-size limit by default on
 * `request.text()` / `request.json()`. A caller posting a gigabyte of JSON
 * can force the runtime to allocate memory parsing it before any
 * application code runs, which is both a DoS vector and a cost vector
 * (Vercel function execution time).
 *
 * This helper streams the body with a running byte counter and rejects
 * early once the limit is exceeded. The returned discriminated union lets
 * each route turn a 413 into whatever response envelope it uses.
 *
 * Content-Length (when the client sends it honestly) is checked first
 * as a fast-reject; body streaming handles the rest.
 *
 * @param limitBytes The maximum allowed body size. Choose per-route — JSON
 *                   posts from a form are typically <4 KB, a webhook a few
 *                   hundred KB at most.
 */
export async function readBoundedText(
	request: Request | NextRequest,
	limitBytes: number,
): Promise<
	| { ok: true; text: string }
	| { ok: false; reason: "too_large" | "stream_error" }
> {
	// Fast path: honor Content-Length when present and already oversized.
	const lenHeader = request.headers.get("content-length");
	if (lenHeader) {
		const len = Number(lenHeader);
		if (Number.isFinite(len) && len > limitBytes) {
			return { ok: false, reason: "too_large" };
		}
	}

	if (!request.body) {
		// No body — counted as empty, still "ok".
		return { ok: true, text: "" };
	}

	try {
		const reader = request.body.getReader();
		const decoder = new TextDecoder();
		const chunks: string[] = [];
		let received = 0;
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			if (value) {
				received += value.byteLength;
				if (received > limitBytes) {
					try {
						await reader.cancel();
					} catch {
						// ignore
					}
					return { ok: false, reason: "too_large" };
				}
				chunks.push(decoder.decode(value, { stream: true }));
			}
		}
		chunks.push(decoder.decode());
		return { ok: true, text: chunks.join("") };
	} catch {
		return { ok: false, reason: "stream_error" };
	}
}

/** Parse a bounded JSON body. Returns the typed value or an error reason. */
export async function readBoundedJson<T>(
	request: Request | NextRequest,
	limitBytes: number,
): Promise<
	| { ok: true; value: T }
	| { ok: false; reason: "too_large" | "stream_error" | "invalid_json" }
> {
	const r = await readBoundedText(request, limitBytes);
	if (!r.ok) return r;
	try {
		return { ok: true, value: JSON.parse(r.text) as T };
	} catch {
		return { ok: false, reason: "invalid_json" };
	}
}

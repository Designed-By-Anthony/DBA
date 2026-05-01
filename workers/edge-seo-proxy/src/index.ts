/**
 * Optional outer-edge Worker — place **in front of** Cloudflare Pages when you need
 * canonical Link headers without modifying the OpenNext bundle.
 *
 * Route `example.com/*` → this Worker → Pages origin. Set `ORIGIN_URL` to your Pages URL.
 */

export interface Env {
	ORIGIN_URL: string;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const originBase = env.ORIGIN_URL.replace(/\/$/, "");
		const url = new URL(request.url);
		const target = `${originBase}${url.pathname}${url.search}`;

		const upstream = await fetch(target, request);

		const canonical = `https://designedbyanthony.com${url.pathname}${url.search}`;
		const headers = new Headers(upstream.headers);
		const existingLink = headers.get("Link") ?? "";
		const canonSegment = `<${canonical}>; rel="canonical"`;
		headers.set(
			"Link",
			existingLink ? `${existingLink}, ${canonSegment}` : canonSegment,
		);

		return new Response(upstream.body, {
			status: upstream.status,
			statusText: upstream.statusText,
			headers,
		});
	},
};

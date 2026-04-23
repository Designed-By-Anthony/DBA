/**
 * Custom 404 page.
 *
 * `dynamic = "force-dynamic"` prevents Next.js from statically prerendering
 * this route at build time.  Without it the build server tries to render the
 * full layout tree (including `PwaRoot` / `SerwistProvider`) in a Node.js
 * context where `window` is not defined, producing:
 *
 *   ReferenceError: window is not defined
 *   Export encountered an error on /_not-found/page
 *
 * Force-dynamic defers rendering to request time (identical to every other
 * authenticated route in this app) so the browser environment is always
 * available when the component tree is executed.
 */
export const dynamic = "force-dynamic";

export default function NotFound() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-0)]">
			<div className="text-center space-y-4">
				<h1 className="text-6xl font-bold text-[var(--color-text-white)]">
					404
				</h1>
				<p className="text-[var(--color-text-muted)] text-lg">
					Page not found
				</p>
				<a
					href="/admin"
					className="inline-block mt-4 px-6 py-2 rounded-lg bg-[var(--color-brand)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
				>
					Back to dashboard
				</a>
			</div>
		</div>
	);
}

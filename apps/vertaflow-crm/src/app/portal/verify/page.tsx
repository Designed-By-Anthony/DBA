"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

export const dynamic = "force-static";

function VerifyContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const token = searchParams.get("token");
	const [status, setStatus] = useState<"verifying" | "success" | "error">(
		"verifying",
	);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!token) {
			queueMicrotask(() => {
				setStatus("error");
				setError("No token provided");
			});
			return;
		}

		const verify = async () => {
			try {
				const res = await fetch("/api/portal/verify", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ token }),
				});

				if (res.ok) {
					setStatus("success");
					// Redirect to portal dashboard after brief success msg
					setTimeout(() => {
						router.push("/portal/dashboard");
					}, 1500);
				} else {
					const data = await res.json();
					setStatus("error");
					setError(data.error || "Invalid or expired link");
				}
			} catch {
				setStatus("error");
				setError("Network error. Please try again.");
			}
		};

		verify();
	}, [token, router]);

	return (
		<div className="flex items-center justify-center min-h-[60vh]">
			<div className="rounded-xl border border-glass-border bg-glass-bg p-8 backdrop-blur-sm max-w-md w-full text-center">
				{status === "verifying" && (
					<>
						<div className="text-4xl mb-4 animate-pulse">🔐</div>
						<h2 className="text-lg font-bold text-white mb-2">Verifying...</h2>
						<p className="text-sm text-text-muted">
							Authenticating your login link
						</p>
					</>
				)}

				{status === "success" && (
					<>
						<div className="text-4xl mb-4">✅</div>
						<h2 className="text-lg font-bold text-white mb-2">Verified!</h2>
						<p className="text-sm text-text-muted">
							Redirecting to your dashboard...
						</p>
					</>
				)}

				{status === "error" && (
					<>
						<div className="text-4xl mb-4">❌</div>
						<h2 className="text-lg font-bold text-white mb-2">Link Expired</h2>
						<p className="text-sm text-text-muted mb-4">{error}</p>
						<a
							href="/portal"
							className="inline-block px-6 py-2.5 rounded-lg bg-(--color-brand) text-white text-sm font-medium hover:bg-brand-hover transition-colors"
						>
							Request New Link
						</a>
					</>
				)}
			</div>
		</div>
	);
}

export default function PortalVerifyPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center min-h-[60vh]">
					<div className="text-4xl animate-pulse">🔐</div>
				</div>
			}
		>
			<VerifyContent />
		</Suspense>
	);
}

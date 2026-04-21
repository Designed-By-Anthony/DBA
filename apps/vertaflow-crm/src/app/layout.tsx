import "@dba/env/web-viewer-aliases";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/outfit";
import "./globals.css";
import { Toaster } from "sonner";
import { clerkProxyUrlForProvider } from "@/lib/clerk-fapi-proxy";
import dynamic from "next/dynamic";

const PwaRoot = dynamic(
	() => import("@/components/PwaRoot").then((mod) => mod.PwaRoot),
	{ ssr: false }
);

const VercelObservability = dynamic(
	() => import("@/components/VercelObservability").then((mod) => mod.VercelObservability),
	{ ssr: false }
);

/** PWA / mobile browser chrome — VertaFlow shell */
export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: dark)", color: "#0f1218" },
		{ media: "(prefers-color-scheme: light)", color: "#10b981" },
	],
	colorScheme: "dark",
};

export const metadata: Metadata = {
	title: "VertaFlow | Adaptive CRM for Real Operators",
	description:
		"VertaFlow is the adaptive CRM that matches your vertical, explains the product clearly, and takes teams straight into the live workspace.",
	icons: {
		icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
		shortcut: "/favicon.svg",
	},
	appleWebApp: {
		capable: true,
		statusBarStyle: "black-translucent",
		title: "VertaFlow",
	},
	other: {
		"mobile-web-app-capable": "yes",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body>
				<div className="relative z-1 min-h-dvh">
					<PwaRoot>
						<ClerkProvider
							proxyUrl={clerkProxyUrlForProvider()}
							signInUrl="/sign-in"
							signInFallbackRedirectUrl="/admin"
						>
							{children}
							<Toaster
								theme="dark"
								position="bottom-right"
								toastOptions={{
									style: {
										background: "var(--color-surface-2)",
										border: "1px solid var(--color-glass-border)",
										color: "var(--color-text-white)",
										fontFamily: "var(--font-main)",
										fontSize: "13px",
									},
								}}
								closeButton
							/>
						</ClerkProvider>
					</PwaRoot>
				</div>
				<VercelObservability />
			</body>
		</html>
	);
}
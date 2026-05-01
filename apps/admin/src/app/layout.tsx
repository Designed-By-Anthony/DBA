import "./globals.css";
import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import type { ReactNode } from "react";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	display: "swap",
});

const fraunces = Fraunces({
	variable: "--font-fraunces",
	subsets: ["latin"],
	axes: ["opsz", "SOFT", "WONK"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "Ledger",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html
			lang="en"
			className={`${inter.variable} ${fraunces.variable} bg-black text-white`}
		>
			<body className="min-h-screen antialiased">{children}</body>
		</html>
	);
}

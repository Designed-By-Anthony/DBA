import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@fontsource-variable/inter";
import "@fontsource-variable/outfit";
import "./globals.css";
import { Toaster } from "sonner";
import { PwaRoot } from "@/components/PwaRoot";

/** PWA / mobile browser chrome — dark shell + marketing primary blue (designedbyanthony.com) */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f1218" },
    { media: "(prefers-color-scheme: light)", color: "#2563eb" },
  ],
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "Agency OS | Designed by Anthony",
  description: "Client portal and project management for Designed by Anthony clients.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DBA Portal",
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
            <ClerkProvider>
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

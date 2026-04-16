import type { Metadata } from "next";
import Image from "next/image";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import PortalNav from "@/components/portal/PortalNav";

export const metadata: Metadata = {
  title: "Client Portal | Designed by Anthony",
  description: "Manage your project, view milestones, and communicate with your development team.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DBA Portal",
  },
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-(--color-surface-0) flex flex-col">
      {/* Portal header */}
      <header className="border-b border-glass-border bg-surface-1/80 sticky top-0 z-30 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/dba-mark.webp"
              alt=""
              width={36}
              height={27}
              className="h-7 w-auto object-contain shrink-0"
              priority
            />
            <div>
              <p className="text-sm font-semibold text-white">Client Portal</p>
              <p className="text-[10px] text-text-muted">Designed by Anthony</p>
            </div>
          </div>

          {/* Portal nav tabs */}
          <PortalNav />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 flex-1 page-enter">{children}</main>

      {/* Footer */}
      <footer className="border-t border-glass-border py-6">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <p className="text-[11px] text-text-muted">
            © {new Date().getFullYear()} Designed by Anthony · All rights reserved
          </p>
          <a
            href="https://designedbyanthony.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-text-muted hover:text-white transition-colors"
          >
            designedbyanthony.com
          </a>
        </div>
      </footer>

      {/* PWA install prompt — shows once on mobile */}
      <PwaInstallPrompt />
    </div>
  );
}

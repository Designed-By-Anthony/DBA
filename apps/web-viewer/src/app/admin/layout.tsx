import "@dba/env/web-viewer-aliases";
import { auth } from "@clerk/nextjs/server";
import AdminLogin from "./AdminLogin";
import DashboardShell from "@/components/layout/DashboardShell";
import { CommandPalette } from "@/components/ui/CommandPalette";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import VerticalExperience from "@/components/vertical/VerticalExperience";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // DEV/TEST BYPASS: Skip auth on localhost in development/test mode
  const isDev = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

  if (!isDev) {
    const { userId, orgId } = await auth();

    if (!userId) {
      return <AdminLogin />;
    }

    /* We need to use headers() to get the path, but since this is a layout, 
       we can't easily get the pathname to prevent loops without middleware. 
       Let's just conditionally render the shell. If no org, we MUST be onboarding.
       We will build a dedicated onboarding Client Component to handle it. */
    if (!orgId) {
      return (
        <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
          <OnboardingWizard />
        </div>
      );
    }
  }

  return (
    <DashboardShell>
      <VerticalExperience>{children}</VerticalExperience>
      <CommandPalette />
    </DashboardShell>
  );
}

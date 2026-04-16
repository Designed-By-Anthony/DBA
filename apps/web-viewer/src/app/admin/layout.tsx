import { auth } from "@clerk/nextjs/server";
import { isAdminAuthDevBypassEnabled } from "@/lib/admin-dev-auth";
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
  if (!isAdminAuthDevBypassEnabled()) {
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

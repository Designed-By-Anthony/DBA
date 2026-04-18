import { redirect } from "next/navigation";

export default function AdminLogin() {
  // Redirect directly to Clerk's hosted sign-in page.
  // After sign-in Clerk will return the user to /admin via the
  // NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL env var.
  redirect("/sign-in");
}

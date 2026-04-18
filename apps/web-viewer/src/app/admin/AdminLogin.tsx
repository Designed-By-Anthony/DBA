import { AgencySignIn } from "@/components/auth/AgencySignIn";

/** Renders sign-in on the same host as `/admin` — no `redirect()` to `/sign-in`. */
export default function AdminLogin() {
  return <AgencySignIn />;
}

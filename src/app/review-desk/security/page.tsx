import Link from "next/link";
import { adminAssurance, requireAdminAccount } from "@/lib/admin-2fa";
import { createClient } from "@/lib/supabase/server";
import { MfaSetup } from "../_components/mfa-setup";
import { MfaShell } from "../_components/mfa-shell";

// Where an admin sets up (or removes) two-step verification. Always reachable
// by admins, so they can set it up before the team switches the rule on.

export const dynamic = "force-dynamic";

export default async function AdminSecurityPage() {
  const supabase = await createClient();
  await requireAdminAccount(supabase);
  const { level } = await adminAssurance(supabase);
  const enforced = process.env.ADMIN_2FA === "on";

  return (
    <MfaShell
      title="Two-step verification"
      intro="Protect the team page with a 6-digit code from an authenticator app, in addition to your password."
    >
      <MfaSetup currentLevel={level} enforced={enforced} />
      <Link href="/review-desk" className="text-sm font-semibold underline underline-offset-4">
        ← Back to the team page
      </Link>
    </MfaShell>
  );
}

import { adminAssurance, requireAdminAccount } from "@/lib/admin-2fa";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MfaChallenge } from "../_components/mfa-challenge";
import { MfaShell } from "../_components/mfa-shell";

// The step after the password: the admin enters the code from their
// authenticator app. Someone who is not an admin sees Not found.

export const dynamic = "force-dynamic";

export default async function AdminVerifyPage() {
  const supabase = await createClient();
  await requireAdminAccount(supabase);

  const { level, hasFactor } = await adminAssurance(supabase);
  if (level === "aal2") redirect("/review-desk");
  if (!hasFactor) redirect("/review-desk/security");

  return (
    <MfaShell title="Enter your code" intro="Open your authenticator app and type the 6-digit code for BahayFind.">
      <MfaChallenge />
    </MfaShell>
  );
}

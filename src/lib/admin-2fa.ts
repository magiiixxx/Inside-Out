import type { SupabaseClient } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";

// Two-step verification for the team (admin) accounts: after the password, an
// admin enters a 6-digit code from an authenticator app on their phone.
//
// There are three layers, switched on one at a time so nobody gets locked out:
//   1. The Set up page and the Verify page (always available to admins).
//   2. This page gate, which only works when the team sets ADMIN_2FA to "on"
//      in Vercel. Until then admins use the team page as before.
//   3. The database rule in supabase/sql/020-admin-two-step.sql, which is the
//      real lock: without a code, even a stolen admin password cannot read or
//      change anything admin-only, whatever page or tool is used.

// Is this person a logged-in admin? A visitor who is not logged in is sent to the
// team sign-in page. Anyone who IS logged in but is not an admin (a student or an
// owner) gets the Not found page, so the team pages look like they do not exist
// to them.
export async function requireAdminAccount(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (!me || me.role !== "admin") notFound();

  return { user, name: me.full_name as string };
}

// Where an admin stands: "aal1" means password only, "aal2" means password and
// a code. hasFactor says whether they have set up an authenticator app.
export async function adminAssurance(supabase: SupabaseClient) {
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return {
    level: data?.currentLevel ?? "aal1",
    hasFactor: data?.nextLevel === "aal2" || data?.currentLevel === "aal2",
  };
}

// The gate for the team page. When the switch is off it does nothing. When it is
// on, an admin without a code is sent to enter one (if they have set up an app)
// or to set one up (if they have not). Failing to check counts as "no code".
export async function requireAdminSecondStep(supabase: SupabaseClient) {
  if (process.env.ADMIN_2FA !== "on") return;

  const { level, hasFactor } = await adminAssurance(supabase);
  if (level === "aal2") return;
  redirect(hasFactor ? "/admin/verify" : "/admin/security");
}

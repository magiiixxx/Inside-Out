import type { SupabaseClient } from "@supabase/supabase-js";

// Who is logged in, and what are they? One place for every page that needs
// to know, so the answer is always worked out the same way.
//
// getUser() asks Supabase to verify the session, so it cannot be faked
// with a fake cookie. The role comes from OUR profiles table; Row Level
// Security lets each person read only their own row.

export type Role = "student" | "owner" | "admin";

export async function getUserAndRole(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, role: null, fullName: "", plan: "free" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, plan")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user,
    role: (profile?.role ?? null) as Role | null,
    fullName: (profile?.full_name ?? "") as string,
    plan: (profile?.plan ?? "free") as string,
  };
}

// Where each kind of account lands after logging in.
export function homeFor(role: Role | null): string {
  return role === "student" ? "/saved" : "/owner";
}

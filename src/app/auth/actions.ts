"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Server actions: these functions run ONLY on the server, even though a
// form in the browser calls them. That is why passwords are safe here.
//
// On a problem we redirect back with a short CODE, never raw text: the
// page looks the code up in src/lib/messages.ts.
//
// Note: redirect() works by throwing a special signal, so it must never be
// inside a try/catch.

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function back(path: string, code: string): never {
  redirect(`${path}?error=${code}`);
}

export async function signup(formData: FormData) {
  const fullName = field(formData, "full_name");
  const email = field(formData, "email");
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email) back("/signup", "missing_signup");
  if (password.length < 6) back("/signup", "weak_password");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    if (error.code === "user_already_exists") back("/signup", "email_taken");
    if (error.code === "weak_password") back("/signup", "weak_password");
    if (error.code?.startsWith("over_")) back("/signup", "too_many_attempts");
    back("/signup", "signup_failed");
  }

  // If "Confirm email" is still ON in Supabase, there is no session yet.
  if (!data.session) redirect("/login?notice=confirm_email");

  redirect("/owner");
}

export async function login(formData: FormData) {
  const email = field(formData, "email");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) back("/login", "missing_login");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    back("/login", error.code?.startsWith("over_") ? "too_many_attempts" : "invalid_credentials");
  }

  redirect("/owner");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

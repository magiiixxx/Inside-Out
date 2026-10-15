"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Server actions: these functions run ONLY on the server, even though a
// form in the browser calls them. That is why passwords are safe here.
//
// Note: redirect() works by throwing a special signal, so it must never be
// inside a try/catch.

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function back(path: string, error: string): never {
  redirect(`${path}?error=${encodeURIComponent(error)}`);
}

export async function signup(formData: FormData) {
  const fullName = field(formData, "full_name");
  const email = field(formData, "email");
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email) back("/signup", "Please fill in your name and email.");
  if (password.length < 6) {
    back("/signup", "Your password needs at least 6 characters.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) back("/signup", error.message);

  // If "Confirm email" is still ON in Supabase, there is no session yet.
  if (!data.session) {
    back("/login", "Account created. Check your email to confirm it, then log in.");
  }

  redirect("/owner");
}

export async function login(formData: FormData) {
  const email = field(formData, "email");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) back("/login", "Please enter your email and password.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) back("/login", error.message);

  redirect("/owner");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

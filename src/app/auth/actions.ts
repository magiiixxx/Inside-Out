"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUserAndRole, homeFor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formText as field } from "@/lib/validation";

// Server actions: these functions run ONLY on the server, even though a
// form in the browser calls them. That is why passwords are safe here.
//
// On a problem we redirect back with a short CODE, never raw text: the
// page looks the code up in src/lib/messages.ts.
//
// Note: redirect() works by throwing a special signal, so it must never be
// inside a try/catch.

function back(path: string, code: string): never {
  redirect(`${path}?error=${code}`);
}

export async function signup(formData: FormData) {
  const fullName = field(formData, "full_name");
  const email = field(formData, "email");
  const password = String(formData.get("password") ?? "");
  // Only two choices exist. Anything else, including "admin", becomes a
  // student. The database makes the same decision again (see 009), because
  // anyone can tamper with what a browser sends.
  const accountType = field(formData, "account_type") === "owner" ? "owner" : "student";

  if (!fullName || !email) back("/signup", "missing_signup");
  if (password.length < 6) back("/signup", "weak_password");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, account_type: accountType } },
  });

  if (error) {
    if (error.code === "user_already_exists") back("/signup", "email_taken");
    if (error.code === "weak_password") back("/signup", "weak_password");
    if (error.code?.startsWith("over_")) back("/signup", "too_many_attempts");
    back("/signup", "signup_failed");
  }

  // If "Confirm email" is still ON in Supabase, there is no session yet.
  if (!data.session) redirect("/login?notice=confirm_email");

  redirect(accountType === "owner" ? "/owner" : "/saved");
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

  // Each kind of account lands on its own page.
  const { role } = await getUserAndRole(supabase);
  redirect(homeFor(role));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// Start "Continue with Google" or "Continue with Facebook". Supabase Auth
// does the real work: it sends the person to the provider, and the provider
// sends them back to /auth/callback (see src/app/auth/callback/route.ts). Our
// code never sees a Google or Facebook password or app secret; those secrets
// live only in the Supabase dashboard.
//
// Each button only exists when its switch is "true" (NEXT_PUBLIC_GOOGLE_LOGIN
// or NEXT_PUBLIC_FACEBOOK_LOGIN, see src/components/social-buttons.tsx), and
// we check again here.
//
// The button's value looks like "google:owner": the provider, then the
// account type chosen on the Sign up page.
export async function signInWithProvider(formData: FormData) {
  const from = field(formData, "from") === "signup" ? "/signup" : "/login";
  const [providerName, typeName] = field(formData, "choice").split(":");

  let provider: "google" | "facebook";
  if (providerName === "google" && process.env.NEXT_PUBLIC_GOOGLE_LOGIN === "true") {
    provider = "google";
  } else if (providerName === "facebook" && process.env.NEXT_PUBLIC_FACEBOOK_LOGIN === "true") {
    provider = "facebook";
  } else {
    back(from, "oauth_failed");
  }

  // Same rule as the email form: only "owner" counts; anything else is a student.
  const accountType = typeName === "owner" ? "owner" : "student";

  // Our own address, so the provider knows where to send the person back to.
  // Supabase only accepts addresses on its allowed list (Authentication ->
  // URL Configuration), so a faked address is refused.
  // If the team sets SITE_URL (for example https://inside-out-two.vercel.app)
  // we use it as is. Without it we fall back to the address the request came to.
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const site = (process.env.SITE_URL ?? `${protocol}://${host}`).replace(/\/$/, "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${site}/auth/callback?type=${accountType}` },
  });

  if (error || !data.url) back(from, "oauth_failed");
  redirect(data.url);
}

"use server";

import { redirect } from "next/navigation";
import { getUserAndRole, homeFor } from "@/lib/auth";
import { siteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { formText as field, isWeakPassword } from "@/lib/validation";

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
  if (isWeakPassword(password)) back("/signup", "weak_password");
  // Creating an account means agreeing to the Privacy page.
  if (formData.get("agree_privacy") !== "on") back("/signup", "need_privacy");

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
    // Wrong email and wrong password get the SAME message, so nobody can use
    // this form to find out which emails have accounts.
    back(
      "/login",
      error.code?.startsWith("over_")
        ? "too_many_attempts"
        : error.code === "email_not_confirmed"
          ? "email_not_confirmed"
          : "invalid_credentials",
    );
  }

  // Each kind of account lands on its own page.
  const { role } = await getUserAndRole(supabase);
  redirect(homeFor(role));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?notice=logged_out");
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

  const site = await siteUrl();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${site}/auth/callback?type=${accountType}` },
  });

  if (error || !data.url) back(from, "oauth_failed");
  redirect(data.url);
}

// "Forgot password": email the person a link to choose a new one. The answer
// is always the same, whether or not the email has an account, so this form
// cannot be used to find out who has an account.
export async function requestPasswordReset(formData: FormData) {
  const email = field(formData, "email");
  if (!email) back("/forgot-password", "missing_login");

  const supabase = await createClient();
  const site = await siteUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${site}/auth/callback?next=/reset-password`,
  });

  // Only a rate limit is worth telling them about; any other result looks the same.
  if (error?.code?.startsWith("over_")) back("/forgot-password", "too_many_attempts");

  redirect("/forgot-password?notice=reset_sent");
}

// Choose a new password. The person arrives here logged in by the one-time
// link from the email (see src/app/auth/callback/route.ts). Other devices are
// logged out afterwards, so whoever may have had the old password is cut off.
export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) back("/forgot-password", "reset_link_invalid");

  if (isWeakPassword(password)) back("/reset-password", "weak_password");
  if (password !== confirm) back("/reset-password", "password_mismatch");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    back(
      "/reset-password",
      error.code === "same_password"
        ? "same_password"
        : error.code === "weak_password"
          ? "weak_password"
          : "reset_failed_generic",
    );
  }

  await supabase.auth.signOut({ scope: "others" });

  const { role } = await getUserAndRole(supabase);
  redirect(`${homeFor(role)}?notice=password_changed`);
}

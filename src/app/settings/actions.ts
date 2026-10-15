"use server";

import { redirect } from "next/navigation";
import { siteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { formText } from "@/lib/validation";

// Actions on the person's own account. All of them need a logged-in person,
// and the database functions check again who is asking.
//
// redirect() throws a special signal, so it is never inside a try/catch.

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

// Change the name shown on the person's profile.
export async function updateName(formData: FormData) {
  const name = formText(formData, "full_name");
  if (name.length < 2 || name.length > 80) redirect("/settings/account?error=bad_name");

  const { supabase } = await currentUser();
  const { error } = await supabase.rpc("update_my_name", { p_name: name });
  if (error) redirect("/settings/account?error=name_failed");

  redirect("/settings/account?notice=name_saved");
}

// Email the person a link to choose a new password. The link goes to THEIR
// address on file, never to one typed into a form, so nobody else's inbox can
// be targeted from here.
export async function sendPasswordLink() {
  const { supabase, user } = await currentUser();
  if (!user.email) redirect("/settings/security?error=reset_email_failed");

  const site = await siteUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${site}/auth/callback?next=/reset-password`,
  });
  if (error) redirect("/settings/security?error=reset_email_failed");

  redirect("/settings/security?notice=reset_sent");
}

// Log the account out of every other phone and computer, keeping this one.
export async function signOutOtherDevices() {
  const { supabase } = await currentUser();
  const { error } = await supabase.auth.signOut({ scope: "others" });
  if (error) redirect("/settings/security?error=others_failed");

  redirect("/settings/security?notice=others_signed_out");
}

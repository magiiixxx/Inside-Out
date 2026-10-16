"use server";

import { redirect } from "next/navigation";
import { getUserAndRole } from "@/lib/auth";
import { removePhoto } from "@/lib/photos";
import { createClient } from "@/lib/supabase/server";
import { formText, UUID } from "@/lib/validation";

// Approve or reject a room. The real protection is inside the database:
// review_listing() refuses anyone who is not an admin. The checks here
// only give friendlier errors, and on a problem we redirect with a short
// code that the page looks up in src/lib/messages.ts.
//
// redirect() throws a special signal, so it is never inside a try/catch.

export async function reviewRoom(formData: FormData) {
  const listingId = String(formData.get("listing_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!UUID.test(listingId) || (decision !== "approved" && decision !== "rejected")) {
    redirect("/admin?error=invalid_request");
  }
  // A rejection must say why: the owner reads this to fix the room.
  if (decision === "rejected" && (reason.length < 5 || reason.length > 300)) {
    redirect("/admin?error=need_reason");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("review_listing", {
    p_listing_id: listingId,
    p_decision: decision,
    p_reason: decision === "rejected" ? reason : null,
  });

  if (error) redirect("/admin?error=review_failed");

  redirect(`/admin?notice=${decision}`);
}

// Delete any room (spam, a mistake, or a leftover test room). The database
// function allows this only for the room's owner or an admin.
export async function deleteAnyRoom(formData: FormData) {
  const listingId = String(formData.get("listing_id") ?? "");

  if (!UUID.test(listingId)) redirect("/admin?error=invalid_request");

  const supabase = await createClient();
  const { data: room } = await supabase
    .from("listings")
    .select("photo_path")
    .eq("id", listingId)
    .maybeSingle();

  const { error } = await supabase.rpc("delete_room", { p_listing_id: listingId });

  if (error) redirect("/admin?error=delete_failed");

  await removePhoto(supabase, room?.photo_path);

  redirect("/admin?notice=deleted");
}

// Turn on the plan an owner asked for. Do this only AFTER the payment (GCash,
// Maya or bank) has arrived. The database function activate_plan() refuses
// anyone who is not an admin.
export async function activatePlan(formData: FormData) {
  const requestId = String(formData.get("request_id") ?? "");
  if (!UUID.test(requestId)) redirect("/admin?error=invalid_request");

  const supabase = await createClient();
  const { error } = await supabase.rpc("activate_plan", { p_request_id: requestId });

  if (error) {
    redirect(
      error.message.includes("already has this plan")
        ? "/admin?error=plan_not_upgrade"
        : error.message.includes("no payment reference")
          ? "/admin?error=no_reference_yet"
          : "/admin?error=plan_action_failed",
    );
  }

  redirect("/admin?notice=plan_activated");
}

// Turn a plan request down (no payment, or a mistake).
export async function dismissPlanRequest(formData: FormData) {
  const requestId = String(formData.get("request_id") ?? "");
  if (!UUID.test(requestId)) redirect("/admin?error=invalid_request");

  const supabase = await createClient();
  const { error } = await supabase.rpc("dismiss_plan_request", { p_request_id: requestId });

  if (error) redirect("/admin?error=plan_action_failed");

  redirect("/admin?notice=plan_dismissed");
}

// Close a student's report. With hide = "1" the room also goes back to
// "pending" (students stop seeing it) until the team has checked it. The
// database function resolve_report() refuses anyone who is not an admin.
export async function resolveReport(formData: FormData) {
  const reportId = String(formData.get("report_id") ?? "");
  const hide = formData.get("hide") === "1";
  if (!UUID.test(reportId)) redirect("/admin?error=invalid_request");

  const supabase = await createClient();
  const { error } = await supabase.rpc("resolve_report", {
    p_report_id: reportId,
    p_hide: hide,
  });

  if (error) redirect("/admin?error=report_action_failed");

  redirect(`/admin?notice=${hide ? "report_hidden" : "report_resolved"}`);
}

// Clear every star rating on a room (fake or abusive ratings). The database
// function reset_room_ratings() refuses anyone who is not an admin.
export async function resetRatings(formData: FormData) {
  const listingId = String(formData.get("listing_id") ?? "");
  if (!UUID.test(listingId)) redirect("/admin?error=invalid_request");

  const supabase = await createClient();
  const { error } = await supabase.rpc("reset_room_ratings", { p_listing_id: listingId });

  if (error) redirect("/admin?error=reset_failed");

  redirect("/admin?notice=ratings_reset");
}

// Mark a user's message as handled. The database function
// close_support_message() refuses anyone who is not an admin.
export async function closeSupportMessage(formData: FormData) {
  const messageId = String(formData.get("message_id") ?? "");
  if (!UUID.test(messageId)) redirect("/admin?error=invalid_request");

  const supabase = await createClient();
  const { error } = await supabase.rpc("close_support_message", { p_id: messageId });

  if (error) redirect("/admin?error=support_action_failed");

  redirect("/admin?notice=support_closed");
}

// Sign in to the team area. It uses the same Supabase login as everyone else (so
// there is no second set of passwords), but only a TEAM account is let through:
// anyone else is signed straight out again. A student or owner whose password is
// right gets the same message as a wrong password, so this page cannot be used to
// find out who has an account, or which accounts are team accounts.
//
// Whether a code is needed next (two-step) is decided by the team page itself.
export async function adminLogin(formData: FormData) {
  const email = formText(formData, "email");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect("/admin/login?error=missing_login");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(
      error.code?.startsWith("over_") ? "/admin/login?error=too_many_attempts" : "/admin/login?error=invalid_credentials",
    );
  }

  const { role } = await getUserAndRole(supabase);
  if (role !== "admin") {
    await supabase.auth.signOut();
    redirect("/admin/login?error=invalid_credentials");
  }

  redirect("/admin");
}

// Sign out of the team area and return to its own sign-in page.
export async function adminLogout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login?notice=logged_out");
}

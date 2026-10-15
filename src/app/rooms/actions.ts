"use server";

import { redirect } from "next/navigation";
import { safeBack, withCode } from "@/lib/back";
import { REPORT_REASONS } from "@/lib/reports";
import { createClient } from "@/lib/supabase/server";

// Student actions on a room: report a problem, and give it stars. The real
// rules (only students, only rooms students can see, one rating each) are
// enforced inside the database functions report_room() and rate_room(); the
// checks here only give friendlier messages.
//
// redirect() throws a special signal, so it is never inside a try/catch.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function reportRoom(formData: FormData) {
  const listingId = String(formData.get("listing_id") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const back = safeBack(String(formData.get("back") ?? ""));

  if (!UUID.test(listingId) || !REPORT_REASONS.some((r) => r.value === reason)) {
    redirect(withCode(back, "error", "invalid_request"));
  }
  if (note.length > 200) redirect(withCode(back, "error", "report_failed"));

  const supabase = await createClient();
  const { error } = await supabase.rpc("report_room", {
    p_listing_id: listingId,
    p_reason: reason,
    p_note: note || null,
  });

  if (error) {
    const code = error.message.includes("already reported")
      ? "already_reported"
      : error.message.includes("Only student")
        ? "students_only_report"
        : error.message.includes("not available")
          ? "room_gone"
          : "report_failed";
    redirect(withCode(back, "error", code));
  }

  redirect(withCode(back, "notice", "report_sent"));
}

export async function rateRoom(formData: FormData) {
  const listingId = String(formData.get("listing_id") ?? "");
  const stars = Number(formData.get("stars"));
  const back = safeBack(String(formData.get("back") ?? ""));

  if (!UUID.test(listingId) || !Number.isInteger(stars) || stars < 1 || stars > 5) {
    redirect(withCode(back, "error", "invalid_request"));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("rate_room", {
    p_listing_id: listingId,
    p_stars: stars,
  });

  if (error) {
    const code = error.message.includes("Only student")
      ? "students_only_rate"
      : error.message.includes("not available")
        ? "room_gone"
        : "rate_failed";
    redirect(withCode(back, "error", code));
  }

  redirect(withCode(back, "notice", "rated"));
}

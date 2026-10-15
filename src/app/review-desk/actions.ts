"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Approve or reject a room. The real protection is inside the database:
// review_listing() refuses anyone who is not an admin. The checks here
// only give friendlier errors.
//
// redirect() throws a special signal, so it is never inside a try/catch.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function reviewRoom(formData: FormData) {
  const listingId = String(formData.get("listing_id") ?? "");
  const decision = String(formData.get("decision") ?? "");

  if (!UUID.test(listingId) || (decision !== "approved" && decision !== "rejected")) {
    redirect("/review-desk?error=" + encodeURIComponent("That request was not valid."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("review_listing", {
    p_listing_id: listingId,
    p_decision: decision,
  });

  if (error) {
    redirect("/review-desk?error=" + encodeURIComponent(error.message));
  }

  redirect(`/review-desk?done=${decision}`);
}

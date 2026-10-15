"use server";

import { redirect } from "next/navigation";
import { removePhoto } from "@/lib/photos";
import { createClient } from "@/lib/supabase/server";

// Approve or reject a room. The real protection is inside the database:
// review_listing() refuses anyone who is not an admin. The checks here
// only give friendlier errors, and on a problem we redirect with a short
// code that the page looks up in src/lib/messages.ts.
//
// redirect() throws a special signal, so it is never inside a try/catch.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function reviewRoom(formData: FormData) {
  const listingId = String(formData.get("listing_id") ?? "");
  const decision = String(formData.get("decision") ?? "");

  if (!UUID.test(listingId) || (decision !== "approved" && decision !== "rejected")) {
    redirect("/review-desk?error=invalid_request");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("review_listing", {
    p_listing_id: listingId,
    p_decision: decision,
  });

  if (error) redirect("/review-desk?error=review_failed");

  redirect(`/review-desk?notice=${decision}`);
}

// Delete any room (spam, a mistake, or a leftover test room). The database
// function allows this only for the room's owner or an admin.
export async function deleteAnyRoom(formData: FormData) {
  const listingId = String(formData.get("listing_id") ?? "");

  if (!UUID.test(listingId)) redirect("/review-desk?error=invalid_request");

  const supabase = await createClient();
  const { data: room } = await supabase
    .from("listings")
    .select("photo_path")
    .eq("id", listingId)
    .maybeSingle();

  const { error } = await supabase.rpc("delete_room", { p_listing_id: listingId });

  if (error) redirect("/review-desk?error=delete_failed");

  await removePhoto(supabase, room?.photo_path);

  redirect("/review-desk?notice=deleted");
}

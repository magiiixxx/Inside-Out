"use server";

import { redirect } from "next/navigation";
import { chatErrorCode } from "@/lib/chat";
import { createClient } from "@/lib/supabase/server";
import { UUID } from "@/lib/validation";

// A student sends the FIRST message about a room. The database function
// start_conversation() makes the real checks (only students, only an approved
// room that is still visible, a length limit, and a limit on how fast); the
// checks here only give friendlier messages. Replies afterwards are sent from
// the chat page itself.
//
// redirect() throws a special signal, so it is never inside a try/catch.

export async function startChat(formData: FormData) {
  const listingId = String(formData.get("listing_id") ?? "");
  const body = String(formData.get("body") ?? "");
  if (!UUID.test(listingId)) redirect("/?error=invalid_request");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_conversation", {
    p_listing_id: listingId,
    p_body: body,
  });

  if (error || typeof data !== "string" || !UUID.test(data)) {
    redirect(`/messages/new?room=${listingId}&error=${chatErrorCode(error?.message ?? "")}`);
  }

  redirect(`/messages/${data}`);
}

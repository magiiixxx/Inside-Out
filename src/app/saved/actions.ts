"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Save or remove a favorite room. The real rules (only students, only
// visible rooms, at most 50) are enforced inside the database function
// set_favorite(); the checks here only give friendlier messages.
//
// On the way back we add a short CODE to the address, never raw text: the
// page looks the code up in src/lib/messages.ts.
//
// redirect() throws a special signal, so it is never inside a try/catch.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Where we are willing to send the person afterwards: the Saved page, or
// the home page with its filter (/?max=1500&sort=recent). Anything else,
// like another website's address, is ignored.
const SAFE_BACK = /^\/(\?[A-Za-z0-9=&._%-]*)?$/;

function safeBack(value: string): string {
  return value === "/saved" || SAFE_BACK.test(value) ? value : "/saved";
}

function withCode(back: string, key: "notice" | "error", code: string): string {
  return `${back}${back.includes("?") ? "&" : "?"}${key}=${code}`;
}

export async function setSaved(formData: FormData) {
  const listingId = String(formData.get("listing_id") ?? "");
  const save = formData.get("save") === "1";
  const back = safeBack(String(formData.get("back") ?? ""));

  if (!UUID.test(listingId)) redirect(withCode(back, "error", "invalid_request"));

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_favorite", {
    p_listing_id: listingId,
    p_saved: save,
  });

  if (error) {
    const code = error.message.includes("Only student")
      ? "students_only"
      : error.message.includes("at most 50")
        ? "too_many_saved"
        : error.message.includes("not available")
          ? "room_unavailable"
          : "favorite_failed";
    redirect(withCode(back, "error", code));
  }

  redirect(withCode(back, "notice", save ? "saved" : "unsaved"));
}

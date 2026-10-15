"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formText } from "@/lib/validation";

// A message from a logged-in person to our team: a bug, some feedback or a
// question. The database function send_support_message() checks who is asking
// and limits how many a person can send in a day.
//
// redirect() throws a special signal, so it is never inside a try/catch.

const KINDS = ["bug", "feedback", "question"];

export async function sendSupportMessage(formData: FormData) {
  const kind = formText(formData, "kind");
  const message = formText(formData, "message");
  const page = formText(formData, "page").slice(0, 200);

  const backTo = (code: string): never => redirect(`/report-problem?kind=${KINDS.includes(kind) ? kind : "bug"}&error=${code}`);

  if (!KINDS.includes(kind)) backTo("bad_kind");
  if (message.length < 10 || message.length > 1000) backTo("bad_message");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("send_support_message", {
    p_kind: kind,
    p_message: message,
    p_page: page || null,
  });

  if (error) backTo(error.message.includes("too many") ? "support_too_many" : "support_failed");

  redirect("/report-problem?notice=support_sent");
}

import { NextResponse } from "next/server";
import { getUserAndRole, homeFor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Google (through Supabase) sends the person back here with a one-time
// "code". We swap the code for a login session, then send them to their home
// page: students to Saved rooms, owners to the owner home.
//
// "type=owner" comes from the button they pressed on the Sign up page. The
// database accepts it only for an account created in the last 10 minutes (see
// choose_account_type() in supabase/sql/017), so it cannot turn an old
// student account into an owner.

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const wantsOwner = searchParams.get("type") === "owner";
  // Where to go afterwards, from a short list of our own pages (never an
  // address taken from the link, which could point to another website).
  const next = searchParams.get("next") === "/reset-password" ? "/reset-password" : null;

  if (!code) return NextResponse.redirect(`${origin}/login?error=oauth_failed`);

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/login?error=oauth_failed`);

  if (wantsOwner) {
    // Ignore a refusal: for an existing account it simply stays as it was.
    await supabase.rpc("choose_account_type", { p_type: "owner" });
  }

  if (next) return NextResponse.redirect(`${origin}${next}`);

  const { role } = await getUserAndRole(supabase);
  return NextResponse.redirect(`${origin}${homeFor(role)}`);
}

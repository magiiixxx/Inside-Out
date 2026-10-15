"use server";

import { redirect } from "next/navigation";
import { PAY_METHODS } from "@/lib/payment";
import { createClient } from "@/lib/supabase/server";

// An owner on the Free plan asks for Premium Owner. Nothing is paid here:
// the team contacts the owner, receives the payment (GCash, Maya or bank),
// and then activates the plan from the team page.
//
// redirect() throws a special signal, so it is never inside a try/catch.

export async function requestPremium(formData: FormData) {
  const payMethod = String(formData.get("pay_method") ?? "");
  const contactPhone = String(formData.get("contact_phone") ?? "").trim();

  if (!PAY_METHODS.some((m) => m.value === payMethod)) redirect("/pricing?error=bad_pay_method");
  if (!/^[0-9+()\-\s]{7,20}$/.test(contactPhone)) redirect("/pricing?error=bad_contact_phone");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("request_plan", {
    p_plan: "premium",
    p_pay_method: payMethod,
    p_contact_phone: contactPhone,
  });

  if (error) {
    redirect(
      error.message.includes("already have a request")
        ? "/pricing?error=plan_request_exists"
        : "/pricing?error=plan_request_failed",
    );
  }

  redirect("/pricing?notice=plan_requested");
}

"use server";

import { redirect } from "next/navigation";
import { PAY_METHODS } from "@/lib/payment";
import { createClient } from "@/lib/supabase/server";
import { isValidPaymentReference } from "@/lib/validation";

// An owner asks for a paid plan (Premium Owner or Property Manager).
// Nothing is paid here:
// the team contacts the owner, receives the payment (GCash, Maya or bank),
// and then activates the plan from the team page.
//
// redirect() throws a special signal, so it is never inside a try/catch.

export async function requestPlan(formData: FormData) {
  const plan = String(formData.get("plan") ?? "");
  const payMethod = String(formData.get("pay_method") ?? "");
  const contactPhone = String(formData.get("contact_phone") ?? "").trim();

  if (plan !== "premium" && plan !== "manager") redirect("/pricing?error=bad_plan");
  if (!PAY_METHODS.some((m) => m.value === payMethod)) redirect("/pricing?error=bad_pay_method");
  if (!/^[0-9+()\-\s]{7,20}$/.test(contactPhone)) redirect("/pricing?error=bad_contact_phone");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("request_plan", {
    p_plan: plan,
    p_pay_method: payMethod,
    p_contact_phone: contactPhone,
  });

  if (error) {
    redirect(
      error.message.includes("already have a request")
        ? "/pricing?error=plan_request_exists"
        : error.message.includes("already have that plan")
          ? "/pricing?error=plan_already"
          : "/pricing?error=plan_request_failed",
    );
  }

  redirect("/pricing?notice=plan_requested");
}

// After paying, the owner types the reference number from their receipt. It is
// saved on their waiting request, where the team sees it and checks it against
// their own GCash, Maya or bank records before activating the plan. The database
// function submit_payment_reference() accepts it only for the caller's own waiting
// request, and a reference number can be used only once.
export async function submitPaymentReference(formData: FormData) {
  const reference = String(formData.get("reference") ?? "").trim();
  if (!isValidPaymentReference(reference)) redirect("/pricing?error=bad_reference#upgrade");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("submit_payment_reference", { p_reference: reference });

  if (error) {
    redirect(
      error.message.includes("already used")
        ? "/pricing?error=reference_used#upgrade"
        : error.message.includes("no plan request")
          ? "/pricing?error=no_pending_request#upgrade"
          : "/pricing?error=plan_request_failed#upgrade",
    );
  }

  redirect("/pricing?notice=reference_saved#upgrade");
}

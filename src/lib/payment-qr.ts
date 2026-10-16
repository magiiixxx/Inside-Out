import type { SupabaseClient } from "@supabase/supabase-js";

// The team's payment QR codes are kept in a PRIVATE Supabase storage bucket
// ("payment-qr", see supabase/sql/022), not in the code (the repository is
// public). The team uploads them in the Supabase dashboard, named
//   <method>-<plan>.<jpg|png|webp>     for example   gcash-premium.jpg
// because a QR code is for one amount, so each plan has its own.
//
// An owner can read these files only while they have a waiting plan request
// (a storage rule), and we hand out a link that stops working after 10 minutes.

const BUCKET = "payment-qr";
const METHODS = ["gcash", "maya", "bank"];
const PLANS = ["premium", "manager"];
const LINK_SECONDS = 600;

export async function getPaymentQrUrl(
  supabase: SupabaseClient,
  method: string,
  plan: string,
): Promise<string | null> {
  // Only our own fixed names are ever looked up.
  if (!METHODS.includes(method) || !PLANS.includes(plan)) return null;

  const prefix = `${method}-${plan}.`;
  const { data: files, error } = await supabase.storage.from(BUCKET).list("", { search: `${method}-${plan}`, limit: 10 });
  if (error) {
    console.error("Payment QR: could not list files:", error.message);
    return null;
  }
  const file = files?.find((f) => f.name.startsWith(prefix));
  if (!file) return null;

  const { data, error: linkError } = await supabase.storage.from(BUCKET).createSignedUrl(file.name, LINK_SECONDS);
  if (linkError) {
    console.error("Payment QR: could not make a link:", linkError.message);
    return null;
  }
  return data?.signedUrl ?? null;
}

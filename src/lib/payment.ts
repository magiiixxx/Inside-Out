// How owners pay for a plan. The app takes NO money: the owner pays the team
// directly, then a team member activates the plan (see supabase/sql/013).
//
// The values must match the database check on plan_requests.pay_method.

export type PayMethod = "gcash" | "maya" | "bank";

export const PAY_METHODS: { value: PayMethod; label: string }[] = [
  { value: "gcash", label: "GCash" },
  { value: "maya", label: "Maya" },
  { value: "bank", label: "Bank transfer" },
];

export function payMethodLabel(value: string): string {
  return PAY_METHODS.find((m) => m.value === value)?.label ?? value;
}

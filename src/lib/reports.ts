// Why a student can report a room. The values must match the database check
// on room_reports.reason (supabase/sql/016-reasons-reports-ratings.sql).

export type ReportReason = "not_available" | "wrong_phone" | "wrong_info" | "scam" | "other";

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "not_available", label: "The room is already taken" },
  { value: "wrong_phone", label: "The phone number does not work" },
  { value: "wrong_info", label: "The price or details are wrong" },
  { value: "scam", label: "It looks like a scam" },
  { value: "other", label: "Something else" },
];

export function reportReasonLabel(value: string): string {
  return REPORT_REASONS.find((r) => r.value === value)?.label ?? value;
}

// Owner plans. Students are never charged; only owners have a plan.
//
// The plan is stored in the database (profiles.plan) and only the team can
// change it. The one-room limit for Free is enforced by the database
// function post_room() (see supabase/sql/010-owner-plans.sql); the pages use
// the same number to explain it and to hide the "Add a room" button.

export type Plan = "free" | "premium" | "manager";

// Keep this equal to the limit inside post_room() in 010-owner-plans.sql.
export const FREE_ROOM_LIMIT = 1;

export const PLAN_NAMES: Record<Plan, string> = {
  free: "Free",
  premium: "Premium Owner",
  manager: "Property Manager",
};

// Can this account post one more room? Admins are never limited, and only
// the Free plan has a limit.
export function isAtRoomLimit(
  role: string | null | undefined,
  plan: string | null | undefined,
  roomCount: number,
): boolean {
  if (role === "admin") return false;
  return (plan ?? "free") === "free" && roomCount >= FREE_ROOM_LIMIT;
}

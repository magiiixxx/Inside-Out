// How long a room stays visible to students after its owner last updated it.
//
// This must match the database rule in supabase/sql/002-create-listings.sql
// ("last_updated_at > now() - interval '7 days'"). The database is the real
// lock; the pages use this number to explain and to filter explicitly.
export const HIDE_AFTER_DAYS = 7;

// "Updated today / yesterday / 3 days ago", for room cards.
export function updatedLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  return `Updated ${days} days ago`;
}

// The oldest "last updated" time a room may have and still be visible.
export function hideCutoff(): string {
  return new Date(Date.now() - HIDE_AFTER_DAYS * 86_400_000).toISOString();
}

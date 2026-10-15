import Link from "next/link";
import { setSaved } from "@/app/saved/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoomCard, type RoomCardData } from "@/components/room-card";
import { SaveRoomButton } from "@/components/save-room-button";
import { getUserAndRole } from "@/lib/auth";
import { hideCutoff } from "@/lib/listings";
import { errorText, noticeText } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";

// The student Browse screen. Anyone can use it without logging in.
// A logged-in STUDENT also sees a Save button on each room.
//
// This is a server component: the database query runs on the server before
// the page reaches the phone.
//
// Two locks work together. Row Level Security keeps the public from reading
// anything but approved rooms updated in the last 7 days. But owners may
// also read their OWN rooms, and admins may read ALL rooms, so when one of
// them opens this page the database would hand back pending and stale rooms
// too. That is why this page ALSO asks only for approved, recent rooms:
// everyone sees the same student view, whoever they are.
//
// The filter and sort live in the URL (?max=1500&sort=recent), so the page
// works without any browser JavaScript and a filtered view can be shared.

// Render on every visit. Without this, Next.js can build the page once and
// reuse it, so a room marked "occupied" would keep showing as available.
export const dynamic = "force-dynamic";

type SortOrder = "nearest" | "recent";

// What students see if something goes wrong. Never show them system messages.
const LOAD_ERROR = "We could not load the rooms right now. Please try again in a moment.";

async function getListings(
  maxPrice: number | null,
  sort: SortOrder,
): Promise<{ rooms: RoomCardData[]; error?: string }> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("listings")
      .select(
        "id, description, price_per_month, distance_km, contact_phone, availability, last_updated_at",
      )
      .eq("approval_status", "approved")
      .gt("last_updated_at", hideCutoff());

    if (maxPrice !== null) query = query.lte("price_per_month", maxPrice);

    query =
      sort === "recent"
        ? query.order("last_updated_at", { ascending: false })
        : query.order("distance_km", { ascending: true });

    const { data, error } = await query;
    if (error) {
      // The detail goes to the server log (Vercel -> Logs), not to the page.
      console.error("Browse: could not load rooms:", error.message);
      return { rooms: [], error: LOAD_ERROR };
    }
    return { rooms: (data ?? []) as RoomCardData[] };
  } catch (e) {
    console.error("Browse: could not load rooms:", e);
    return { rooms: [], error: LOAD_ERROR };
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ max?: string; sort?: string; notice?: string; error?: string }>;
}) {
  const params = await searchParams;

  // Never trust the URL: only accept a positive, sensible number for the
  // price, and our own message codes.
  const maxParsed = Number(params.max);
  const maxPrice =
    params.max && Number.isFinite(maxParsed) && maxParsed > 0 && maxParsed <= 1_000_000
      ? maxParsed
      : null;
  const sort: SortOrder = params.sort === "recent" ? "recent" : "nearest";
  const notice = noticeText(params.notice);
  const actionError = errorText(params.error);

  const { rooms, error } = await getListings(maxPrice, sort);
  const isFiltered = maxPrice !== null;

  // Who is looking? A logged-in student gets Save buttons.
  const supabase = await createClient();
  const { user, role } = await getUserAndRole(supabase);
  const isStudent = role === "student";

  let savedIds = new Set<string>();
  if (isStudent) {
    const { data: saved } = await supabase.from("favorites").select("listing_id");
    savedIds = new Set((saved ?? []).map((s) => s.listing_id as string));
  }

  // Where to come back to after pressing Save, keeping the filter.
  const backParams = new URLSearchParams();
  if (maxPrice !== null) backParams.set("max", String(maxPrice));
  if (sort === "recent") backParams.set("sort", "recent");
  const back = backParams.size > 0 ? `/?${backParams.toString()}` : "/";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:py-16">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex w-fit items-center rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
            Near PHINMA UI
          </span>
          <Link
            href={user ? (isStudent ? "/saved" : "/owner") : "/login"}
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            {!user ? "Log in" : isStudent ? "Saved rooms" : "Owner home"}
          </Link>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          BahayFind
        </h1>
        <p className="text-base text-muted-foreground">
          Boarding house rooms that owners confirm are available. Every room is
          approved by our team, and rooms nobody has updated for 7 days are
          hidden.
        </p>
        {!user && (
          <p className="text-sm text-muted-foreground">
            Browsing is open to everyone.{" "}
            <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
              Create a free student account
            </Link>{" "}
            to save the rooms you like.
          </p>
        )}
      </header>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-[9rem] flex-1 flex-col gap-1.5">
          <Label htmlFor="max">Max price per month (₱)</Label>
          <Input
            id="max"
            name="max"
            type="number"
            inputMode="numeric"
            min="1"
            step="50"
            placeholder="e.g. 1500"
            defaultValue={maxPrice ?? ""}
          />
        </div>
        <div className="flex min-w-[9rem] flex-1 flex-col gap-1.5">
          <Label htmlFor="sort">Sort by</Label>
          <select
            id="sort"
            name="sort"
            defaultValue={sort}
            className="flex h-10 w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:text-sm"
          >
            <option value="nearest">Nearest to PHINMA UI</option>
            <option value="recent">Recently updated</option>
          </select>
        </div>
        <Button type="submit">Apply</Button>
        {isFiltered && (
          <Link
            href={`/?sort=${sort}`}
            className={buttonVariants({ variant: "ghost" })}
          >
            Clear filter
          </Link>
        )}
      </form>

      {notice && (
        <p role="status" className="rounded-[var(--radius)] border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm">
          {notice}
        </p>
      )}
      {actionError && (
        <p role="alert" className="rounded-[var(--radius)] border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm">
          {actionError}
        </p>
      )}

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Could not load rooms</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {error}
          </CardContent>
        </Card>
      ) : rooms.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            {isFiltered
              ? "No rooms match that price. Try a higher maximum."
              : "No rooms to show yet. Check back soon."}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {rooms.length} {rooms.length === 1 ? "room" : "rooms"}
          </p>
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room}>
              {isStudent && (
                <SaveRoomButton
                  action={setSaved}
                  listingId={room.id}
                  saved={savedIds.has(room.id)}
                  back={back}
                />
              )}
            </RoomCard>
          ))}
        </div>
      )}
    </main>
  );
}

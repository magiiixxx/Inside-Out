import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";

// The student Browse screen. No login needed.
//
// This is a server component: the database query runs on the server before
// the page reaches the phone. Row Level Security decides which rooms come
// back (approved AND updated in the last 7 days) — we do not filter those
// here, so a mistake on this page can never leak a pending or stale room.
//
// The filter and sort live in the URL (?max=1500&sort=recent), so the page
// works without any browser JavaScript and a filtered view can be shared.

// Render on every visit. Without this, Next.js can build the page once and
// reuse it, so a room marked "occupied" would keep showing as available.
export const dynamic = "force-dynamic";

type Listing = {
  id: string;
  description: string;
  price_per_month: number;
  distance_km: number;
  contact_phone: string;
  availability: "available" | "occupied";
  last_updated_at: string;
};

type SortOrder = "nearest" | "recent";

async function getListings(
  maxPrice: number | null,
  sort: SortOrder,
): Promise<{ rooms: Listing[]; error?: string }> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("listings")
      .select(
        "id, description, price_per_month, distance_km, contact_phone, availability, last_updated_at",
      );

    if (maxPrice !== null) query = query.lte("price_per_month", maxPrice);

    query =
      sort === "recent"
        ? query.order("last_updated_at", { ascending: false })
        : query.order("distance_km", { ascending: true });

    const { data, error } = await query;
    if (error) return { rooms: [], error: error.message };
    return { rooms: (data ?? []) as Listing[] };
  } catch (e) {
    return {
      rooms: [],
      error: e instanceof Error ? e.message : "Could not reach the database.",
    };
  }
}

function updatedLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  return `Updated ${days} days ago`;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ max?: string; sort?: string }>;
}) {
  const params = await searchParams;

  // Never trust the URL: only accept a positive number for the price.
  const maxParsed = Number(params.max);
  const maxPrice =
    params.max && Number.isFinite(maxParsed) && maxParsed > 0
      ? maxParsed
      : null;
  const sort: SortOrder = params.sort === "recent" ? "recent" : "nearest";

  const { rooms, error } = await getListings(maxPrice, sort);
  const isFiltered = maxPrice !== null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:py-16">
      <header className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
          Near PHINMA UI
        </span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          BahayFind
        </h1>
        <p className="text-base text-muted-foreground">
          Boarding house rooms that owners confirm are available. Every room is
          approved by our team, and rooms nobody has updated for 7 days are
          hidden.
        </p>
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
          {rooms.map((room) => {
            const isAvailable = room.availability === "available";
            return (
              <Card key={room.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <CardTitle className="text-base leading-snug">
                    {room.description}
                  </CardTitle>
                  <span
                    className={
                      isAvailable
                        ? "shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                        : "shrink-0 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                    }
                  >
                    {isAvailable ? "Available" : "Occupied"}
                  </span>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <span className="font-medium">
                      ₱{Number(room.price_per_month).toLocaleString()} / month
                    </span>
                    <span className="text-muted-foreground">
                      {Number(room.distance_km)} km from PHINMA UI
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                    <span>{updatedLabel(room.last_updated_at)}</span>
                    <a
                      href={`tel:${room.contact_phone.replace(/\s+/g, "")}`}
                      className="font-medium text-foreground underline underline-offset-4"
                    >
                      Call {room.contact_phone}
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}

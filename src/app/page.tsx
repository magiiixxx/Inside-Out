import Link from "next/link";
import { setSaved } from "@/app/saved/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckIcon, PinIcon } from "@/components/icons";
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

// The promises BahayFind makes, shown under the headline.
const PROMISES = ["Approved by our team", "Hidden if not updated in 7 days", "Call the owner directly"];

// The three steps shown to visitors who are not logged in.
const STEPS = [
  { title: "Set your budget", text: "Choose the most you can pay a month and sort by distance to PHINMA UI." },
  { title: "Check it is free", text: "Every room says Available or Occupied, and rooms nobody updated for 7 days are hidden." },
  { title: "Call the owner", text: "Phone the owner to see the room and to arrange payment in person." },
];

// A button with a pale outline, for use on the navy background.
const OUTLINE_ON_NAVY =
  "inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border border-[#4a6a93] px-5 font-bold text-white hover:bg-navy-deep";

async function getListings(
  maxPrice: number | null,
  sort: SortOrder,
): Promise<{ rooms: RoomCardData[]; error?: string }> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("listings")
      .select(
        "id, description, price_per_month, distance_km, contact_phone, address, availability, last_updated_at",
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
  const { user, role, fullName } = await getUserAndRole(supabase);
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

  const firstName = fullName.trim().split(/\s+/)[0];

  return (
    <main id="main" className="flex flex-1 flex-col">
      <section className="on-dark bg-navy text-white">
        <div className="mx-auto grid w-full max-w-[1200px] items-center gap-10 px-4 pb-28 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-navy-deep px-3.5 py-2 text-[0.8125rem] font-bold text-amber">
              <PinIcon className="h-3.5 w-3.5" />
              Near PHINMA University of Iloilo
            </p>
            <h1 className="text-balance text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
              {isStudent && firstName ? `Good day, ${firstName}.` : "Find a room that is really available."}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-navy-text">
              {isStudent
                ? "Here are the approved rooms near PHINMA University of Iloilo."
                : "Boarding house owners confirm their rooms, so you don’t travel to a room that is already taken."}
            </p>
            {!user && (
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#rooms" className={buttonVariants({ variant: "accent" })}>
                  Browse rooms
                </a>
                <Link href="/signup" className={OUTLINE_ON_NAVY}>
                  Create a free account
                </Link>
              </div>
            )}
          </div>

          <ul className="flex flex-col gap-4 rounded-[1.25rem] bg-white p-6 text-ink shadow-[0_24px_48px_rgb(0_0_0/0.25)]">
            {PROMISES.map((promise) => (
              <li key={promise} className="flex items-center gap-3.5 font-semibold">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f0fa]">
                  <CheckIcon className="h-5 w-5 text-navy" />
                </span>
                {promise}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mx-auto -mt-16 w-full max-w-[1200px] px-4 sm:px-8">
        <form method="get" className="card flex flex-wrap items-end gap-4 p-5 shadow-[var(--shadow-float)] sm:p-6">
          <div className="flex min-w-[11rem] flex-1 flex-col gap-1.5">
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
          <div className="flex min-w-[11rem] flex-1 flex-col gap-1.5">
            <Label htmlFor="sort">Sort by</Label>
            <select id="sort" name="sort" defaultValue={sort} className="field mt-0">
              <option value="nearest">Nearest to PHINMA UI</option>
              <option value="recent">Recently updated</option>
            </select>
          </div>
          <Button type="submit" variant="accent" className="w-full px-8 sm:w-auto">
            Apply
          </Button>
          {isFiltered && (
            <Link href={`/?sort=${sort}`} className={buttonVariants({ variant: "ghost" })}>
              Clear filter
            </Link>
          )}
        </form>
      </div>

      <section id="rooms" className="mx-auto flex w-full max-w-[1200px] scroll-mt-20 flex-col gap-6 px-4 pb-16 pt-12 sm:px-8">
        <div>
          <p className="eyebrow mb-2">Available rooms</p>
          <h2 className="text-3xl font-extrabold tracking-tight">Rooms near PHINMA UI</h2>
          {!error && rooms.length > 0 && (
            <p className="mt-2 text-muted-foreground">
              {rooms.length} {rooms.length === 1 ? "room" : "rooms"} to look at
            </p>
          )}
        </div>

        {notice && (
          <p role="status" className="alert-success">
            {notice}
          </p>
        )}
        {actionError && (
          <p role="alert" className="alert-error">
            {actionError}
          </p>
        )}

        {error ? (
          <Card>
            <CardHeader>
              <CardTitle>Could not load rooms</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{error}</CardContent>
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
      </section>

      {!user && (
        <>
          <section id="how" className="mx-auto w-full max-w-[1200px] scroll-mt-20 px-4 pb-16 sm:px-8">
            <p className="eyebrow mb-2">Simple process</p>
            <h2 className="mb-8 text-3xl font-extrabold tracking-tight">How it works</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {STEPS.map((step, n) => (
                <div key={step.title} className="card p-8">
                  <p className="eyebrow">Step 0{n + 1}</p>
                  <h3 className="mb-2.5 mt-3 text-xl font-bold">{step.title}</h3>
                  <p className="leading-relaxed text-muted-foreground">{step.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto w-full max-w-[1200px] px-4 pb-16 sm:px-8">
            <div className="on-dark flex flex-wrap items-center justify-between gap-7 rounded-3xl bg-navy p-8 text-white sm:p-14">
              <div className="max-w-xl">
                <p className="eyebrow mb-2.5">For owners</p>
                <h2 className="text-3xl font-extrabold tracking-tight">Own a rental near PHINMA UI?</h2>
                <p className="mt-3.5 leading-relaxed text-navy-text">
                  Post your room for free and reach students looking for a place
                  close to campus. Our team approves every room first.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/signup" className={buttonVariants({ variant: "accent" })}>
                  Post your room
                </Link>
                <Link href="/pricing" className={OUTLINE_ON_NAVY}>
                  See plans
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

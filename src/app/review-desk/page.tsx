import { notFound } from "next/navigation";
import { deleteAnyRoom, reviewRoom } from "@/app/review-desk/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteRoomButton } from "@/components/delete-room-button";
import { errorText, noticeText } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";

// The team's review page. Its address is not linked anywhere on the site.
//
// IMPORTANT: a hidden address is NOT the lock. Anyone could guess or be
// told the address. The lock is the two checks below, plus the database,
// which only lets an admin read the permits and call review_listing().

type PendingCheck = {
  permit_number: string;
  owner_or_caretaker: string;
  open_beds: number;
  listings: {
    id: string;
    owner_id: string;
    description: string;
    price_per_month: number;
    distance_km: number;
    contact_phone: string;
    address: string | null;
    created_at: string;
  };
};

type OtherRoom = {
  id: string;
  owner_id: string | null;
  description: string;
  price_per_month: number;
  contact_phone: string;
  approval_status: "approved" | "rejected";
};

export default async function ReviewDesk({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  // The address carries only short codes; the text comes from our own list.
  const params = await searchParams;
  const notice = noticeText(params.notice);
  const error = errorText(params.error);
  const supabase = await createClient();

  // Check 1: logged in? (Logged-out visitors see the Not found page, so
  // they cannot even tell this page exists.)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // Check 2: is this account an admin? Row Level Security lets each user
  // read only their own profile row, so this returns the caller's own role.
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.role !== "admin") notFound();

  // Pending rooms with their private permit check. Only admins can read
  // listing_checks, so for anyone else this would return nothing.
  const { data: pending, error: loadError } = await supabase
    .from("listing_checks")
    .select(
      "permit_number, owner_or_caretaker, open_beds, listings!inner(id, owner_id, description, price_per_month, distance_km, contact_phone, address, created_at)",
    )
    .eq("listings.approval_status", "pending")
    .order("created_at", { ascending: true });

  const rows = (pending ?? []) as unknown as PendingCheck[];

  // The newest 50 rooms that are already decided, so the team can remove
  // spam, mistakes or leftover test rooms. Admins may read every room.
  const { data: others } = await supabase
    .from("listings")
    .select("id, owner_id, description, price_per_month, contact_phone, approval_status")
    .neq("approval_status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);
  const otherRooms = (others ?? []) as OtherRoom[];

  // Owner names (admins may read all profiles). Sample rooms have no owner.
  const ownerIds = [
    ...new Set(
      [...rows.map((r) => r.listings.owner_id), ...otherRooms.map((r) => r.owner_id)].filter(
        (id): id is string => id !== null,
      ),
    ),
  ];
  const { data: owners } = ownerIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ownerIds)
    : { data: [] as { id: string; full_name: string }[] };
  const ownerName = new Map((owners ?? []).map((o) => [o.id, o.full_name]));

  return (
    <main id="main" className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:py-16">
      <header className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Team only</span>
        <h1 className="text-2xl font-semibold tracking-tight">Rooms waiting for review</h1>
        <p className="text-sm text-muted-foreground">
          Check the permit and call the owner before you approve. Approving
          makes the room visible to students.
        </p>
      </header>

      {notice && (
        <p role="status" className="alert-success">
          {notice}
        </p>
      )}
      {(error || loadError) && (
        <p role="alert" className="alert-error">
          {error ?? "We could not load the rooms waiting for review. Please refresh and try again."}
        </p>
      )}

      {rows.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Nothing is waiting for review.
          </CardContent>
        </Card>
      ) : (
        rows.map((row) => {
          const room = row.listings;
          return (
            <Card key={room.id}>
              <CardHeader>
                <CardTitle className="text-base leading-snug">{room.description}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <span className="font-medium">₱{Number(room.price_per_month).toLocaleString()} / month</span>
                  <span className="text-muted-foreground">{Number(room.distance_km)} km from PHINMA UI</span>
                </div>

                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-[var(--radius)] border border-border p-3 text-sm">
                  <dt className="text-muted-foreground">Posted by</dt>
                  <dd>{ownerName.get(room.owner_id) || "(no name)"}</dd>
                  <dt className="text-muted-foreground">Address</dt>
                  <dd className="break-words">{room.address ?? "(none)"}</dd>
                  <dt className="text-muted-foreground">Phone to call</dt>
                  <dd>
                    <a href={`tel:${room.contact_phone.replace(/\s+/g, "")}`} className="underline underline-offset-4">
                      {room.contact_phone}
                    </a>
                  </dd>
                  <dt className="text-muted-foreground">Permit number</dt>
                  <dd className="font-medium">{row.permit_number}</dd>
                  <dt className="text-muted-foreground">Owner or caretaker</dt>
                  <dd className="capitalize">{row.owner_or_caretaker}</dd>
                  <dt className="text-muted-foreground">Open beds</dt>
                  <dd>{row.open_beds}</dd>
                </dl>

                <form action={reviewRoom} className="flex flex-wrap gap-3">
                  <input type="hidden" name="listing_id" value={room.id} />
                  <Button type="submit" name="decision" value="approved">
                    Approve
                  </Button>
                  <Button type="submit" name="decision" value="rejected" variant="outline">
                    Reject
                  </Button>
                </form>
              </CardContent>
            </Card>
          );
        })
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Other rooms</h2>
        <p className="text-sm text-muted-foreground">
          Rooms already approved or rejected. Delete spam, mistakes and test
          rooms here.
        </p>
        {otherRooms.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No other rooms.
            </CardContent>
          </Card>
        ) : (
          otherRooms.map((room) => (
            <Card key={room.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <CardTitle className="text-base leading-snug">{room.description}</CardTitle>
                <span className="chip shrink-0 capitalize">
                  {room.approval_status}
                </span>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    ₱{Number(room.price_per_month).toLocaleString()} / month
                  </span>
                  <span>{room.contact_phone}</span>
                  <span>
                    {room.owner_id ? ownerName.get(room.owner_id) || "(no name)" : "(no owner)"}
                  </span>
                </div>
                <DeleteRoomButton action={deleteAnyRoom} listingId={room.id} />
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </main>
  );
}

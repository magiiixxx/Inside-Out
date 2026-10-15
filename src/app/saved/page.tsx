import Link from "next/link";
import { redirect } from "next/navigation";
import { setSaved } from "@/app/saved/actions";
import { Card, CardContent } from "@/components/ui/card";
import { RoomCard, type RoomCardData } from "@/components/room-card";
import { SaveRoomButton } from "@/components/save-room-button";
import { getCurrentUser } from "@/lib/auth";
import { hideCutoff } from "@/lib/listings";
import { errorText, noticeText } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";

// A student's saved rooms. Logged-in students only.

export const dynamic = "force-dynamic";

export default async function SavedRooms({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  // The address carries only short codes; the text comes from our own list.
  const params = await searchParams;
  const notice = noticeText(params.notice);
  const error = errorText(params.error);

  const supabase = await createClient();
  const { user, role, fullName } = await getCurrentUser();
  if (!user) redirect("/login");
  // Owners and admins have their own home page.
  if (role !== "student") redirect("/owner");

  // A student reads only their own favorites (Row Level Security). The
  // joined room must still be visible to students, so a saved room that was
  // hidden (not updated for 7 days) or deleted simply does not show. It
  // comes back by itself if the owner renews it.
  const { data, error: loadError } = await supabase
    .from("favorites")
    .select(
      "created_at, listings!inner(id, description, price_per_month, distance_km, contact_phone, address, photo_path, availability, last_updated_at, rating_avg, rating_count)",
    )
    .eq("listings.approval_status", "approved")
    .gt("listings.last_updated_at", hideCutoff())
    .order("created_at", { ascending: false });

  if (loadError) console.error("Saved: could not load favorites:", loadError.message);

  const rooms = ((data ?? []) as unknown as { listings: RoomCardData }[]).map(
    (row) => row.listings,
  );

  return (
    <main id="main" className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-4 py-8 sm:px-8 sm:py-12">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Saved rooms</span>
          <h1 className="text-2xl font-semibold tracking-tight">
            Hello, {fullName || user.email}
          </h1>
        </div>
      </header>

      {notice && (
        <p role="status" className="alert-success">
          {notice}
        </p>
      )}
      {(error || loadError) && (
        <p role="alert" className="alert-error">
          {error ?? "We could not load your saved rooms. Please refresh and try again."}
        </p>
      )}

      <p className="text-sm text-muted-foreground">
        Call the owner to see a room and to arrange payment in person. Rooms
        that are hidden or removed do not show here.
      </p>

      {rooms.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            You have not saved any rooms yet. Browse the rooms and tap Save on
            the ones you like.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room}>
              <SaveRoomButton action={setSaved} listingId={room.id} saved back="/saved" />
            </RoomCard>
          ))}
        </div>
      )}

      <Link href="/" className="text-sm text-muted-foreground underline underline-offset-4">
        ← Find more rooms
      </Link>
    </main>
  );
}

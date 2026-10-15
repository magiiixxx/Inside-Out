import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/auth/actions";
import { deleteRoom, renewRoom, setAvailability } from "@/app/owner/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { DeleteRoomButton } from "@/components/delete-room-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HIDE_AFTER_DAYS } from "@/lib/listings";
import { errorText, noticeText } from "@/lib/messages";
import { FREE_ROOM_LIMIT, isAtRoomLimit, PLAN_NAMES, type Plan } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

// The owner's home page: their rooms, each with a status badge, and the
// buttons that keep a room honest (available/occupied, renew).

type Room = {
  id: string;
  description: string;
  price_per_month: number;
  distance_km: number;
  availability: "available" | "occupied";
  approval_status: "pending" | "approved" | "rejected";
  last_updated_at: string;
};

const STATUS: Record<Room["approval_status"], { label: string; className: string }> = {
  pending: {
    label: "Pending approval",
    className: "chip chip-sun",
  },
  approved: {
    label: "Approved",
    className: "chip chip-ok",
  },
  rejected: {
    label: "Rejected",
    className: "chip chip-alert",
  },
};

// The database hides a room from students HIDE_AFTER_DAYS after it was last
// updated (see src/lib/listings.ts). We warn the owner this many days before.
const WARN_WITHIN_DAYS = 2;
const DAY_MS = 86_400_000;

// Where a room stands in the 7-day clock. Only approved rooms are
// ever shown to students, so only they can be "hidden" or "hiding soon".
function freshness(room: Room) {
  const daysOld = (Date.now() - new Date(room.last_updated_at).getTime()) / DAY_MS;
  const daysLeft = HIDE_AFTER_DAYS - daysOld;
  return {
    hidden: room.approval_status === "approved" && daysLeft <= 0,
    soon:
      room.approval_status === "approved" &&
      daysLeft > 0 &&
      daysLeft <= WARN_WITHIN_DAYS,
    daysLeft: Math.max(0, Math.ceil(daysLeft)),
    daysOld: Math.floor(daysOld),
  };
}

export default async function OwnerHome({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  // The address carries only short codes; the text comes from our own list.
  const params = await searchParams;
  const message = noticeText(params.notice);
  const error = errorText(params.error);
  const supabase = await createClient();

  // The real login check. getUser() asks Supabase to verify the session,
  // so it cannot be faked with a fake cookie. (The proxy only refreshes
  // sessions; it is not the lock.)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Row Level Security means this query can only ever return our own row.
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, plan")
    .eq("id", user.id)
    .maybeSingle();

  // Students have their own page. (The database also stops them posting.)
  if (profile?.role === "student") redirect("/saved");

  // Why .eq("owner_id", ...)? Everyone may read approved rooms, so without
  // this filter an owner would also see OTHER owners' approved rooms here.
  const { data: rooms } = await supabase
    .from("listings")
    .select(
      "id, description, price_per_month, distance_km, availability, approval_status, last_updated_at",
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const name = profile?.full_name || user.email;
  const myRooms = (rooms ?? []) as Room[];
  const hiddenCount = myRooms.filter((r) => freshness(r).hidden).length;
  const soonCount = myRooms.filter((r) => freshness(r).soon).length;

  // The Free plan allows one room. (The database enforces it; this only
  // decides what to show.)
  const plan = (profile?.plan ?? "free") as Plan;
  const atLimit = isAtRoomLimit(profile?.role, plan, myRooms.length);

  return (
    <main id="main" className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:py-16">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Owner home</span>
          <h1 className="text-2xl font-semibold tracking-tight">Hello, {name}</h1>
          {profile?.role !== "admin" && (
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="chip chip-teal">{PLAN_NAMES[plan]} plan</span>
              {plan === "free"
                ? `${myRooms.length} of ${FREE_ROOM_LIMIT} room used`
                : "Post as many rooms as you need"}
              <Link href="/pricing" className="underline underline-offset-4">
                See plans
              </Link>
            </p>
          )}
        </div>
        <form action={logout}>
          <Button type="submit" variant="outline">
            Log out
          </Button>
        </form>
      </header>

      {/* Only admins see this link. It is a convenience, not the lock: the
          review page and the database check the admin role themselves. */}
      {profile?.role === "admin" && (
        <Link
          href="/review-desk"
          className="rounded-[var(--radius)] border border-border px-3 py-2 text-sm font-medium underline-offset-4 hover:underline"
        >
          Team review: rooms waiting for approval →
        </Link>
      )}

      {message && (
        <p role="status" className="alert-success">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="alert-error">
          {error}
        </p>
      )}

      {hiddenCount > 0 && (
        <p role="alert" className="alert-error">
          {hiddenCount === 1 ? "1 of your rooms is" : `${hiddenCount} of your rooms are`}{" "}
          <strong>hidden from students</strong> because you have not updated{" "}
          {hiddenCount === 1 ? "it" : "them"} for {HIDE_AFTER_DAYS} days. Press
          Renew to show {hiddenCount === 1 ? "it" : "them"} again.
        </p>
      )}
      {soonCount > 0 && (
        <p role="alert" className="alert-warning">
          {soonCount === 1 ? "1 of your rooms will" : `${soonCount} of your rooms will`}{" "}
          be hidden from students soon. Press Renew to keep{" "}
          {soonCount === 1 ? "it" : "them"} visible.
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium">Your rooms</h2>
        {atLimit ? (
          <Link href="/pricing" className={buttonVariants({ variant: "secondary" })}>
            Upgrade to add more rooms
          </Link>
        ) : (
          <Link href="/owner/rooms/new" className={buttonVariants()}>
            Add a room
          </Link>
        )}
      </div>

      {atLimit && (
        <p className="alert-info">
          The Free plan allows {FREE_ROOM_LIMIT} room. To post another, delete
          this one or ask our team about the Premium Owner plan.
        </p>
      )}

      {myRooms.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            You have no rooms yet. Tap &ldquo;Add a room&rdquo; to post your first one.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {myRooms.map((room) => {
            const status = STATUS[room.approval_status];
            const fresh = freshness(room);
            const isApproved = room.approval_status === "approved";
            const isAvailable = room.availability === "available";
            return (
              <Card key={room.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <CardTitle className="text-base leading-snug">{room.description}</CardTitle>
                  <span className={`shrink-0 ${status.className}`}>
                    {status.label}
                  </span>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      ₱{Number(room.price_per_month).toLocaleString()} / month
                    </span>
                    <span>{Number(room.distance_km)} km from PHINMA UI</span>
                    <span className="font-medium text-foreground">
                      {isAvailable ? "Available" : "Occupied"}
                    </span>
                  </div>

                  {isApproved && (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {fresh.hidden
                          ? "Hidden from students. Last confirmed " + fresh.daysOld + " days ago."
                          : fresh.soon
                            ? `Hides from students in ${fresh.daysLeft} ${fresh.daysLeft === 1 ? "day" : "days"} unless you renew.`
                            : "Visible to students."}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <form action={setAvailability}>
                          <input type="hidden" name="listing_id" value={room.id} />
                          <input
                            type="hidden"
                            name="availability"
                            value={isAvailable ? "occupied" : "available"}
                          />
                          <Button type="submit" variant="outline">
                            {isAvailable ? "Mark as occupied" : "Mark as available"}
                          </Button>
                        </form>
                        <form action={renewRoom}>
                          <input type="hidden" name="listing_id" value={room.id} />
                          <Button type="submit" variant={fresh.hidden || fresh.soon ? "default" : "outline"}>
                            Renew
                          </Button>
                        </form>
                      </div>
                    </>
                  )}

                  <Link
                    href={`/owner/rooms/${room.id}/edit`}
                    className={buttonVariants({ variant: "secondary", size: "sm" }) + " w-fit"}
                  >
                    Edit room
                  </Link>

                  <DeleteRoomButton action={deleteRoom} listingId={room.id} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Link href="/" className="text-sm text-muted-foreground underline underline-offset-4">
        See what students see →
      </Link>
    </main>
  );
}

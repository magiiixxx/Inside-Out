import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/auth/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

// The owner's home page: their rooms, each with a status badge. Ticket 07
// adds the available/occupied and renew buttons.

type Room = {
  id: string;
  description: string;
  price_per_month: number;
  distance_km: number;
  availability: "available" | "occupied";
  approval_status: "pending" | "approved" | "rejected";
};

const STATUS: Record<Room["approval_status"], { label: string; className: string }> = {
  pending: {
    label: "Pending approval",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  approved: {
    label: "Approved",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  rejected: {
    label: "Rejected",
    className: "border-destructive/50 bg-destructive/10 text-destructive",
  },
};

export default async function OwnerHome({
  searchParams,
}: {
  searchParams: Promise<{ posted?: string }>;
}) {
  const { posted } = await searchParams;
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
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  // Why .eq("owner_id", ...)? Everyone may read approved rooms, so without
  // this filter an owner would also see OTHER owners' approved rooms here.
  const { data: rooms } = await supabase
    .from("listings")
    .select("id, description, price_per_month, distance_km, availability, approval_status")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const name = profile?.full_name || user.email;
  const myRooms = (rooms ?? []) as Room[];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:py-16">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Owner home</span>
          <h1 className="text-2xl font-semibold tracking-tight">Hello, {name}</h1>
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

      {posted && (
        <p role="status" className="rounded-[var(--radius)] border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm">
          Room submitted. Our team will check it before students can see it.
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium">Your rooms</h2>
        <Link href="/owner/rooms/new" className={buttonVariants()}>
          Add a room
        </Link>
      </div>

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
            return (
              <Card key={room.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <CardTitle className="text-base leading-snug">{room.description}</CardTitle>
                  <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                    {status.label}
                  </span>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    ₱{Number(room.price_per_month).toLocaleString()} / month
                  </span>
                  <span>{Number(room.distance_km)} km from PHINMA UI</span>
                  <span>{room.availability === "available" ? "Available" : "Occupied"}</span>
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

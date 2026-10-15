import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

// Ticket 02: proves the live site can read from Supabase. Ticket 03 turns
// this into the real Browse screen.
//
// This is a server component: it runs on the server, so the database
// query happens before the page reaches the phone. Row Level Security
// decides which rows come back — we do not filter approved/stale rooms
// here, the database does it.

// Render on every visit. Without this, Next.js can build the page once and
// reuse it, so a room marked "occupied" would keep showing as available.
export const dynamic = "force-dynamic";

type Listing = {
  id: string;
  description: string;
  price_per_month: number;
  distance_km: number;
  availability: "available" | "occupied";
};

async function getListings(): Promise<{ rooms: Listing[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("listings")
      .select("id, description, price_per_month, distance_km, availability")
      .order("distance_km", { ascending: true });

    if (error) return { rooms: [], error: error.message };
    return { rooms: (data ?? []) as Listing[] };
  } catch (e) {
    return {
      rooms: [],
      error: e instanceof Error ? e.message : "Could not reach the database.",
    };
  }
}

export default async function Home() {
  const { rooms, error } = await getListings();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-12 sm:py-20">
      <header className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
          Near PHINMA UI
        </span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          BahayFind
        </h1>
        <p className="text-base text-muted-foreground">
          Boarding house rooms that owners confirm are available.
        </p>
      </header>

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
            No rooms to show yet.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {rooms.map((room) => (
            <Card key={room.id}>
              <CardHeader>
                <CardTitle className="text-base">{room.description}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <span>₱{Number(room.price_per_month).toLocaleString()} / month</span>
                <span>{Number(room.distance_km)} km from PHINMA UI</span>
                <span className="font-medium text-foreground">
                  {room.availability === "available" ? "Available" : "Occupied"}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

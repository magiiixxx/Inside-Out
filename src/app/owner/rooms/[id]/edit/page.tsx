import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { editRoom } from "@/app/owner/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoomDetailsFields } from "@/components/room-details-fields";
import { getUserAndRole } from "@/lib/auth";
import { errorText } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";

// Edit one of the owner's own rooms.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditRoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const error = errorText((await searchParams).error);

  const supabase = await createClient();
  const { user, role } = await getUserAndRole(supabase);
  if (!user) redirect("/login");
  if (role === "student") redirect("/saved");

  // Only our own room can be loaded: the query asks for our id, and Row
  // Level Security allows owners to read their own rooms. Anything else
  // (a bad id, or someone else's room) is simply "not found".
  if (!UUID.test(id)) notFound();
  const { data: room } = await supabase
    .from("listings")
    .select("id, description, price_per_month, distance_km, contact_phone, address, approval_status")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!room) notFound();

  return (
    <main id="main" className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10 sm:py-16">
      <Link href="/owner" className="text-sm text-muted-foreground underline underline-offset-4">
        ← Back to owner home
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Edit your room</CardTitle>
          <p className="text-sm text-muted-foreground">
            Changing only the <strong>price</strong> takes effect straight
            away. Changing the description, distance, address or phone number
            sends the room back to our team to check again, and students
            will not see it until it is approved.
          </p>
        </CardHeader>
        <CardContent>
          <form action={editRoom} className="flex flex-col gap-5">
            <input type="hidden" name="listing_id" value={room.id} />

            {error && (
              <p role="alert" className="alert-error">
                {error}
              </p>
            )}
            {room.approval_status === "rejected" && (
              <p className="alert-warning">
                Our team rejected this room. Fix it and save, and it will be
                sent for review again.
              </p>
            )}

            <RoomDetailsFields defaults={room} />

            <Button type="submit" size="lg">
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

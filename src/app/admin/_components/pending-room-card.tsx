import { reviewRoom } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { photoUrl } from "@/lib/photos";
import { telHref } from "@/lib/utils";
import type { OwnerNames, PendingCheck } from "./types";

// A room waiting for the team: its details, the private permit check, and the
// Approve and Reject buttons. Rejecting needs a reason the owner will read.

export function PendingRoomCard({ row, ownerName }: { row: PendingCheck; ownerName: OwnerNames }) {
  const room = row.listings;
  const photo = photoUrl(room.photo_path);
  return (
    <Card className="max-w-3xl overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg leading-snug">{room.description}</CardTitle>
        <p className="price">
          ₱{Number(room.price_per_month).toLocaleString()}
          <small> / month · {Number(room.distance_km)} km from PHINMA UI</small>
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element -- stored in Supabase Storage
          <img src={photo} alt="Photo uploaded by the owner" loading="lazy" className="h-56 w-full rounded-xl object-cover" />
        )}
        <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 rounded-xl bg-surface p-4 text-sm">
          <dt className="text-muted-foreground">Posted by</dt>
          <dd className="font-semibold">{ownerName.get(room.owner_id) || "(no name)"}</dd>
          <dt className="text-muted-foreground">Address</dt>
          <dd className="break-words">{room.address ?? "(none)"}</dd>
          <dt className="text-muted-foreground">Phone to call</dt>
          <dd>
            <a href={telHref(room.contact_phone)}>{room.contact_phone}</a>
          </dd>
          <dt className="text-muted-foreground">Permit number</dt>
          <dd className="font-bold">{row.permit_number}</dd>
          <dt className="text-muted-foreground">Owner or caretaker</dt>
          <dd className="capitalize">{row.owner_or_caretaker}</dd>
          <dt className="text-muted-foreground">Open beds</dt>
          <dd>{row.open_beds}</dd>
        </dl>

        <div className="flex flex-col gap-4">
          <form action={reviewRoom}>
            <input type="hidden" name="listing_id" value={room.id} />
            <input type="hidden" name="decision" value="approved" />
            <Button type="submit" variant="accent">
              Approve
            </Button>
          </form>
          <form action={reviewRoom} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <input type="hidden" name="listing_id" value={room.id} />
            <input type="hidden" name="decision" value="rejected" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor={`reason-${room.id}`}>Reason for rejecting (the owner will read this)</Label>
              <Input
                id={`reason-${room.id}`}
                name="reason"
                minLength={5}
                maxLength={300}
                required
                placeholder="e.g. The phone number did not answer"
              />
            </div>
            <Button type="submit" variant="outline">
              Reject
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

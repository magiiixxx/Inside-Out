import { deleteAnyRoom, resetRatings } from "@/app/admin/actions";
import { DeleteRoomButton } from "@/components/delete-room-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OtherRoom, OwnerNames } from "./types";

// A room the team has already decided on. From here the team can delete it
// (spam, mistakes, test rooms) or reset its star ratings.

export function OtherRoomCard({ room, ownerName }: { room: OtherRoom; ownerName: OwnerNames }) {
  return (
    <Card className="max-w-3xl">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <CardTitle className="text-base leading-snug">{room.description}</CardTitle>
        <span className={`chip shrink-0 capitalize ${room.approval_status === "approved" ? "chip-ok" : "chip-alert"}`}>
          {room.approval_status}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <span className="font-bold text-foreground">₱{Number(room.price_per_month).toLocaleString()} / month</span>
          <span>{room.contact_phone}</span>
          <span>{room.owner_id ? ownerName.get(room.owner_id) || "(no name)" : "(no owner)"}</span>
        </div>
        {room.rating_count > 0 && (
          <form action={resetRatings} className="flex flex-wrap items-center gap-3 text-sm">
            <input type="hidden" name="listing_id" value={room.id} />
            <span className="text-muted-foreground">
              {room.rating_count} {room.rating_count === 1 ? "rating" : "ratings"}
            </span>
            <Button type="submit" variant="outline" size="sm">
              Reset ratings
            </Button>
          </form>
        )}
        <DeleteRoomButton action={deleteAnyRoom} listingId={room.id} />
      </CardContent>
    </Card>
  );
}

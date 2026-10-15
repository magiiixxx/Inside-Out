import { Button } from "@/components/ui/button";

// Save or remove a room. Shows "Saved" when the room is already saved, and
// pressing it then removes it. `back` is where to return afterwards (the
// server checks it, so it cannot be used to send someone to another site).

export function SaveRoomButton({
  action,
  listingId,
  saved,
  back,
}: {
  action: (formData: FormData) => void | Promise<void>;
  listingId: string;
  saved: boolean;
  back: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="listing_id" value={listingId} />
      <input type="hidden" name="save" value={saved ? "0" : "1"} />
      <input type="hidden" name="back" value={back} />
      <Button
        type="submit"
        size="sm"
        variant={saved ? "secondary" : "outline"}
        aria-label={saved ? "Remove from saved rooms" : "Save this room"}
      >
        {saved ? "Saved ✓" : "Save"}
      </Button>
    </form>
  );
}

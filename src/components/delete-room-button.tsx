import { Button } from "@/components/ui/button";

// A two-step delete: the first click only opens the question, so nobody
// deletes a room by accident. It uses the browser's built-in <details>
// element, so it needs no JavaScript.

export function DeleteRoomButton({
  action,
  listingId,
}: {
  action: (formData: FormData) => void | Promise<void>;
  listingId: string;
}) {
  return (
    <details>
      <summary className="w-fit cursor-pointer text-sm text-muted-foreground underline underline-offset-4">
        Delete this room
      </summary>
      <form
        action={action}
        className="mt-3 flex flex-col gap-3 rounded-[var(--radius)] border border-destructive/50 p-3"
      >
        <input type="hidden" name="listing_id" value={listingId} />
        <p className="text-sm">
          Delete this room? This cannot be undone, and students will no longer
          see it.
        </p>
        <Button type="submit" variant="destructive" size="sm" className="w-fit">
          Yes, delete this room
        </Button>
      </form>
    </details>
  );
}

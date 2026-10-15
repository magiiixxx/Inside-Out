import { reportRoom } from "@/app/rooms/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { REPORT_REASONS } from "@/lib/reports";

// "Report a problem" on a room card. The first click only opens the form
// (the browser's built-in <details> element, so no JavaScript is needed).

export function ReportRoom({ listingId, back }: { listingId: string; back: string }) {
  return (
    <details>
      <summary className="w-fit cursor-pointer text-sm text-muted-foreground underline underline-offset-4">
        Report a problem with this room
      </summary>
      <form action={reportRoom} className="mt-3 flex flex-col gap-3 rounded-xl border border-line p-3">
        <input type="hidden" name="listing_id" value={listingId} />
        <input type="hidden" name="back" value={back} />
        <fieldset className="flex flex-col gap-1.5">
          <legend className="label mb-1">What is wrong?</legend>
          {REPORT_REASONS.map((reason, n) => (
            <label key={reason.value} className="flex items-center gap-2 text-sm">
              <input type="radio" name="reason" value={reason.value} required defaultChecked={n === 0} />
              {reason.label}
            </label>
          ))}
        </fieldset>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`note-${listingId}`}>More detail (optional)</Label>
          <Input id={`note-${listingId}`} name="note" maxLength={200} placeholder="e.g. Nobody answers the phone" />
        </div>
        <Button type="submit" size="sm" variant="outline" className="w-fit">
          Send report
        </Button>
      </form>
    </details>
  );
}

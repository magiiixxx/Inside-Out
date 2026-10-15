import { rateRoom } from "@/app/rooms/actions";

// Five star buttons. Pressing one saves that rating (or changes it). "mine" is
// the stars this student already gave, shown filled. It uses a plain form, so
// it needs no JavaScript. Only shown for a room the student has saved (the
// database insists on it too).

export function RateRoom({
  listingId,
  mine,
  back,
}: {
  listingId: string;
  mine: number | null;
  back: string;
}) {
  return (
    <form action={rateRoom} className="flex flex-wrap items-center gap-x-2">
      <input type="hidden" name="listing_id" value={listingId} />
      <input type="hidden" name="back" value={back} />
      <span className="text-sm font-semibold text-muted-foreground">
        {mine ? "Your rating" : "Rate this room"}
      </span>
      <span className="flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="submit"
            name="stars"
            value={n}
            aria-label={`Rate ${n} out of 5 stars`}
            className={`flex h-11 w-10 items-center justify-center rounded-md text-3xl leading-none hover:bg-navy-soft ${
              mine !== null && n <= mine ? "text-amber-text" : "text-[#68788f]"
            }`}
          >
            {mine !== null && n <= mine ? "\u2605" : "\u2606"}
          </button>
        ))}
      </span>
    </form>
  );
}

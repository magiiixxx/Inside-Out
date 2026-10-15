import { rateRoom } from "@/app/rooms/actions";

// Five star buttons. Pressing one saves that rating (or changes it). "mine" is
// the stars this student already gave, shown filled. It uses a plain form, so
// it needs no JavaScript.

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
    <form action={rateRoom} className="flex items-center gap-1">
      <input type="hidden" name="listing_id" value={listingId} />
      <input type="hidden" name="back" value={back} />
      <span className="mr-1 text-sm font-semibold text-muted-foreground">
        {mine ? "Your rating" : "Rate this room"}
      </span>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="submit"
          name="stars"
          value={n}
          aria-label={`Rate ${n} out of 5 stars`}
          className={`flex h-9 w-8 items-center justify-center rounded-md text-2xl leading-none hover:bg-navy-soft ${
            mine !== null && n <= mine ? "text-amber-text" : "text-[#68788f]"
          }`}
        >
          {mine !== null && n <= mine ? "★" : "☆"}
        </button>
      ))}
    </form>
  );
}

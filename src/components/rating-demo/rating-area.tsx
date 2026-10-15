"use client";

import { DemoRating } from "./demo-rating";
import { useDemoMode } from "./demo-mode";

// The rating spot on a room card, beside the price:
//   - a room with REAL ratings always shows its real average and count;
//   - a room with none shows "No ratings yet", as before;
//   - only while demo mode is on, a room with none shows the star preview instead.
// Real ratings are never replaced by the demo.

export function RatingArea({ count, average }: { count: number; average: number | null }) {
  const demo = useDemoMode();

  if (count > 0 && average !== null) {
    return (
      <p className="shrink-0 text-sm font-bold" aria-label={`Rated ${average} out of 5 by ${count} students`}>
        <span className="text-amber-text">★</span> {Number(average).toFixed(1)}
        <span className="font-medium text-muted-foreground"> ({count})</span>
      </p>
    );
  }

  return demo ? <DemoRating /> : <p className="shrink-0 text-sm text-muted-foreground">No ratings yet</p>;
}

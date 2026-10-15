import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updatedLabel } from "@/lib/listings";

// One room as a student sees it. Used by the Browse page and the Saved
// rooms page, so a room always looks the same. Anything passed as
// `children` (like a Save button) is shown at the bottom of the card.

export type RoomCardData = {
  id: string;
  description: string;
  price_per_month: number;
  distance_km: number;
  contact_phone: string;
  availability: "available" | "occupied";
  last_updated_at: string;
};

export function RoomCard({
  room,
  children,
}: {
  room: RoomCardData;
  children?: ReactNode;
}) {
  const isAvailable = room.availability === "available";
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <CardTitle className="text-base leading-snug">{room.description}</CardTitle>
        <span
          className={
            isAvailable
              ? "shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
              : "shrink-0 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
          }
        >
          {isAvailable ? "Available" : "Occupied"}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span className="font-medium">
            ₱{Number(room.price_per_month).toLocaleString()} / month
          </span>
          <span className="text-muted-foreground">
            {Number(room.distance_km)} km from PHINMA UI
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>{updatedLabel(room.last_updated_at)}</span>
          <a
            href={`tel:${room.contact_phone.replace(/\s+/g, "")}`}
            className="font-medium text-foreground underline underline-offset-4"
          >
            Call {room.contact_phone}
          </a>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

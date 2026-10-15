import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClockIcon, PhoneIcon, PinIcon } from "@/components/icons";
import { updatedLabel } from "@/lib/listings";

// One room as a student sees it. Used by the Browse page and the Saved
// rooms page, so a room always looks the same. Anything passed as
// `children` (like a Save button) is shown next to the Call button.
//
// What a student decides on comes first: the price, then whether it is
// available. The Call button is the main action.

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
    <Card className="flex h-full flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-2xl font-semibold tracking-tight">
          ₱{Number(room.price_per_month).toLocaleString()}
          <span className="text-sm font-normal text-muted-foreground"> / month</span>
        </p>
        <span
          className={
            isAvailable
              ? "shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
              : "shrink-0 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
          }
        >
          {isAvailable ? "Available" : "Occupied"}
        </span>
      </div>

      <p className="break-words text-base leading-snug">{room.description}</p>

      <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
        <li className="flex items-center gap-2">
          <PinIcon className="h-4 w-4 shrink-0" />
          {Number(room.distance_km)} km from PHINMA UI
        </li>
        <li className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 shrink-0" />
          {updatedLabel(room.last_updated_at)}
        </li>
      </ul>

      <div className="mt-auto flex flex-wrap items-center gap-3 pt-1">
        <a
          href={`tel:${room.contact_phone.replace(/\s+/g, "")}`}
          className={buttonVariants({ size: "sm", variant: isAvailable ? "default" : "outline" })}
        >
          <PhoneIcon className="h-4 w-4" />
          Call {room.contact_phone}
        </a>
        {children}
      </div>
    </Card>
  );
}

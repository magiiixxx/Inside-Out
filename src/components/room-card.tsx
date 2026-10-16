import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { ClockIcon, HouseIcon, MessageIcon, PhoneIcon, PinIcon } from "@/components/icons";
import { ExpandableText } from "@/components/expandable-text";
import { RatingArea } from "@/components/rating-demo/rating-area";
import { updatedLabel } from "@/lib/listings";
import { telHref } from "@/lib/utils";
import { photoUrl } from "@/lib/photos";

// One room as a student sees it. Used by the Browse page and the Saved
// rooms page, so a room always looks the same. Anything passed as
// `children` (like a Save button) is shown next to the Call button.
//
// What a student decides on comes first: whether it is available (the badge
// on the picture), then the price. The Call button is the main action.
// A room without a photo gets a simple drawing of a house instead.

export type RoomCardData = {
  id: string;
  description: string;
  price_per_month: number;
  distance_km: number;
  contact_phone: string;
  address: string | null; // rooms posted before addresses existed have none
  photo_path: string | null; // optional; without one we draw a house
  rating_avg: number | null; // null until a student rates the room
  rating_count: number;
  availability: "available" | "occupied";
  last_updated_at: string;
};

// Three soft tints (room-tint-0, 1 and 2 in globals.css), picked from the
// room's id so a room keeps its colour, in light and dark mode.
const TINT_COUNT = 3;

export function RoomCard({
  room,
  children,
  footer,
  messageHref,
}: {
  room: RoomCardData;
  children?: ReactNode; // buttons next to Call (like Save)
  footer?: ReactNode; // anything wider, under the buttons (rate, report)
  messageHref?: string | null; // where "Message owner" leads; no button when left out
}) {
  const isAvailable = room.availability === "available";
  const tint = room.id.charCodeAt(0) % TINT_COUNT;
  const src = photoUrl(room.photo_path);
  return (
    <article className="card lift flex h-full flex-col overflow-hidden">
      <div
        className={`rt-bg room-tint-${tint} relative flex h-44 items-end justify-center overflow-hidden`}
      >
        <span className={`absolute left-3.5 top-3.5 ${isAvailable ? "badge-available" : "badge-full"}`}>
          {isAvailable ? "Available" : "Occupied"}
        </span>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- the photo is stored in Supabase Storage
          <img src={src} alt="Photo of the room" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <svg width="150" height="110" viewBox="0 0 220 150" aria-hidden="true">
            <rect x="30" y="30" width="160" height="120" className="rt-wall" />
            <rect x="50" y="48" width="26" height="24" className="rt-window" />
            <rect x="97" y="48" width="26" height="24" className="rt-window" />
            <rect x="144" y="48" width="26" height="24" className="rt-window" />
            <rect x="95" y="100" width="30" height="50" className="rt-door" />
          </svg>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <ExpandableText text={room.description} className="text-base font-semibold leading-snug" />

        <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          {room.address && (
            <li className="flex items-start gap-2">
              <HouseIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="break-words">{room.address}</span>
            </li>
          )}
          <li className="flex items-center gap-2">
            <PinIcon className="h-4 w-4 shrink-0" />
            {Number(room.distance_km)} km from PHINMA UI
          </li>
          <li className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 shrink-0" />
            {updatedLabel(room.last_updated_at)}
          </li>
        </ul>

        <div className="mt-auto flex flex-col gap-4 border-t border-line pt-4">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <p className="price">
              ₱{Number(room.price_per_month).toLocaleString()}
              <small> / month</small>
            </p>
            <RatingArea count={room.rating_count} average={room.rating_avg} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={telHref(room.contact_phone)}
              className={buttonVariants({ size: "sm", variant: isAvailable ? "default" : "outline" })}
            >
              <PhoneIcon className="h-4 w-4" />
              Call {room.contact_phone}
            </a>
            {messageHref && (
              <Link href={messageHref} className={buttonVariants({ size: "sm", variant: "outline" })}>
                <MessageIcon className="h-4 w-4" />
                Message owner
              </Link>
            )}
            {children}
          </div>
          {footer}
        </div>
      </div>
    </article>
  );
}

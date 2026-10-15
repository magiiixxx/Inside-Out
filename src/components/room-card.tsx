import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { ClockIcon, HouseIcon, PhoneIcon, PinIcon } from "@/components/icons";
import { updatedLabel } from "@/lib/listings";
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
  availability: "available" | "occupied";
  last_updated_at: string;
};

// Three soft tints, picked from the room's id so a room keeps its colour.
const TINTS = [
  { bg: "#dde7f2", wall: "#a9bdd3" },
  { bg: "#e6edf4", wall: "#b4c4d6" },
  { bg: "#dce8e6", wall: "#a8c2be" },
];

export function RoomCard({
  room,
  children,
}: {
  room: RoomCardData;
  children?: ReactNode;
}) {
  const isAvailable = room.availability === "available";
  const tint = TINTS[room.id.charCodeAt(0) % TINTS.length];
  const src = photoUrl(room.photo_path);
  return (
    <article className="card lift flex h-full flex-col overflow-hidden">
      <div
        className="relative flex h-44 items-end justify-center overflow-hidden"
        style={{ background: tint.bg }}
      >
        <span className={`absolute left-3.5 top-3.5 ${isAvailable ? "badge-available" : "badge-full"}`}>
          {isAvailable ? "Available" : "Occupied"}
        </span>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- the photo is stored in Supabase Storage
          <img src={src} alt="Photo of the room" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <svg width="150" height="110" viewBox="0 0 220 150" aria-hidden="true">
            <rect x="30" y="30" width="160" height="120" fill={tint.wall} />
            <rect x="50" y="48" width="26" height="24" fill={tint.bg} />
            <rect x="97" y="48" width="26" height="24" fill={tint.bg} />
            <rect x="144" y="48" width="26" height="24" fill={tint.bg} />
            <rect x="95" y="100" width="30" height="50" fill="#0f2d52" />
          </svg>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <h3 className="break-words text-[1.0625rem] font-bold leading-snug">{room.description}</h3>

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
          <p className="price">
            ₱{Number(room.price_per_month).toLocaleString()}
            <small> / month</small>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`tel:${room.contact_phone.replace(/\s+/g, "")}`}
              className={buttonVariants({ size: "sm", variant: isAvailable ? "default" : "outline" })}
            >
              <PhoneIcon className="h-4 w-4" />
              Call {room.contact_phone}
            </a>
            {children}
          </div>
        </div>
      </div>
    </article>
  );
}

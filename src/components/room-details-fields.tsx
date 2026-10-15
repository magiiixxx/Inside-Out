import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// The fields about a room that students see: description, price, distance,
// phone and address, plus the owner's agreement that the address is public.
// Used by BOTH the "Add a room" form and the "Edit a room" form, so the
// two can never drift apart. Pass `defaults` to pre-fill it for editing.

export type RoomDetailsDefaults = {
  description?: string;
  price_per_month?: number;
  distance_km?: number;
  contact_phone?: string;
  address?: string | null;
};

export function RoomDetailsFields({ defaults }: { defaults?: RoomDetailsDefaults }) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Describe the room</Label>
        <Textarea
          id="description"
          name="description"
          required
          minLength={10}
          maxLength={500}
          defaultValue={defaults?.description}
          placeholder="e.g. Bed space in a room for 4, includes water, 5 minutes walk from the gate"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price_per_month">Price per month (₱)</Label>
          <Input
            id="price_per_month"
            name="price_per_month"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            required
            defaultValue={defaults?.price_per_month}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="distance_km">Distance from PHINMA UI (km)</Label>
          <Input
            id="distance_km"
            name="distance_km"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.1"
            placeholder="e.g. 0.8"
            required
            defaultValue={defaults?.distance_km}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="address">Address (shown to students)</Label>
        <Input
          id="address"
          name="address"
          autoComplete="street-address"
          minLength={5}
          maxLength={200}
          required
          defaultValue={defaults?.address ?? ""}
          placeholder="e.g. 12 Rizal Street, Jaro, Iloilo City"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact_phone">Contact phone (shown to students)</Label>
        <Input
          id="contact_phone"
          name="contact_phone"
          type="tel"
          autoComplete="tel"
          placeholder="e.g. 0917 123 4567"
          required
          defaultValue={defaults?.contact_phone}
        />
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="address_public" required className="mt-0.5 h-4 w-4" />
        <span>I understand the address of this room will be public.</span>
      </label>
    </>
  );
}

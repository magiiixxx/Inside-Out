"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Server actions for the owner's pages. Everything is checked here on the
// server first (the browser's form checks can be skipped by anyone), and
// the database checks again inside its own functions.
//
// redirect() throws a special signal, so it is never inside a try/catch.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function back(error: string): never {
  redirect(`/owner/rooms/new?error=${encodeURIComponent(error)}`);
}

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

export async function postRoom(formData: FormData) {
  const description = text(formData, "description");
  const contactPhone = text(formData, "contact_phone");
  const permitNumber = text(formData, "permit_number");
  const ownerOrCaretaker = text(formData, "owner_or_caretaker");
  const price = Number(text(formData, "price_per_month"));
  const distanceKm = Number(text(formData, "distance_km"));
  const openBeds = Number(text(formData, "open_beds"));
  const canCall = formData.get("can_call") === "on";
  const phonePublic = formData.get("phone_public") === "on";

  if (description.length < 10 || description.length > 500) {
    back("Please describe the room in 10 to 500 characters.");
  }
  if (!Number.isFinite(price) || price <= 0 || price > 100000) {
    back("Please enter a monthly price above 0.");
  }
  if (!Number.isFinite(distanceKm) || distanceKm < 0 || distanceKm > 50) {
    back("Please enter the distance from PHINMA UI in km, for example 0.8.");
  }
  if (!/^[0-9+()\-\s]{7,20}$/.test(contactPhone)) {
    back("Please enter a phone number students can call.");
  }
  if (permitNumber.length === 0 || permitNumber.length > 60) {
    back("Please enter your business permit number.");
  }
  if (ownerOrCaretaker !== "owner" && ownerOrCaretaker !== "caretaker") {
    back("Please say whether you are the owner or a caretaker.");
  }
  if (!Number.isInteger(openBeds) || openBeds < 0 || openBeds > 200) {
    back("Please enter how many beds are open right now.");
  }
  if (!canCall) {
    back("Please agree that our team may call you to confirm the room.");
  }
  if (!phonePublic) {
    back("Please confirm that you understand your phone number will be public.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("post_room", {
    p_description: description,
    p_price_per_month: price,
    p_distance_km: distanceKm,
    p_contact_phone: contactPhone,
    p_permit_number: permitNumber,
    p_owner_or_caretaker: ownerOrCaretaker,
    p_open_beds: openBeds,
    p_can_call: canCall,
    p_phone_public: phonePublic,
  });

  if (error) back(error.message);

  redirect("/owner?posted=1");
}

// Mark one of the owner's rooms available or occupied. Also restarts the
// 7-day clock, because the owner has just confirmed the room's status.
export async function setAvailability(formData: FormData) {
  const listingId = text(formData, "listing_id");
  const availability = text(formData, "availability");

  if (!UUID.test(listingId) || (availability !== "available" && availability !== "occupied")) {
    redirect("/owner?error=" + encodeURIComponent("That request was not valid."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_room_availability", {
    p_listing_id: listingId,
    p_availability: availability,
  });

  if (error) redirect("/owner?error=" + encodeURIComponent(error.message));

  redirect(`/owner?updated=${availability}`);
}

// Renew one of the owner's rooms: "this room is still as listed". Brings a
// hidden room back for students.
export async function renewRoom(formData: FormData) {
  const listingId = text(formData, "listing_id");

  if (!UUID.test(listingId)) {
    redirect("/owner?error=" + encodeURIComponent("That request was not valid."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("renew_room", { p_listing_id: listingId });

  if (error) redirect("/owner?error=" + encodeURIComponent(error.message));

  redirect("/owner?updated=renewed");
}

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Server action for the "Add a room" form. Everything is checked here on
// the server first (the browser's form checks can be skipped by anyone),
// and the database checks it again inside post_room().
//
// redirect() throws a special signal, so it is never inside a try/catch.

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

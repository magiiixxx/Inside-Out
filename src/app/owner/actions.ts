"use server";

import { redirect } from "next/navigation";
import { removePhoto, uploadPhoto } from "@/lib/photos";
import { createClient } from "@/lib/supabase/server";
import { UUID, formText as text } from "@/lib/validation";

// Server actions for the owner's pages. Everything is checked here on the
// server first (the browser's form checks can be skipped by anyone), and
// the database checks again inside its own functions.
//
// On a problem we redirect back with a short CODE, never raw text: the
// page looks the code up in src/lib/messages.ts.
//
// redirect() throws a special signal, so it is never inside a try/catch.

function backToForm(code: string): never {
  redirect(`/owner/rooms/new?error=${code}`);
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
  const address = text(formData, "address");
  const addressPublic = formData.get("address_public") === "on";

  if (description.length < 10 || description.length > 500) backToForm("bad_description");
  if (address.length < 5 || address.length > 200) backToForm("bad_address");
  if (!Number.isFinite(price) || price <= 0 || price > 100000) backToForm("bad_price");
  if (!Number.isFinite(distanceKm) || distanceKm < 0 || distanceKm > 50) backToForm("bad_distance");
  if (!/^[0-9+()\-\s]{7,20}$/.test(contactPhone)) backToForm("bad_phone");
  if (permitNumber.length === 0 || permitNumber.length > 60) backToForm("bad_permit");
  if (ownerOrCaretaker !== "owner" && ownerOrCaretaker !== "caretaker") backToForm("bad_role");
  if (!Number.isInteger(openBeds) || openBeds < 0 || openBeds > 200) backToForm("bad_beds");
  if (!canCall) backToForm("need_call_ok");
  if (!phonePublic) backToForm("need_phone_ok");
  if (!addressPublic) backToForm("need_address_ok");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // The photo is optional. It is uploaded first (into this owner's own
  // folder), and its path is saved with the room.
  const photo = await uploadPhoto(supabase, user.id, formData.get("photo"));
  if (!photo.ok) backToForm(photo.code);

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
    p_address: address,
    p_address_public: addressPublic,
    p_photo_path: photo.path,
  });

  if (error) {
    // The room was not saved, so do not leave its photo behind.
    await removePhoto(supabase, photo.path);
    // The Free plan's room limit gets its own message; any other problem
    // gets the general one (never the raw database text).
    if (error.message.includes("Free plan")) redirect("/owner?error=plan_limit");
    backToForm("post_failed");
  }

  redirect("/owner?notice=posted");
}

// Edit one of the owner's rooms. The database function update_room() decides
// what happens: a price-only change stays live; any other change sends an
// approved room back to our team (see supabase/sql/011). It answers with
// "approved" or "pending", and we tell the owner which one it was.
export async function editRoom(formData: FormData) {
  const listingId = text(formData, "listing_id");
  if (!UUID.test(listingId)) redirect("/owner?error=invalid_request");

  const backToEdit: (code: string) => never = (code) =>
    redirect(`/owner/rooms/${listingId}/edit?error=${code}`);

  const description = text(formData, "description");
  const contactPhone = text(formData, "contact_phone");
  const address = text(formData, "address");
  const price = Number(text(formData, "price_per_month"));
  const distanceKm = Number(text(formData, "distance_km"));
  const addressPublic = formData.get("address_public") === "on";

  if (description.length < 10 || description.length > 500) backToEdit("bad_description");
  if (!Number.isFinite(price) || price <= 0 || price > 100000) backToEdit("bad_price");
  if (!Number.isFinite(distanceKm) || distanceKm < 0 || distanceKm > 50) backToEdit("bad_distance");
  if (!/^[0-9+()\-\s]{7,20}$/.test(contactPhone)) backToEdit("bad_phone");
  if (address.length < 5 || address.length > 200) backToEdit("bad_address");
  if (!addressPublic) backToEdit("need_address_ok");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // The current photo, so a replaced one can be cleaned up afterwards. Only
  // our own room can be read (Row Level Security).
  const { data: current } = await supabase
    .from("listings")
    .select("photo_path")
    .eq("id", listingId)
    .eq("owner_id", user.id)
    .maybeSingle();

  // A new photo is optional. No file chosen means "keep the current photo".
  const photo = await uploadPhoto(supabase, user.id, formData.get("photo"));
  if (!photo.ok) backToEdit(photo.code);

  const { data, error } = await supabase.rpc("update_room", {
    p_listing_id: listingId,
    p_description: description,
    p_price_per_month: price,
    p_distance_km: distanceKm,
    p_contact_phone: contactPhone,
    p_address: address,
    p_address_public: addressPublic,
    p_photo_path: photo.path,
  });

  if (error) {
    await removePhoto(supabase, photo.path);
    backToEdit("edit_failed");
  }

  // Saved: the old photo is no longer used.
  if (photo.path) await removePhoto(supabase, current?.photo_path);

  redirect(data === "pending" ? "/owner?notice=edited_review" : "/owner?notice=edited_live");
}

// Mark one of the owner's rooms available or occupied. Also restarts the
// 7-day clock, because the owner has just confirmed the room's status.
export async function setAvailability(formData: FormData) {
  const listingId = text(formData, "listing_id");
  const availability = text(formData, "availability");

  if (!UUID.test(listingId) || (availability !== "available" && availability !== "occupied")) {
    redirect("/owner?error=invalid_request");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_room_availability", {
    p_listing_id: listingId,
    p_availability: availability,
  });

  if (error) redirect("/owner?error=update_failed");

  redirect(`/owner?notice=${availability}`);
}

// Delete one of the owner's rooms (any status). The database function
// refuses rooms that belong to someone else.
export async function deleteRoom(formData: FormData) {
  const listingId = text(formData, "listing_id");

  if (!UUID.test(listingId)) redirect("/owner?error=invalid_request");

  const supabase = await createClient();
  const { data: room } = await supabase
    .from("listings")
    .select("photo_path")
    .eq("id", listingId)
    .maybeSingle();

  const { error } = await supabase.rpc("delete_room", { p_listing_id: listingId });

  if (error) redirect("/owner?error=delete_failed");

  await removePhoto(supabase, room?.photo_path);

  redirect("/owner?notice=deleted");
}

// Renew one of the owner's rooms: "this room is still as listed". Brings a
// hidden room back for students.
export async function renewRoom(formData: FormData) {
  const listingId = text(formData, "listing_id");

  if (!UUID.test(listingId)) redirect("/owner?error=invalid_request");

  const supabase = await createClient();
  const { error } = await supabase.rpc("renew_room", { p_listing_id: listingId });

  if (error) redirect("/owner?error=update_failed");

  redirect("/owner?notice=renewed");
}

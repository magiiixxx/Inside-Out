-- 012 — One photo per room (Ticket 15)
--
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Run it ONCE, then tell Claude "done" (the code is pushed only after that,
-- because it calls the new versions of post_room() and update_room()).
--
-- What this does:
--   1. Makes a Storage bucket "room-photos" (JPG, PNG or WebP, up to 2 MB).
--   2. Storage policies: only owner/admin accounts can add a file, and only
--      into a folder named after their own user id. Only the file's owner
--      (or an admin) can delete it.
--   3. Adds listings.photo_path (the file's name inside the bucket).
--   4. Replaces post_room() and update_room() so they accept a photo.
--
-- HOW THE PHOTO STAYS PRIVATE UNTIL APPROVAL
--   The bucket is public, which means anyone WITH the exact address of a
--   file can open it. The address is the photo_path, which is a random
--   user-id/random-id name nobody can guess, and photo_path lives in the
--   listings table, where Row Level Security shows it to the public only
--   once the room is approved (and to the owner and our team always).
--
-- THE EDITING RULE (extended from 011)
--   Replacing the photo sends an approved room back to "pending", like
--   changing the description or phone number, so an approved room cannot be
--   quietly given a different picture.

-- 1. The bucket -------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'room-photos', 'room-photos', true, 2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 2097152,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- 2. Who may add and delete files ----------------------------------------------
--
-- storage.foldername(name) splits "folder/file.jpg" into {folder}; the first
-- part must be the caller's own user id. There is no update policy, so a
-- file can never be overwritten: a new photo is a new file.

drop policy if exists "Owners add photos to their own folder" on storage.objects;
create policy "Owners add photos to their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'room-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role in ('owner', 'admin')
    )
  );

drop policy if exists "Owners and admins delete photos" on storage.objects;
create policy "Owners and admins delete photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'room-photos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and role = 'admin'
      )
    )
  );

-- 3. The column --------------------------------------------------------------
--
-- Nullable: a photo is optional, and rooms posted before this ticket have
-- none. The format is checked: <owner id>/<random id>.jpg|png|webp

alter table listings add column if not exists photo_path text;

alter table listings drop constraint if exists listings_photo_path_format;
alter table listings
  add constraint listings_photo_path_format
  check (
    photo_path is null
    or photo_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
  );

-- 4. post_room() with a photo ---------------------------------------------------

drop function if exists public.post_room(
  text, numeric, numeric, text, text, text, integer, boolean, boolean, text, boolean
);

create or replace function public.post_room(
  p_description         text,
  p_price_per_month     numeric,
  p_distance_km         numeric,
  p_contact_phone       text,
  p_permit_number       text,
  p_owner_or_caretaker  text,
  p_open_beds           integer,
  p_can_call            boolean,
  p_phone_public        boolean,
  p_address             text,
  p_address_public      boolean,
  p_photo_path          text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid := (select auth.uid());
  v_role  text;
  v_plan  text;
  v_id    uuid;
begin
  if v_owner is null then
    raise exception 'You must be logged in to post a room.';
  end if;

  select role, plan into v_role, v_plan
  from public.profiles
  where id = v_owner;

  if v_role is null or v_role not in ('owner', 'admin') then
    raise exception 'Only owner accounts can post rooms.';
  end if;

  if v_role = 'owner' and v_plan = 'free'
     and (select count(*) from public.listings where owner_id = v_owner) >= 1 then
    raise exception 'The Free plan allows one room. Ask our team about the Premium Owner plan to post more.';
  end if;

  if length(trim(coalesce(p_description, ''))) < 10
     or length(p_description) > 500 then
    raise exception 'The description must be between 10 and 500 characters.';
  end if;

  if length(trim(coalesce(p_address, ''))) < 5
     or length(trim(p_address)) > 200 then
    raise exception 'The address must be between 5 and 200 characters.';
  end if;

  if not coalesce(p_can_call, false) then
    raise exception 'You must agree that our team may call you to confirm.';
  end if;

  if not coalesce(p_phone_public, false) then
    raise exception 'You must agree that your phone number will be public.';
  end if;

  if not coalesce(p_address_public, false) then
    raise exception 'You must agree that the address will be public.';
  end if;

  -- A photo must sit in the caller's OWN folder (the column's format check
  -- covers the rest of the name).
  if p_photo_path is not null
     and split_part(p_photo_path, '/', 1) <> v_owner::text then
    raise exception 'That photo does not belong to you.';
  end if;

  insert into public.listings
    (owner_id, description, price_per_month, distance_km, contact_phone,
     address, photo_path, availability, approval_status)
  values
    (v_owner, trim(p_description), p_price_per_month, p_distance_km,
     trim(p_contact_phone), trim(p_address), p_photo_path, 'available', 'pending')
  returning id into v_id;

  insert into public.listing_checks
    (listing_id, permit_number, owner_or_caretaker, open_beds,
     can_call_to_confirm, phone_public_consent, address_public_consent)
  values
    (v_id, trim(p_permit_number), p_owner_or_caretaker, p_open_beds,
     p_can_call, p_phone_public, p_address_public);

  return v_id;
end;
$$;

revoke execute on function public.post_room(
  text, numeric, numeric, text, text, text, integer, boolean, boolean, text, boolean, text
) from public, anon;
grant execute on function public.post_room(
  text, numeric, numeric, text, text, text, integer, boolean, boolean, text, boolean, text
) to authenticated;

-- 5. update_room() with a photo ----------------------------------------------------
--
-- p_photo_path = null means "keep the current photo". A different path
-- replaces it, and counts as a change students rely on, so an approved room
-- goes back to "pending".

drop function if exists public.update_room(
  uuid, text, numeric, numeric, text, text, boolean
);

create or replace function public.update_room(
  p_listing_id       uuid,
  p_description      text,
  p_price_per_month  numeric,
  p_distance_km      numeric,
  p_contact_phone    text,
  p_address          text,
  p_address_public   boolean,
  p_photo_path       text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner     uuid := (select auth.uid());
  v_room      public.listings%rowtype;
  v_sensitive boolean;
  v_status    text;
begin
  if v_owner is null then
    raise exception 'You must be logged in.';
  end if;

  if length(trim(coalesce(p_description, ''))) < 10
     or length(p_description) > 500 then
    raise exception 'The description must be between 10 and 500 characters.';
  end if;

  if length(trim(coalesce(p_address, ''))) < 5
     or length(trim(p_address)) > 200 then
    raise exception 'The address must be between 5 and 200 characters.';
  end if;

  if p_price_per_month is null or p_price_per_month <= 0 then
    raise exception 'The price must be above 0.';
  end if;

  if p_distance_km is null or p_distance_km < 0 then
    raise exception 'The distance cannot be negative.';
  end if;

  if length(trim(coalesce(p_contact_phone, ''))) < 7 then
    raise exception 'Please enter a phone number.';
  end if;

  if not coalesce(p_address_public, false) then
    raise exception 'You must agree that the address will be public.';
  end if;

  if p_photo_path is not null
     and split_part(p_photo_path, '/', 1) <> v_owner::text then
    raise exception 'That photo does not belong to you.';
  end if;

  -- Find the room, and only if it belongs to the caller. "for update"
  -- locks the row so two edits cannot collide.
  select * into v_room
  from public.listings
  where id = p_listing_id and owner_id = v_owner
  for update;

  if not found then
    raise exception 'We could not find a room of yours with that id.';
  end if;

  -- Anything students rely on besides the price?
  v_sensitive :=
       trim(p_description)   is distinct from v_room.description
    or p_distance_km         is distinct from v_room.distance_km
    or trim(p_contact_phone) is distinct from v_room.contact_phone
    or trim(p_address)       is distinct from v_room.address
    or (p_photo_path is not null
        and p_photo_path is distinct from v_room.photo_path);

  if v_room.approval_status = 'approved' and not v_sensitive then
    v_status := 'approved';      -- price-only change: stays live
  else
    v_status := 'pending';       -- needs our team to check it again
  end if;

  update public.listings
  set description     = trim(p_description),
      price_per_month = p_price_per_month,
      distance_km     = p_distance_km,
      contact_phone   = trim(p_contact_phone),
      address         = trim(p_address),
      photo_path      = coalesce(p_photo_path, photo_path),
      approval_status = v_status,
      last_updated_at = now()
  where id = p_listing_id;

  update public.listing_checks
  set address_public_consent = true
  where listing_id = p_listing_id;

  return v_status;
end;
$$;

revoke execute on function public.update_room(
  uuid, text, numeric, numeric, text, text, boolean, text
) from public, anon;
grant execute on function public.update_room(
  uuid, text, numeric, numeric, text, text, boolean, text
) to authenticated;

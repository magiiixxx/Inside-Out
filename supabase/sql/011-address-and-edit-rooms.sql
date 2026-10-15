-- 011 — Room addresses, and owners editing their rooms (Ticket 13)
--
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Run it ONCE.
--
-- What this does:
--   1. Adds an address to every room, and records the owner's agreement
--      that the address is public (like the phone number).
--   2. Replaces post_room() with a version that also takes the address.
--   3. Adds update_room(): the only way an owner can edit a room.
--
-- THE EDITING RULE
--   - Changing only the PRICE goes live straight away.
--   - Changing the description, distance, phone number or address sends an
--     approved room back to "pending" so our team checks it again. That
--     stops someone getting a room approved and then swapping in a
--     scammer's phone number.
--   - A rejected room goes back to "pending" when edited, so the owner can
--     fix it and ask for review again.

-- 1. Address ------------------------------------------------------------
--
-- Nullable, because rooms posted before this ticket have no address. New
-- rooms must have one (post_room() checks).

alter table listings add column if not exists address text;

alter table listings drop constraint if exists listings_address_length;
alter table listings
  add constraint listings_address_length
  check (address is null or length(address) between 5 and 200);

-- The owner agreed that the address will be shown to students. Stored on
-- the private listing_checks table, next to the phone consent.
alter table listing_checks
  add column if not exists address_public_consent boolean not null default false;

-- 2. post_room(): now with an address ------------------------------------
--
-- The old nine-argument version is removed and replaced by one with the
-- address and its consent. Everything else (login, owner role, Free plan
-- limit, checks) is exactly as in 010.

drop function if exists public.post_room(
  text, numeric, numeric, text, text, text, integer, boolean, boolean
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
  p_address_public      boolean
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

  insert into public.listings
    (owner_id, description, price_per_month, distance_km, contact_phone,
     address, availability, approval_status)
  values
    (v_owner, trim(p_description), p_price_per_month, p_distance_km,
     trim(p_contact_phone), trim(p_address), 'available', 'pending')
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
  text, numeric, numeric, text, text, text, integer, boolean, boolean, text, boolean
) from public, anon;
grant execute on function public.post_room(
  text, numeric, numeric, text, text, text, integer, boolean, boolean, text, boolean
) to authenticated;

-- 3. update_room(): the only way to edit a room -----------------------------
--
-- Returns 'approved' if the room stayed live, or 'pending' if it went back
-- to our team for review, so the page can tell the owner which happened.
--
-- It can edit ONLY: description, price, distance, phone and address. It
-- cannot touch the approval status directly, the permit, the owner or the
-- plan, and it only works on the caller's OWN rooms.

create or replace function public.update_room(
  p_listing_id       uuid,
  p_description      text,
  p_price_per_month  numeric,
  p_distance_km      numeric,
  p_contact_phone    text,
  p_address          text,
  p_address_public   boolean
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
    or trim(p_address)       is distinct from v_room.address;

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
  uuid, text, numeric, numeric, text, text, boolean
) from public, anon;
grant execute on function public.update_room(
  uuid, text, numeric, numeric, text, text, boolean
) to authenticated;

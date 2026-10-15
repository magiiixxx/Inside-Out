-- 015 — Code review fixes (Ticket 18)
--
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Run it ONCE, after 014.
--
-- What this does:
--   1. post_room() and update_room() now refuse values the app already
--      refuses: a price above ₱100,000, a distance above 50 km, and a phone
--      number that is not 7 to 20 digits and symbols. Before, someone
--      calling the database function directly could skip those limits.
--   2. activate_plan() only ever moves an owner UP. If the owner already has
--      the requested plan or a better one (for example you switched them by
--      hand), it refuses, and you can Dismiss the request.
--
-- Nothing else changes. The functions keep the same names and arguments, so
-- the website keeps working while you run this.

-- 1a. post_room() with limits -------------------------------------------------

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

  if p_price_per_month is null or p_price_per_month <= 0
     or p_price_per_month > 100000 then
    raise exception 'The price must be above 0 and at most 100,000.';
  end if;

  if p_distance_km is null or p_distance_km < 0 or p_distance_km > 50 then
    raise exception 'The distance must be between 0 and 50 km.';
  end if;

  if p_contact_phone is null
     or trim(p_contact_phone) !~ '^[0-9+()[:space:]-]{7,20}$' then
    raise exception 'Please enter a valid phone number.';
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

-- 1b. update_room() with limits -----------------------------------------------

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

  if p_price_per_month is null or p_price_per_month <= 0
     or p_price_per_month > 100000 then
    raise exception 'The price must be above 0 and at most 100,000.';
  end if;

  if p_distance_km is null or p_distance_km < 0 or p_distance_km > 50 then
    raise exception 'The distance must be between 0 and 50 km.';
  end if;

  if p_contact_phone is null
     or trim(p_contact_phone) !~ '^[0-9+()[:space:]-]{7,20}$' then
    raise exception 'Please enter a valid phone number.';
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

-- 2. activate_plan(): only ever a step UP --------------------------------------
--
-- Free < Premium < Property Manager. If the owner already has the requested
-- plan or a higher one, the request is refused (and stays waiting, so you
-- can Dismiss it).

create or replace function public.activate_plan(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req          public.plan_requests%rowtype;
  v_current_plan text;
begin
  if not public.is_admin() then
    raise exception 'Only admins can activate a plan.';
  end if;

  select * into v_req
  from public.plan_requests
  where id = p_request_id and status = 'pending'
  for update;

  if not found then
    raise exception 'That request is not waiting.';
  end if;

  select plan into v_current_plan
  from public.profiles where id = v_req.owner_id;

  if (case v_current_plan when 'manager' then 2 when 'premium' then 1 else 0 end)
     >= (case v_req.plan   when 'manager' then 2 when 'premium' then 1 else 0 end) then
    raise exception 'That owner already has this plan or a higher one.';
  end if;

  update public.profiles set plan = v_req.plan where id = v_req.owner_id;

  update public.plan_requests
  set status = 'activated', decided_at = now()
  where id = p_request_id;
end;
$$;

revoke execute on function public.activate_plan(uuid) from public, anon;
grant execute on function public.activate_plan(uuid) to authenticated;

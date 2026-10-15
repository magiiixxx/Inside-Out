-- 005 — Owners post rooms (Ticket 05)
--
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Run it ONCE (it is safe to re-run: it uses "create or replace" and
-- "if not exists" where it can).
--
-- What this adds:
--   1. listing_checks: the PRIVATE table holding the permit number and the
--      owner's answers to our validation questions. Students can never
--      read it.
--   2. is_admin(): a small helper used by the rules below (and by Ticket 06).
--   3. Read rules so owners can see their own rooms.
--   4. post_room(): the ONE way an owner can post a room.
--   5. Hardening: the website can no longer write to the tables directly.

-- 1. listing_checks -------------------------------------------------
--
-- Why a separate table? Row Level Security works per ROW, not per column.
-- If the permit number sat on `listings`, anyone allowed to read a room
-- would also be able to read its permit. A separate table with stricter
-- rules fixes that.

create table if not exists listing_checks (
  listing_id            uuid primary key references listings (id) on delete cascade,
  permit_number         text    not null check (length(trim(permit_number)) > 0),
  owner_or_caretaker    text    not null check (owner_or_caretaker in ('owner', 'caretaker')),
  open_beds             integer not null check (open_beds >= 0),
  can_call_to_confirm   boolean not null check (can_call_to_confirm),
  -- The owner agreed that their phone number will be shown publicly.
  phone_public_consent  boolean not null check (phone_public_consent),
  created_at            timestamptz not null default now()
);

alter table listing_checks enable row level security;

-- 2. is_admin() -----------------------------------------------------
--
-- True when the logged-in user's profile has role 'admin'. "security
-- definer" means it runs with the database's own rights, so it can read
-- the profiles table whatever the caller is allowed to see.

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 3. Read rules -----------------------------------------------------

-- An owner may read their OWN rooms, including pending and rejected ones.
-- (This adds to the existing public rule; a row is visible if ANY rule
-- allows it.)
create policy "owners can read their own listings"
  on listings for select
  to authenticated
  using ((select auth.uid()) = owner_id);

-- Admins may read every room (Ticket 06 needs this).
create policy "admins can read all listings"
  on listings for select
  to authenticated
  using (public.is_admin());

-- A room's permit and answers can be read only by that room's owner and
-- by admins. There is NO rule for anon, so students and logged-out
-- visitors get nothing.
create policy "owners and admins can read listing checks"
  on listing_checks for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from listings l
      where l.id = listing_checks.listing_id
        and l.owner_id = (select auth.uid())
    )
  );

-- 4. post_room(): the only way to post a room --------------------------
--
-- It saves the room AND its private check in one step, so you never end
-- up with half a room. It always uses the logged-in user as the owner,
-- always starts the room as 'pending' and 'available', and always sets
-- 'last updated' to now. The caller cannot choose any of those.

create or replace function public.post_room(
  p_description         text,
  p_price_per_month     numeric,
  p_distance_km         numeric,
  p_contact_phone       text,
  p_permit_number       text,
  p_owner_or_caretaker  text,
  p_open_beds           integer,
  p_can_call            boolean,
  p_phone_public        boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid := (select auth.uid());
  v_id    uuid;
begin
  if v_owner is null then
    raise exception 'You must be logged in to post a room.';
  end if;

  if not exists (select 1 from public.profiles where id = v_owner) then
    raise exception 'No profile found for this account.';
  end if;

  if length(trim(coalesce(p_description, ''))) < 10
     or length(p_description) > 500 then
    raise exception 'The description must be between 10 and 500 characters.';
  end if;

  if not coalesce(p_can_call, false) then
    raise exception 'You must agree that our team may call you to confirm.';
  end if;

  if not coalesce(p_phone_public, false) then
    raise exception 'You must agree that your phone number will be public.';
  end if;

  insert into public.listings
    (owner_id, description, price_per_month, distance_km, contact_phone,
     availability, approval_status)
  values
    (v_owner, trim(p_description), p_price_per_month, p_distance_km,
     trim(p_contact_phone), 'available', 'pending')
  returning id into v_id;

  insert into public.listing_checks
    (listing_id, permit_number, owner_or_caretaker, open_beds,
     can_call_to_confirm, phone_public_consent)
  values
    (v_id, trim(p_permit_number), p_owner_or_caretaker, p_open_beds,
     p_can_call, p_phone_public);

  return v_id;
end;
$$;

-- Only logged-in users may call it. Logged-out visitors cannot.
revoke execute on function public.post_room(
  text, numeric, numeric, text, text, text, integer, boolean, boolean
) from public, anon;
grant execute on function public.post_room(
  text, numeric, numeric, text, text, text, integer, boolean, boolean
) to authenticated;

-- 5. Hardening: no direct writes from the website ------------------------
--
-- Supabase gives every new table broad permissions by default, and Row
-- Level Security is what normally stops writes. Here we ALSO remove the
-- write permissions, so that even a mistake in a rule cannot let someone
-- insert, change or delete rows through the public API. Reading stays as
-- before. All writing now goes through post_room() (and, in later
-- tickets, through small functions like it).

revoke all on listings from anon, authenticated;
grant select on listings to anon, authenticated;

revoke all on listing_checks from anon, authenticated;
grant select on listing_checks to authenticated;

revoke insert, update, delete on profiles from anon, authenticated;

-- 6. Check it worked ------------------------------------------------------
--
-- Supabase -> Table Editor: "listing_checks" must NOT show an
-- "RLS disabled" warning.
--
-- The SAMPLE rooms from 002 and 003 are still in the table so the student
-- page has something to show. DELETE THEM before your real demo:
--   delete from listings where description like 'SAMPLE%';

-- 007 — Owners mark rooms available/occupied and renew them (Ticket 07)
--
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Run it ONCE (safe to re-run).
--
-- Two small functions. They are the only things an owner can use to change
-- a room after posting it, and each one changes exactly one thing:
--   set_room_availability(): available <-> occupied
--   renew_room():            "I confirm this room is still as listed"
--
-- Neither can touch the price, description, phone or approval status, and
-- neither works on someone else's room: the owner check is built into the
-- UPDATE itself ("where owner_id = the logged-in user").

-- 1. Mark a room available or occupied ----------------------------------
--
-- Telling us the room's status counts as a fresh confirmation, so this
-- also sets "last updated" to now. That restarts the 7-day clock.

create or replace function public.set_room_availability(
  p_listing_id   uuid,
  p_availability text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid := (select auth.uid());
begin
  if v_owner is null then
    raise exception 'You must be logged in.';
  end if;

  if p_availability not in ('available', 'occupied') then
    raise exception 'The status must be available or occupied.';
  end if;

  update public.listings
  set availability    = p_availability,
      last_updated_at = now()
  where id = p_listing_id
    and owner_id = v_owner
    and approval_status = 'approved';

  if not found then
    raise exception 'We could not find an approved room of yours with that id.';
  end if;
end;
$$;

-- 2. Renew a room ---------------------------------------------------------
--
-- Sets "last updated" to now, which brings a hidden room back for
-- students. Only approved rooms can be renewed: a pending or rejected
-- room is not visible to students anyway.

create or replace function public.renew_room(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid := (select auth.uid());
begin
  if v_owner is null then
    raise exception 'You must be logged in.';
  end if;

  update public.listings
  set last_updated_at = now()
  where id = p_listing_id
    and owner_id = v_owner
    and approval_status = 'approved';

  if not found then
    raise exception 'We could not find an approved room of yours with that id.';
  end if;
end;
$$;

-- 3. Who may call them ----------------------------------------------------
-- Logged-in users only. Logged-out visitors cannot.

revoke execute on function public.set_room_availability(uuid, text) from public, anon;
grant  execute on function public.set_room_availability(uuid, text) to authenticated;

revoke execute on function public.renew_room(uuid) from public, anon;
grant  execute on function public.renew_room(uuid) to authenticated;

-- 4. Testing the 7-day rule without waiting 7 days -------------------------
--
-- To pretend a room went stale, run this with your room's id (find it in
-- Table Editor -> listings). The room disappears from the student page and
-- your owner home page shows it as hidden. Then press "Renew" on the owner
-- home page: it comes back.
--
--   update listings set last_updated_at = now() - interval '8 days'
--   where id = 'PUT-THE-ROOM-ID-HERE';
--
-- To test the "about to hide" warning instead, use '6 days'.

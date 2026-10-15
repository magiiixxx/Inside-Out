-- 008 — Deleting rooms (Ticket 08)
--
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Run it ONCE (safe to re-run).
--
-- One small function, delete_room(). It is the only way to delete a room
-- through the website (the website has no direct delete permission, see
-- 005). It works for:
--   - the room's OWNER, on their own rooms, whatever their status
--   - an ADMIN, on any room (to remove spam or leftover test rooms)
--
-- The permit check (listing_checks) belongs to the room, so it is deleted
-- with it automatically ("on delete cascade" in 005).

create or replace function public.delete_room(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'You must be logged in.';
  end if;

  -- The owner/admin check is part of the DELETE itself, so someone else's
  -- room simply is not found.
  delete from public.listings
  where id = p_listing_id
    and (owner_id = v_user or public.is_admin());

  if not found then
    raise exception 'We could not find a room of yours with that id.';
  end if;
end;
$$;

-- Logged-in users only. Logged-out visitors cannot.
revoke execute on function public.delete_room(uuid) from public, anon;
grant  execute on function public.delete_room(uuid) to authenticated;

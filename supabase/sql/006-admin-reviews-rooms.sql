-- 006 — Admins approve or reject rooms (Ticket 06)
--
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Run it ONCE (safe to re-run).
--
-- What this adds:
--   1. A rule so admins can read every profile (to see the owner's name).
--   2. review_listing(): the ONE way a room's approval status can change,
--      and only an admin can call it.
--
-- Admins can already read all rooms and all permit checks (005).

-- 1. Admins may read all profiles --------------------------------------
--
-- Normal users can read only their own profile (004). The review page
-- shows the owner's name, so admins need to read the others too.

drop policy if exists "admins can read all profiles" on profiles;
create policy "admins can read all profiles"
  on profiles for select
  to authenticated
  using (public.is_admin());

-- 2. review_listing(): approve or reject a pending room -----------------
--
-- This is the only place approval_status changes. The very first thing it
-- does is check the caller is an admin, so an owner calling it directly
-- gets an error and cannot approve their own room.
--
-- When a room is APPROVED we set "last updated" to now. Our team has just
-- phoned the owner, which is a fresh confirmation. Without this, a room
-- approved a week after it was posted would be hidden as "stale" the
-- moment it went live.

create or replace function public.review_listing(
  p_listing_id uuid,
  p_decision   text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can review rooms.';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'The decision must be approved or rejected.';
  end if;

  update public.listings
  set approval_status = p_decision,
      last_updated_at = case
        when p_decision = 'approved' then now()
        else last_updated_at
      end
  where id = p_listing_id
    and approval_status = 'pending';

  if not found then
    raise exception 'That room is not waiting for review.';
  end if;
end;
$$;

revoke execute on function public.review_listing(uuid, text) from public, anon;
grant execute on function public.review_listing(uuid, text) to authenticated;

-- 3. Make yourself an admin (by hand, only for team members) ----------------
--
-- Sign up on the website first, then run this with YOUR email. Edit the
-- email below before running. The website itself can never do this.
--
--   update profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'PUT-YOUR-EMAIL-HERE');
--
-- Check it worked:
--   select full_name, role from profiles where role = 'admin';

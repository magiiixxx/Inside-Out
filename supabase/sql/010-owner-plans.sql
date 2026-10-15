-- 010 — Owner plans: Free, Premium Owner, Property Manager (Ticket 12)
--
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Run it ONCE. (Part 2 upgrades every EXISTING owner, so do not run it
-- again after you have switched someone back to Free by hand.)
--
-- What this does:
--   1. Adds a "plan" to every profile: free, premium or manager.
--   2. Keeps every existing owner able to post several rooms.
--   3. Makes post_room() enforce the Free plan's limit of ONE room.
--
-- The app handles no money. A team member changes an owner's plan by hand
-- (see part 4) after the owner has arranged payment with the team.

-- 1. The plan column ----------------------------------------------------
--
-- New accounts start on 'free'. Nobody can change a plan through the
-- website: profiles have no write permission (see 005), so only the team,
-- in the SQL Editor, can do it.

alter table profiles
  add column if not exists plan text not null default 'free'
  check (plan in ('free', 'premium', 'manager'));

-- 2. Existing owners keep working -------------------------------------------
--
-- Before plans existed, every owner could post any number of rooms. So
-- that nobody (for example Monica, in your demo) is suddenly blocked, every
-- owner who exists today becomes Premium. New owners start Free.

update profiles set plan = 'premium' where role = 'owner' and plan = 'free';

-- 3. post_room() enforces the Free limit --------------------------------------
--
-- Same function as before (005, then 009) with ONE addition: an owner on
-- the Free plan who already has a room (in any state: pending, approved
-- or rejected) cannot post another. They can delete a room to post a new
-- one. Admins are not limited. Premium and Property Manager owners may
-- post several rooms.
--
-- The limit is 1. The app shows the same number (FREE_ROOM_LIMIT in
-- src/lib/plans.ts), so change both together.

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

-- 4. Changing an owner's plan by hand (team only) ---------------------------
--
-- After an owner has arranged payment with the team, run this with THEIR
-- email. The three plan names are: free, premium, manager.
--
--   update profiles set plan = 'premium'
--   where id = (select id from auth.users where email = 'OWNER-EMAIL-HERE');
--
-- See who is on which plan:
--
--   select p.full_name, u.email, p.role, p.plan
--   from profiles p join auth.users u on u.id = p.id
--   where p.role = 'owner'
--   order by p.plan;

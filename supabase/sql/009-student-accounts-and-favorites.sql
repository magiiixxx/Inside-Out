-- 009 — Student accounts and favorites (Ticket 09)
--
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Run it ONCE (safe to re-run).
--
-- What this does:
--   1. Adds a third role, 'student', next to 'owner' and 'admin'.
--   2. Makes the sign-up trigger create students OR owners, never admins.
--   3. Stops students from posting rooms (post_room now checks the role).
--   4. Adds the favorites table, private to each student.
--   5. Adds set_favorite(): the only way to save or remove a favorite.

-- 1. The student role -------------------------------------------------
--
-- "student" becomes the DEFAULT, because it is the role with the fewest
-- powers. Existing owner and admin accounts keep their role.

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles
  add constraint profiles_role_check check (role in ('student', 'owner', 'admin'));
alter table profiles alter column role set default 'student';

-- 2. Sign-up trigger: student or owner, never admin -----------------------
--
-- The sign-up form sends "account_type" along with the name. Anyone can
-- tamper with what a browser sends, so the database does NOT trust it:
-- only the exact word 'owner' gives an owner account. Anything else,
-- including 'admin', becomes a student. Admins are made by hand (004).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case
      when new.raw_user_meta_data ->> 'account_type' = 'owner' then 'owner'
      else 'student'
    end
  );
  return new;
end;
$$;

-- 3. Students cannot post rooms ---------------------------------------------
--
-- Same function as in 005, with ONE change: the account must be an owner
-- (or an admin), not just any account with a profile.

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

  if not exists (
    select 1 from public.profiles
    where id = v_owner and role in ('owner', 'admin')
  ) then
    raise exception 'Only owner accounts can post rooms.';
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

-- 4. Favorites ------------------------------------------------------------
--
-- One row = "this student saved this room". Deleting a room or an account
-- removes its favorites automatically ("on delete cascade").

create table if not exists favorites (
  user_id     uuid        not null references auth.users (id) on delete cascade,
  listing_id  uuid        not null references listings (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, listing_id)
);

alter table favorites enable row level security;

-- A student can read ONLY their own favorites. Nobody else can read them,
-- not other students, not owners, and not logged-out visitors.
create policy "users can read their own favorites"
  on favorites for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- No direct writes from the website; all saving goes through set_favorite().
revoke all on favorites from anon, authenticated;
grant select on favorites to authenticated;

-- 5. set_favorite(): save or remove a room ---------------------------------
--
-- Rules, all checked inside the database:
--   - you must be logged in as a STUDENT
--   - you can only SAVE a room students can currently see (approved and
--     updated in the last 7 days)
--   - you can save at most 50 rooms
--   - you can always REMOVE one of your favorites, even if the room has
--     since been hidden

create or replace function public.set_favorite(
  p_listing_id uuid,
  p_saved      boolean
)
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

  if not exists (
    select 1 from public.profiles where id = v_user and role = 'student'
  ) then
    raise exception 'Only student accounts can save rooms.';
  end if;

  if p_saved then
    if not exists (
      select 1 from public.listings
      where id = p_listing_id
        and approval_status = 'approved'
        and last_updated_at > now() - interval '7 days'
    ) then
      raise exception 'That room is not available to save.';
    end if;

    if (select count(*) from public.favorites where user_id = v_user) >= 50 then
      raise exception 'You can save at most 50 rooms.';
    end if;

    insert into public.favorites (user_id, listing_id)
    values (v_user, p_listing_id)
    on conflict do nothing;
  else
    delete from public.favorites
    where user_id = v_user and listing_id = p_listing_id;
  end if;
end;
$$;

revoke execute on function public.set_favorite(uuid, boolean) from public, anon;
grant  execute on function public.set_favorite(uuid, boolean) to authenticated;

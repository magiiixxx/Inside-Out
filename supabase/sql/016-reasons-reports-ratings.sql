-- 016 — Rejection reasons, "Report this room", and room ratings (Tickets 19, 20)
--
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Run it ONCE, after 015, then tell Claude "done" (the website code is pushed
-- only after that, because it calls the new review_listing() with a reason).
--
-- What this does:
--   1. Rejection reason: when the team rejects a room it must say why, and
--      the owner sees the reason on their home page. Approving or editing a
--      room clears it.
--   2. Reports: a logged-in student can report a visible room ("not
--      available", "wrong phone number", ...). The team sees the reports and
--      can hide the room until it has been checked, or mark a report
--      resolved.
--   3. Ratings: a logged-in student can give a visible room 1 to 5 stars
--      (one rating each, changeable). The average and the number of ratings
--      are stored on the room, so every visitor sees them on the room card.
--
-- Like favorites, none of the new tables can be written to directly from the
-- website: every change goes through a function that checks who is asking.

-- 1. Rejection reason ----------------------------------------------------------

alter table listings add column if not exists rejection_reason text;

alter table listings drop constraint if exists listings_rejection_reason_length;
alter table listings
  add constraint listings_rejection_reason_length
  check (rejection_reason is null or length(rejection_reason) between 5 and 300);

-- review_listing() gets a third argument. The old two-argument version is
-- removed so there is only one way to review a room.

drop function if exists public.review_listing(uuid, text);

create or replace function public.review_listing(
  p_listing_id uuid,
  p_decision   text,
  p_reason     text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
begin
  if not public.is_admin() then
    raise exception 'Only admins can review rooms.';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'The decision must be approved or rejected.';
  end if;

  if p_decision = 'rejected'
     and (v_reason is null or length(v_reason) < 5 or length(v_reason) > 300) then
    raise exception 'A rejection needs a reason of 5 to 300 characters.';
  end if;

  -- Approving is a fresh confirmation (our team just phoned the owner), so
  -- the 7-day clock restarts. Approving also clears an old reason.
  update public.listings
  set approval_status = p_decision,
      rejection_reason = case when p_decision = 'rejected' then v_reason else null end,
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

revoke execute on function public.review_listing(uuid, text, text) from public, anon;
grant execute on function public.review_listing(uuid, text, text) to authenticated;

-- update_room(): same as 015, plus: editing a room clears its old reason.

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

  select * into v_room
  from public.listings
  where id = p_listing_id and owner_id = v_owner
  for update;

  if not found then
    raise exception 'We could not find a room of yours with that id.';
  end if;

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
  set description      = trim(p_description),
      price_per_month  = p_price_per_month,
      distance_km      = p_distance_km,
      contact_phone    = trim(p_contact_phone),
      address          = trim(p_address),
      photo_path       = coalesce(p_photo_path, photo_path),
      approval_status  = v_status,
      rejection_reason = null,
      last_updated_at  = now()
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

-- 2. Reports -------------------------------------------------------------------

create table if not exists room_reports (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references listings (id) on delete cascade,
  reporter_id  uuid not null references auth.users (id) on delete cascade,
  reason       text not null
               check (reason in ('not_available', 'wrong_phone', 'wrong_info', 'scam', 'other')),
  note         text check (note is null or length(note) <= 200),
  status       text not null default 'open' check (status in ('open', 'resolved')),
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);

-- A student can have only ONE open report per room.
create unique index if not exists room_reports_one_open_per_student_and_room
  on room_reports (listing_id, reporter_id) where status = 'open';

alter table room_reports enable row level security;

drop policy if exists "students read their own reports" on room_reports;
create policy "students read their own reports"
  on room_reports for select to authenticated
  using (reporter_id = (select auth.uid()));

drop policy if exists "admins read all reports" on room_reports;
create policy "admins read all reports"
  on room_reports for select to authenticated
  using (public.is_admin());

revoke all on room_reports from anon, authenticated;
grant select on room_reports to authenticated;

-- report_room(): a student reports a room they can see.
create or replace function public.report_room(
  p_listing_id uuid,
  p_reason     text,
  p_note       text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_role text;
  v_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if v_user is null then
    raise exception 'You must be logged in.';
  end if;

  select role into v_role from public.profiles where id = v_user;
  if v_role is distinct from 'student' then
    raise exception 'Only student accounts can report a room.';
  end if;

  if p_reason not in ('not_available', 'wrong_phone', 'wrong_info', 'scam', 'other') then
    raise exception 'Choose why you are reporting this room.';
  end if;

  if v_note is not null and length(v_note) > 200 then
    raise exception 'The note can be at most 200 characters.';
  end if;

  -- Only a room students can currently see (approved, updated in 7 days).
  if not exists (
    select 1 from public.listings
    where id = p_listing_id
      and approval_status = 'approved'
      and last_updated_at > now() - interval '7 days'
  ) then
    raise exception 'That room is not available to report.';
  end if;

  -- A cap, so one account cannot flood the team.
  if (select count(*) from public.room_reports
      where reporter_id = v_user and status = 'open') >= 20 then
    raise exception 'You have too many open reports.';
  end if;

  insert into public.room_reports (listing_id, reporter_id, reason, note)
  values (p_listing_id, v_user, p_reason, v_note);
exception
  when unique_violation then
    raise exception 'You already reported this room.';
end;
$$;

revoke execute on function public.report_room(uuid, text, text) from public, anon;
grant execute on function public.report_room(uuid, text, text) to authenticated;

-- resolve_report(): the team closes a report. With p_hide = true the room
-- also goes back to "pending" (hidden from students) until the team has
-- checked it, and every open report about that room is closed.
create or replace function public.resolve_report(
  p_report_id uuid,
  p_hide      boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_listing uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can resolve a report.';
  end if;

  select listing_id into v_listing
  from public.room_reports
  where id = p_report_id and status = 'open'
  for update;

  if not found then
    raise exception 'That report is not open.';
  end if;

  if coalesce(p_hide, false) then
    update public.listings
    set approval_status = 'pending'
    where id = v_listing and approval_status = 'approved';

    update public.room_reports
    set status = 'resolved', resolved_at = now()
    where listing_id = v_listing and status = 'open';
  else
    update public.room_reports
    set status = 'resolved', resolved_at = now()
    where id = p_report_id;
  end if;
end;
$$;

revoke execute on function public.resolve_report(uuid, boolean) from public, anon;
grant execute on function public.resolve_report(uuid, boolean) to authenticated;

-- 3. Ratings -----------------------------------------------------------------------
--
-- The average and the count live on the room itself (rating_avg,
-- rating_count), kept up to date by rate_room(), so the public room list
-- needs no extra query. Nobody can write those columns directly: the
-- website has read-only access to listings.

alter table listings add column if not exists rating_avg numeric(2, 1)
  check (rating_avg is null or rating_avg between 1 and 5);
alter table listings add column if not exists rating_count integer not null default 0;

create table if not exists room_ratings (
  listing_id  uuid not null references listings (id) on delete cascade,
  student_id  uuid not null references auth.users (id) on delete cascade,
  stars       smallint not null check (stars between 1 and 5),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (listing_id, student_id)
);

alter table room_ratings enable row level security;

-- A student sees only their own ratings (to show "you rated this 4").
drop policy if exists "students read their own ratings" on room_ratings;
create policy "students read their own ratings"
  on room_ratings for select to authenticated
  using (student_id = (select auth.uid()));

revoke all on room_ratings from anon, authenticated;
grant select on room_ratings to authenticated;

-- rate_room(): give a room 1 to 5 stars, or change your rating.
create or replace function public.rate_room(
  p_listing_id uuid,
  p_stars      integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_role text;
begin
  if v_user is null then
    raise exception 'You must be logged in.';
  end if;

  select role into v_role from public.profiles where id = v_user;
  if v_role is distinct from 'student' then
    raise exception 'Only student accounts can rate a room.';
  end if;

  if p_stars is null or p_stars < 1 or p_stars > 5 then
    raise exception 'A rating is from 1 to 5 stars.';
  end if;

  if not exists (
    select 1 from public.listings
    where id = p_listing_id
      and approval_status = 'approved'
      and last_updated_at > now() - interval '7 days'
  ) then
    raise exception 'That room is not available to rate.';
  end if;

  insert into public.room_ratings (listing_id, student_id, stars)
  values (p_listing_id, v_user, p_stars)
  on conflict (listing_id, student_id)
  do update set stars = excluded.stars, updated_at = now();

  update public.listings
  set rating_avg = (select round(avg(stars), 1)
                    from public.room_ratings where listing_id = p_listing_id),
      rating_count = (select count(*)
                      from public.room_ratings where listing_id = p_listing_id)
  where id = p_listing_id;
end;
$$;

revoke execute on function public.rate_room(uuid, integer) from public, anon;
grant execute on function public.rate_room(uuid, integer) to authenticated;

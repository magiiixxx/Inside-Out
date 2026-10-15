-- 018 — Trustworthy ratings, and telling owners about a report hold (Ticket 22)
--
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Run it ONCE, after 017, then tell Claude "done" (the website code is pushed
-- only after that, because it calls the new functions).
--
-- What this does:
--   1. Ratings need a saved room: a student can rate a room only if they have
--      saved it. That makes a drive-by fake rating (or an owner rating their
--      own room from a second account) a little harder, because the room has
--      to be saved first. It is not perfect proof that someone visited.
--   2. The team can reset the ratings of a room (reset_room_ratings()).
--   3. A room's average always matches its ratings: it is recalculated
--      whenever a rating is added, changed or removed, including when a
--      student account is deleted.
--   4. When the team hides a room because of a report, the room is marked
--      "held for a report", so the owner can be told why it is not visible.
--      The mark is cleared when the team approves or rejects the room.

-- 1. One place that works out a room's average -------------------------------

create or replace function public.refresh_room_rating(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- When a whole room is deleted its ratings are deleted with it, and this
  -- runs for a room that no longer exists: then there is nothing to update.
  if not exists (select 1 from public.listings where id = p_listing_id) then
    return;
  end if;

  update public.listings
  set rating_avg = (select round(avg(stars), 1)
                    from public.room_ratings where listing_id = p_listing_id),
      rating_count = (select count(*)
                      from public.room_ratings where listing_id = p_listing_id)
  where id = p_listing_id;
end;
$$;

-- Internal only: nobody calls this from the website.
revoke execute on function public.refresh_room_rating(uuid) from public, anon, authenticated;

-- Runs by itself whenever a rating row is deleted (a reset, or a student
-- account being deleted), so the average cannot go stale.
create or replace function public.refresh_room_rating_after_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.refresh_room_rating(old.listing_id);
  return old;
end;
$$;

revoke execute on function public.refresh_room_rating_after_delete() from public, anon, authenticated;

drop trigger if exists room_ratings_refresh_after_delete on room_ratings;
create trigger room_ratings_refresh_after_delete
  after delete on room_ratings
  for each row execute function public.refresh_room_rating_after_delete();

-- 2. rate_room(): the room must be saved first ----------------------------------

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

  if not exists (
    select 1 from public.favorites
    where user_id = v_user and listing_id = p_listing_id
  ) then
    raise exception 'Save this room before rating it.';
  end if;

  insert into public.room_ratings (listing_id, student_id, stars)
  values (p_listing_id, v_user, p_stars)
  on conflict (listing_id, student_id)
  do update set stars = excluded.stars, updated_at = now();

  perform public.refresh_room_rating(p_listing_id);
end;
$$;

revoke execute on function public.rate_room(uuid, integer) from public, anon;
grant execute on function public.rate_room(uuid, integer) to authenticated;

-- 3. reset_room_ratings(): the team clears a room's ratings ----------------------

create or replace function public.reset_room_ratings(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can reset ratings.';
  end if;

  delete from public.room_ratings where listing_id = p_listing_id;
  -- The delete trigger recalculates the average; this makes sure a room that
  -- never had a rating row also ends up clean.
  perform public.refresh_room_rating(p_listing_id);
end;
$$;

revoke execute on function public.reset_room_ratings(uuid) from public, anon;
grant execute on function public.reset_room_ratings(uuid) to authenticated;

-- 4. "Held for a report" ---------------------------------------------------------

alter table listings add column if not exists held_for_report boolean not null default false;

-- resolve_report(): hiding a room now also marks it as held for a report.
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
    set approval_status = 'pending',
        held_for_report = true
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

-- review_listing(): approving or rejecting clears the hold.
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

  update public.listings
  set approval_status = p_decision,
      rejection_reason = case when p_decision = 'rejected' then v_reason else null end,
      held_for_report = false,
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

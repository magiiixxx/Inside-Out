-- 002 — The listings table (Ticket 02)
--
-- One row per room that an owner posts. Run this in the Supabase
-- dashboard: SQL Editor -> New query -> paste -> Run.
-- Run it ONCE. (Do not run 001-example.sql; it is only an example.)

-- 1. The table ------------------------------------------------------

create table if not exists listings (
  id               uuid primary key default gen_random_uuid(),
  -- Who posted the room. Left empty (nullable) for now so we can add one
  -- sample room before owner login exists (Ticket 04). Ticket 05 will
  -- make it required, after the sample row is deleted.
  owner_id         uuid references auth.users (id) on delete cascade,
  description      text           not null,
  price_per_month  numeric(10, 2) not null check (price_per_month >= 0),
  distance_km      numeric(5, 2)  not null check (distance_km >= 0),
  contact_phone    text           not null,
  -- Whether a bed is open today. The owner changes this.
  availability     text           not null default 'available'
                   check (availability in ('available', 'occupied')),
  -- Whether our team has approved the room. New rooms start as pending.
  approval_status  text           not null default 'pending'
                   check (approval_status in ('pending', 'approved', 'rejected')),
  -- When the owner last confirmed the room. Rooms not updated for 7
  -- days are hidden from students (see the policy below).
  last_updated_at  timestamptz    not null default now(),
  created_at       timestamptz    not null default now()
);

-- 2. Row Level Security --------------------------------------------
--
-- This site is on a public URL, so RLS is the lock on your data. Turn it
-- on, then write the policies. With RLS on and no policy, nobody can do
-- anything.

alter table listings enable row level security;

-- Students (logged out) and logged-in users may READ a room only if it is
-- approved AND was updated in the last 7 days. That one rule hides
-- pending, rejected and stale rooms, so no scheduled job is needed.
create policy "anyone can read approved recent listings"
  on listings for select
  to anon, authenticated
  using (
    approval_status = 'approved'
    and last_updated_at > now() - interval '7 days'
  );

-- Deliberately NO insert, update or delete policy yet. Until later
-- tickets add them, nobody can write rooms through the public site.

-- Reading is allowed by the policy above; this makes the permission
-- explicit for the public (anon) and logged-in roles. It grants nothing
-- to write.
grant select on listings to anon, authenticated;

-- 3. One sample room, so the live page has something to show -----------
--
-- It is clearly marked SAMPLE with a fake phone number. Delete it in
-- Ticket 05, once real owners can post rooms.

insert into listings
  (description, price_per_month, distance_km, contact_phone,
   availability, approval_status)
values
  ('SAMPLE — Bed space in a shared room, 5 minutes walk from PHINMA UI',
   1500, 0.4, '0900 000 0000', 'available', 'approved');

-- 4. Check it worked -------------------------------------------------
--
-- Supabase -> Table Editor: "listings" must NOT show an "RLS disabled"
-- warning.

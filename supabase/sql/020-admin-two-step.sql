-- 020 — Admin two-step verification, enforced by the database (Ticket 27)
--
-- *** OPTIONAL, AND ORDER MATTERS. Do NOT run this until: ***
--   1. every admin has set up two-step verification at /admin/security,
--   2. each has logged in again, entered a code, and reached the team page,
--   3. you have switched ADMIN_2FA to "on" in Vercel and that works too.
-- If you run it earlier, admins who have no code yet are locked out of every
-- admin action until you undo it (see the end of this file).
--
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
--
-- What this does: is_admin() is the one check that every admin-only rule in the
-- database uses (reading all rooms, permits, profiles, reports, plan requests
-- and messages; approving rooms; activating plans; deleting rooms). Until now it
-- asked only "is this account an admin?". It now also asks "did this login
-- include a code from the authenticator app?" (the login's assurance level,
-- "aal2"). So even someone with a stolen admin password, calling the database
-- directly and skipping every page, gets nothing without the code.
--
-- Nothing changes for students and owners. An admin who is only signed in with a
-- password can still use the owner pages like any owner; only the admin powers
-- need the code.

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
    -- the login must be a two-step one (password + code)
    and coalesce((select auth.jwt()) ->> 'aal', 'aal1') = 'aal2';
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- TO UNDO (if an admin is locked out): run this block in the SQL Editor. It
-- puts back the original check from 005. The SQL Editor is not affected by the
-- rule, because you are signed in to Supabase itself, not through the website.
--
-- create or replace function public.is_admin()
-- returns boolean
-- language sql
-- security definer
-- stable
-- set search_path = ''
-- as $$
--   select exists (
--     select 1 from public.profiles
--     where id = (select auth.uid()) and role = 'admin'
--   );
-- $$;
--
-- To remove one admin's authenticator (lost phone), open Supabase ->
-- Authentication -> Users -> that user -> remove the factor. They can then log
-- in with the password and set it up again.

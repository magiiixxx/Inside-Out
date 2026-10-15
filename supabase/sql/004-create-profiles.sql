-- 004 — Profiles: who is an owner, who is an admin (Ticket 04)
--
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Run it ONCE.
--
-- Supabase Auth keeps emails and passwords in its own private table
-- (auth.users). We never touch that. `profiles` is OUR table: one row per
-- account, holding the name and the role (owner or admin).

-- 1. The table ------------------------------------------------------

create table if not exists profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text        not null default '',
  role        text        not null default 'owner'
              check (role in ('owner', 'admin')),
  created_at  timestamptz not null default now()
);

-- 2. Row Level Security --------------------------------------------

alter table profiles enable row level security;

-- A logged-in user may read ONLY their own profile row.
create policy "users can read their own profile"
  on profiles for select
  to authenticated
  using ((select auth.uid()) = id);

-- Deliberately NO insert, update or delete policy. That means nobody can
-- create a profile, change a role, or promote themselves to admin through
-- the website. Profiles are created by the trigger below, always as
-- 'owner'. Admins are made by hand (see section 4).

grant select on profiles to authenticated;

-- 3. Create a profile automatically when someone signs up ---------------
--
-- A trigger is a rule the database runs by itself when something happens
-- — here, when a new account appears in auth.users. It runs with the
-- database's own rights ("security definer"), which is why the website
-- itself needs no permission to insert profiles. The role is always
-- 'owner', whatever the sign-up form says.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'owner');
  return new;
end;
$$;

-- Nobody should be able to call this function directly; only the trigger.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Making a team member an admin (do this by hand, only for the team) --
--
-- After the team member has signed up once, run this with THEIR email:
--
--   update profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'teammate@example.com');
--
-- (The SQL Editor can do this because it is not subject to the website's
-- Row Level Security. The website itself can never do it.)

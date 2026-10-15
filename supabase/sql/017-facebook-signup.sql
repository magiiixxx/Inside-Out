-- 017 — Sign up and log in with Facebook (Ticket 21)
--
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Run it ONCE, after 016.
--
-- What this does:
--   1. The sign-up trigger now also understands the name Facebook sends
--      (Facebook calls it "name"; the email form calls it "full_name").
--   2. Adds choose_account_type(): after a Facebook sign-up the person can be
--      made an OWNER, but ONLY in the first 10 minutes after their account
--      was created. Facebook cannot carry the "I am a student / owner" choice
--      inside the sign-up itself, as the email form does, so this is how the
--      choice is applied. After 10 minutes the function refuses, so nobody
--      can turn an old student account into an owner.
--
-- Facebook accounts are created as STUDENTS unless they choose owner in that
-- first window. Nobody can become an admin this way: only 'owner' is
-- accepted, and admins are still made by hand in the dashboard.

-- 1. The sign-up trigger: name from either place -------------------------------

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
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      ''
    ),
    case
      when new.raw_user_meta_data ->> 'account_type' = 'owner' then 'owner'
      else 'student'
    end
  );
  return new;
end;
$$;

-- 2. choose_account_type(): owner, in the first 10 minutes only ----------------

create or replace function public.choose_account_type(p_type text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user    uuid := (select auth.uid());
  v_created timestamptz;
begin
  if v_user is null then
    raise exception 'You must be logged in.';
  end if;

  -- Student is already the default, so there is nothing to do.
  if p_type is distinct from 'owner' then
    return;
  end if;

  select created_at into v_created from auth.users where id = v_user;

  if v_created is null or v_created < now() - interval '10 minutes' then
    raise exception 'The account type can only be chosen when the account is new.';
  end if;

  -- Only a student can become an owner here. Admins stay admins.
  update public.profiles
  set role = 'owner'
  where id = v_user and role = 'student';
end;
$$;

revoke execute on function public.choose_account_type(text) from public, anon;
grant execute on function public.choose_account_type(text) to authenticated;

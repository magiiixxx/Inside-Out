-- 019 — Report a problem / contact support, and changing your own name (Ticket 25)
--
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Run it ONCE, after 018, then tell Claude "done" (the website code is pushed
-- only after that, because it calls the new functions).
--
-- What this does:
--   1. A table of messages from users: bug reports, feedback and questions.
--      Only the person who wrote one, and the team, can read it. Nobody writes
--      to it directly: send_support_message() checks who is asking.
--   2. update_my_name(): the only way a person changes the name on their own
--      profile. (Profiles cannot be written to from the website, see 005.)
--   3. close_support_message(): the team marks a message as handled.

-- 1. The table ----------------------------------------------------------------

create table if not exists support_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('bug', 'feedback', 'question')),
  message     text not null check (length(message) between 10 and 1000),
  page        text check (page is null or length(page) <= 200),
  status      text not null default 'open' check (status in ('open', 'closed')),
  created_at  timestamptz not null default now(),
  closed_at   timestamptz
);

alter table support_messages enable row level security;

drop policy if exists "users read their own support messages" on support_messages;
create policy "users read their own support messages"
  on support_messages for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "admins read all support messages" on support_messages;
create policy "admins read all support messages"
  on support_messages for select to authenticated
  using (public.is_admin());

-- Read-only from the website, like favorites: all writing goes through the
-- functions below.
revoke all on support_messages from anon, authenticated;
grant select on support_messages to authenticated;

-- 2. send_support_message() -----------------------------------------------------

create or replace function public.send_support_message(
  p_kind    text,
  p_message text,
  p_page    text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user    uuid := (select auth.uid());
  v_message text := trim(coalesce(p_message, ''));
  v_page    text := nullif(trim(coalesce(p_page, '')), '');
begin
  if v_user is null then
    raise exception 'You must be logged in.';
  end if;

  if p_kind is null or p_kind not in ('bug', 'feedback', 'question') then
    raise exception 'Choose what kind of message this is.';
  end if;

  if length(v_message) < 10 or length(v_message) > 1000 then
    raise exception 'The message must be between 10 and 1000 characters.';
  end if;

  if v_page is not null and length(v_page) > 200 then
    v_page := left(v_page, 200);
  end if;

  -- A cap, so one account cannot flood the team: 10 messages a day.
  if (select count(*) from public.support_messages
      where user_id = v_user and created_at > now() - interval '1 day') >= 10 then
    raise exception 'You have sent too many messages today.';
  end if;

  insert into public.support_messages (user_id, kind, message, page)
  values (v_user, p_kind, v_message, v_page);
end;
$$;

revoke execute on function public.send_support_message(text, text, text) from public, anon;
grant execute on function public.send_support_message(text, text, text) to authenticated;

-- 3. close_support_message(): the team marks it handled ---------------------------

create or replace function public.close_support_message(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can close a message.';
  end if;

  update public.support_messages
  set status = 'closed', closed_at = now()
  where id = p_id and status = 'open';

  if not found then
    raise exception 'That message is not open.';
  end if;
end;
$$;

revoke execute on function public.close_support_message(uuid) from public, anon;
grant execute on function public.close_support_message(uuid) to authenticated;

-- 4. update_my_name(): change the name on your own profile -----------------------

create or replace function public.update_my_name(p_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_name text := trim(coalesce(p_name, ''));
begin
  if v_user is null then
    raise exception 'You must be logged in.';
  end if;

  if length(v_name) < 2 or length(v_name) > 80 then
    raise exception 'The name must be between 2 and 80 characters.';
  end if;

  update public.profiles set full_name = v_name where id = v_user;

  if not found then
    raise exception 'We could not find your profile.';
  end if;
end;
$$;

revoke execute on function public.update_my_name(text) from public, anon;
grant execute on function public.update_my_name(text) to authenticated;

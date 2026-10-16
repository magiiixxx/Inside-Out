-- 024 — Chat between a student and a room's owner (Ticket 34)
--
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Run it ONCE, after 023, then tell Claude "024 done" (the website code is pushed
-- only after that, because it uses the new tables and functions).
--
-- What this does:
--   1. conversations: one chat per student per room, between that student and the
--      room's owner.
--   2. messages: the messages inside a chat.
--   3. Row Level Security: only the two people in a chat can read it. NOBODY can
--      write to these tables directly: every write goes through the functions
--      below, which check who is asking (so a message cannot be sent "as" someone
--      else, and a chat cannot be opened with a room that is not approved).
--   4. Functions: start_conversation, send_message, mark_conversation_read,
--      unread_message_count, my_conversations, conversation_header.
--   5. Realtime: new messages appear on the other person's screen without
--      refreshing. Realtime also obeys Row Level Security.
--
-- Safety limits (so the chat cannot be used to spam an owner):
--   a message is 1 to 1000 characters; at most 10 messages a minute; a student
--   can open at most 10 new chats a day; only students open a chat, and only
--   with an approved room that is still visible.

-- 1. The tables ------------------------------------------------------------------

create table if not exists conversations (
  id              uuid primary key default gen_random_uuid(),
  listing_id      uuid not null references listings (id) on delete cascade,
  student_id      uuid not null references auth.users (id) on delete cascade,
  owner_id        uuid not null references auth.users (id) on delete cascade,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  last_sender_id  uuid references auth.users (id) on delete set null,
  student_read_at timestamptz not null default now(),
  owner_read_at   timestamptz not null default now(),
  unique (listing_id, student_id)
);

create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender_id       uuid not null references auth.users (id) on delete cascade,
  body            text not null check (char_length(body) between 1 and 1000),
  created_at      timestamptz not null default now()
);

create index if not exists messages_conversation_idx on messages (conversation_id, created_at);
create index if not exists messages_sender_idx on messages (sender_id, created_at);
create index if not exists conversations_student_idx on conversations (student_id, last_message_at desc);
create index if not exists conversations_owner_idx on conversations (owner_id, last_message_at desc);

-- 2. Row Level Security -----------------------------------------------------------

alter table conversations enable row level security;
alter table messages enable row level security;

-- Read only. There is no insert, update or delete policy on purpose.
drop policy if exists "Participants read their conversations" on conversations;
create policy "Participants read their conversations"
  on conversations for select to authenticated
  using (student_id = (select auth.uid()) or owner_id = (select auth.uid()));

drop policy if exists "Participants read their messages" on messages;
create policy "Participants read their messages"
  on messages for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.student_id = (select auth.uid()) or c.owner_id = (select auth.uid()))
    )
  );

revoke all on conversations from anon, authenticated;
revoke all on messages from anon, authenticated;
grant select on conversations to authenticated;
grant select on messages to authenticated;

-- 3. start_conversation(): a student writes the first message ---------------------

create or replace function public.start_conversation(p_listing_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user  uuid := (select auth.uid());
  v_role  text;
  v_owner uuid;
  v_body  text := trim(coalesce(p_body, ''));
  v_conv  uuid;
begin
  if v_user is null then
    raise exception 'You must be logged in.';
  end if;

  select role into v_role from public.profiles where id = v_user;
  if v_role is distinct from 'student' then
    raise exception 'Only students can start a chat.';
  end if;

  select owner_id into v_owner
  from public.listings
  where id = p_listing_id
    and approval_status = 'approved'
    and last_updated_at > now() - interval '7 days';
  if v_owner is null then
    raise exception 'That room is not available.';
  end if;

  if char_length(v_body) < 1 or char_length(v_body) > 1000 then
    raise exception 'Please write a message of up to 1000 characters.';
  end if;

  if (select count(*) from public.messages
      where sender_id = v_user and created_at > now() - interval '1 minute') >= 10 then
    raise exception 'You are sending messages too fast. Wait a minute.';
  end if;

  if not exists (select 1 from public.conversations
                 where listing_id = p_listing_id and student_id = v_user)
     and (select count(*) from public.conversations
          where student_id = v_user and created_at > now() - interval '1 day') >= 10 then
    raise exception 'You have started too many chats today. Try again tomorrow.';
  end if;

  insert into public.conversations (listing_id, student_id, owner_id)
  values (p_listing_id, v_user, v_owner)
  on conflict (listing_id, student_id) do nothing;

  select id into v_conv
  from public.conversations
  where listing_id = p_listing_id and student_id = v_user;

  insert into public.messages (conversation_id, sender_id, body)
  values (v_conv, v_user, v_body);

  update public.conversations
  set last_message_at = now(), last_sender_id = v_user, student_read_at = now()
  where id = v_conv;

  return v_conv;
end;
$$;

-- 4. send_message(): either person replies --------------------------------------

create or replace function public.send_message(p_conversation_id uuid, p_body text)
returns public.messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_conv public.conversations%rowtype;
  v_body text := trim(coalesce(p_body, ''));
  v_msg  public.messages%rowtype;
begin
  if v_user is null then
    raise exception 'You must be logged in.';
  end if;

  select * into v_conv
  from public.conversations
  where id = p_conversation_id
    and (student_id = v_user or owner_id = v_user);
  if not found then
    raise exception 'That chat was not found.';
  end if;

  if char_length(v_body) < 1 or char_length(v_body) > 1000 then
    raise exception 'Please write a message of up to 1000 characters.';
  end if;

  if (select count(*) from public.messages
      where sender_id = v_user and created_at > now() - interval '1 minute') >= 10 then
    raise exception 'You are sending messages too fast. Wait a minute.';
  end if;

  insert into public.messages (conversation_id, sender_id, body)
  values (p_conversation_id, v_user, v_body)
  returning * into v_msg;

  update public.conversations
  set last_message_at = v_msg.created_at,
      last_sender_id = v_user,
      student_read_at = case when student_id = v_user then v_msg.created_at else student_read_at end,
      owner_read_at   = case when owner_id = v_user then v_msg.created_at else owner_read_at end
  where id = p_conversation_id;

  return v_msg;
end;
$$;

-- 5. Reading: mark as read, the unread count, the list, the header ----------------

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.conversations
  set student_read_at = case when student_id = (select auth.uid()) then now() else student_read_at end,
      owner_read_at   = case when owner_id = (select auth.uid()) then now() else owner_read_at end
  where id = p_conversation_id
    and (student_id = (select auth.uid()) or owner_id = (select auth.uid()));
$$;

-- How many chats have a message from the OTHER person that I have not opened.
create or replace function public.unread_message_count()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.conversations c
  where c.last_sender_id is not null
    and c.last_sender_id <> (select auth.uid())
    and (
      (c.student_id = (select auth.uid()) and c.student_read_at < c.last_message_at)
      or (c.owner_id = (select auth.uid()) and c.owner_read_at < c.last_message_at)
    );
$$;

-- My chats, newest first. The other person's name comes from here because
-- profiles are private: an owner sees a student's FIRST name only.
create or replace function public.my_conversations()
returns table (
  id uuid,
  room_description text,
  room_address text,
  other_name text,
  last_body text,
  last_message_at timestamptz,
  last_sender_is_me boolean,
  unread boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    left(l.description, 120),
    l.address,
    case when c.student_id = (select auth.uid())
         then coalesce(nullif(po.full_name, ''), 'Owner')
         else coalesce(nullif(split_part(ps.full_name, ' ', 1), ''), 'Student') end,
    left(m.body, 140),
    c.last_message_at,
    c.last_sender_id = (select auth.uid()),
    c.last_sender_id is not null
      and c.last_sender_id <> (select auth.uid())
      and case when c.student_id = (select auth.uid())
               then c.student_read_at < c.last_message_at
               else c.owner_read_at < c.last_message_at end
  from public.conversations c
  join public.listings l on l.id = c.listing_id
  left join public.profiles po on po.id = c.owner_id
  left join public.profiles ps on ps.id = c.student_id
  left join lateral (
    select body from public.messages
    where conversation_id = c.id
    order by created_at desc limit 1
  ) m on true
  where c.student_id = (select auth.uid()) or c.owner_id = (select auth.uid())
  order by c.last_message_at desc
  limit 100;
$$;

-- The top of one chat: who it is with, and about which room.
create or replace function public.conversation_header(p_conversation_id uuid)
returns table (
  room_description text,
  room_address text,
  other_name text,
  i_am_student boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    left(l.description, 200),
    l.address,
    case when c.student_id = (select auth.uid())
         then coalesce(nullif(po.full_name, ''), 'Owner')
         else coalesce(nullif(split_part(ps.full_name, ' ', 1), ''), 'Student') end,
    c.student_id = (select auth.uid())
  from public.conversations c
  join public.listings l on l.id = c.listing_id
  left join public.profiles po on po.id = c.owner_id
  left join public.profiles ps on ps.id = c.student_id
  where c.id = p_conversation_id
    and (c.student_id = (select auth.uid()) or c.owner_id = (select auth.uid()));
$$;

-- Only logged-in people may call these.
revoke execute on function public.start_conversation(uuid, text) from public, anon;
revoke execute on function public.send_message(uuid, text) from public, anon;
revoke execute on function public.mark_conversation_read(uuid) from public, anon;
revoke execute on function public.unread_message_count() from public, anon;
revoke execute on function public.my_conversations() from public, anon;
revoke execute on function public.conversation_header(uuid) from public, anon;
grant execute on function public.start_conversation(uuid, text) to authenticated;
grant execute on function public.send_message(uuid, text) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
grant execute on function public.unread_message_count() to authenticated;
grant execute on function public.my_conversations() to authenticated;
grant execute on function public.conversation_header(uuid) to authenticated;

-- 6. Realtime: new messages and chat changes are pushed to the browser ------------

do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversations') then
    alter publication supabase_realtime add table public.conversations;
  end if;
end $$;

-- 013 — Premium upgrade requests (Ticket 16)
--
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Run it ONCE, after 012.
--
-- What this does:
--   1. Makes a table of upgrade requests. An owner on the Free plan asks for
--      Premium Owner and says how they will pay (GCash, Maya or bank).
--   2. Three functions: request_plan() for owners, activate_plan() and
--      dismiss_plan_request() for admins.
--
-- THE APP STILL HANDLES NO MONEY.
--   The owner pays the team directly (GCash, Maya or a bank account). Only
--   after the team has received the payment does an admin press "Activate",
--   which changes the owner's plan. Nobody can change a plan any other way
--   through the website.

-- 1. The table -------------------------------------------------------------

create table if not exists plan_requests (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users (id) on delete cascade,
  plan          text not null check (plan in ('premium')),
  pay_method    text not null check (pay_method in ('gcash', 'maya', 'bank')),
  contact_phone text not null check (length(contact_phone) between 7 and 20),
  status        text not null default 'pending'
                check (status in ('pending', 'activated', 'dismissed')),
  created_at    timestamptz not null default now(),
  decided_at    timestamptz
);

-- An owner can have only ONE waiting request at a time.
create unique index if not exists plan_requests_one_pending_per_owner
  on plan_requests (owner_id) where status = 'pending';

-- 2. Row Level Security ------------------------------------------------------
--
-- Owners read only their own requests; admins read all. There are NO write
-- policies, so nobody can insert, change or delete a request directly: all
-- writing goes through the functions below.

alter table plan_requests enable row level security;

drop policy if exists "owners read their own plan requests" on plan_requests;
create policy "owners read their own plan requests"
  on plan_requests for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "admins read all plan requests" on plan_requests;
create policy "admins read all plan requests"
  on plan_requests for select to authenticated
  using (public.is_admin());

-- 3. request_plan(): an owner asks for Premium ---------------------------------

create or replace function public.request_plan(
  p_plan           text,
  p_pay_method     text,
  p_contact_phone  text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid := (select auth.uid());
  v_role  text;
  v_plan  text;
begin
  if v_owner is null then
    raise exception 'You must be logged in.';
  end if;

  select role, plan into v_role, v_plan
  from public.profiles where id = v_owner;

  if v_role is distinct from 'owner' then
    raise exception 'Only owner accounts can request a plan.';
  end if;

  if v_plan <> 'free' then
    raise exception 'You are already on a paid plan.';
  end if;

  if p_plan is distinct from 'premium' then
    raise exception 'Only Premium Owner can be requested right now.';
  end if;

  if p_pay_method not in ('gcash', 'maya', 'bank') then
    raise exception 'Choose GCash, Maya or bank transfer.';
  end if;

  if length(trim(coalesce(p_contact_phone, ''))) < 7
     or length(trim(p_contact_phone)) > 20 then
    raise exception 'Please enter a phone number we can reach you on.';
  end if;

  insert into public.plan_requests (owner_id, plan, pay_method, contact_phone)
  values (v_owner, p_plan, p_pay_method, trim(p_contact_phone));
exception
  when unique_violation then
    raise exception 'You already have a request waiting.';
end;
$$;

revoke execute on function public.request_plan(text, text, text) from public, anon;
grant execute on function public.request_plan(text, text, text) to authenticated;

-- 4. activate_plan(): the team confirms payment ------------------------------------
--
-- The ONLY place a plan changes through the website. The very first thing it
-- does is check the caller is an admin.

create or replace function public.activate_plan(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req public.plan_requests%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Only admins can activate a plan.';
  end if;

  select * into v_req
  from public.plan_requests
  where id = p_request_id and status = 'pending'
  for update;

  if not found then
    raise exception 'That request is not waiting.';
  end if;

  update public.profiles set plan = v_req.plan where id = v_req.owner_id;

  update public.plan_requests
  set status = 'activated', decided_at = now()
  where id = p_request_id;
end;
$$;

revoke execute on function public.activate_plan(uuid) from public, anon;
grant execute on function public.activate_plan(uuid) to authenticated;

-- 5. dismiss_plan_request(): the team turns a request down -------------------------------

create or replace function public.dismiss_plan_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can dismiss a request.';
  end if;

  update public.plan_requests
  set status = 'dismissed', decided_at = now()
  where id = p_request_id and status = 'pending';

  if not found then
    raise exception 'That request is not waiting.';
  end if;
end;
$$;

revoke execute on function public.dismiss_plan_request(uuid) from public, anon;
grant execute on function public.dismiss_plan_request(uuid) to authenticated;

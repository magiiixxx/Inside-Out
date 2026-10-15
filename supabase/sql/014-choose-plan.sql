-- 014 — Owners choose which plan to request (Ticket 17)
--
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Run it ONCE, after 013.
--
-- What this does:
--   Lets a plan request be for Premium Owner OR Property Manager. An owner
--   on Free can ask for either; an owner on Premium can ask for Property
--   Manager. Nothing else changes: the owner still pays the team directly,
--   and only an admin can activate the plan.

-- 1. The table may now hold 'manager' requests ------------------------------

alter table plan_requests drop constraint if exists plan_requests_plan_check;
alter table plan_requests
  add constraint plan_requests_plan_check check (plan in ('premium', 'manager'));

-- 2. request_plan(): same name and arguments as in 013, new rules -----------

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

  if p_plan is null or p_plan not in ('premium', 'manager') then
    raise exception 'Choose Premium Owner or Property Manager.';
  end if;

  -- Only a step UP is allowed: free -> premium or manager, premium -> manager.
  if v_plan = 'manager' or v_plan = p_plan then
    raise exception 'You already have that plan.';
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

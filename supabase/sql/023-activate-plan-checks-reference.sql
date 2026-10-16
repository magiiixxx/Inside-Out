-- 023 — Activate checks the reference the admin saw; dismissed references can be reused
--
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Run it ONCE, after 022, then tell Claude "done" (the website code is pushed
-- only after that, because it calls the new version of activate_plan).
--
-- What this fixes (found in the code review of ticket 32):
--   1. An owner could change their reference number in the moment between the
--      admin reading it and pressing Activate, and the plan would switch on for
--      the NEW number. Now the admin page sends the reference it showed, and
--      activate_plan() refuses if the number on the request is different.
--   2. A dismissed request kept its reference number locked forever, so an owner
--      who really paid could not use the number again on a new request. The
--      "one reference, one request" rule now ignores dismissed requests.

-- 1. activate_plan(request, reference the admin saw) ---------------------------------

-- The old one-argument version is removed so nobody can call it and skip the check.
drop function if exists public.activate_plan(uuid);

create or replace function public.activate_plan(p_request_id uuid, p_reference text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req          public.plan_requests%rowtype;
  v_current_plan text;
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

  if v_req.payment_reference is null then
    raise exception 'There is no payment reference yet.';
  end if;

  if v_req.payment_reference is distinct from p_reference then
    raise exception 'The reference number changed. Check the new one first.';
  end if;

  select plan into v_current_plan
  from public.profiles where id = v_req.owner_id;

  if (case v_current_plan when 'manager' then 2 when 'premium' then 1 else 0 end)
     >= (case v_req.plan   when 'manager' then 2 when 'premium' then 1 else 0 end) then
    raise exception 'That owner already has this plan or a higher one.';
  end if;

  update public.profiles set plan = v_req.plan where id = v_req.owner_id;

  update public.plan_requests
  set status = 'activated', decided_at = now()
  where id = p_request_id;
end;
$$;

revoke execute on function public.activate_plan(uuid, text) from public, anon;
grant execute on function public.activate_plan(uuid, text) to authenticated;

-- 2. Dismissed requests no longer lock their reference number -----------------------

drop index if exists plan_requests_reference_unique;
create unique index plan_requests_reference_unique
  on plan_requests (lower(regexp_replace(payment_reference, '[ -]', '', 'g')))
  where payment_reference is not null and status <> 'dismissed';

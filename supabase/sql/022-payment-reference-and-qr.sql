-- 022 — Payment QR code and payment reference number (Ticket 32)
--
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Run it ONCE, after 021, then tell Claude "done" (the website code is pushed
-- only after that, because it uses the new columns and functions).
--
-- What this does:
--   1. A plan request can now carry the owner's PAYMENT REFERENCE NUMBER (the
--      number GCash, Maya or the bank gives after paying). A reference number
--      can be used for one request only, so one real payment cannot unlock
--      several plans.
--   2. submit_payment_reference(): the only way an owner adds the number, and
--      only to their own waiting request.
--   3. activate_plan() now refuses a request that has no reference number yet.
--      The team page shows the number, you check it against your own GCash,
--      Maya or bank records, and only then press Activate.
--   4. A PRIVATE storage bucket, "payment-qr", for your payment QR codes. The
--      QR code stays out of the code repository (which is public). An owner can
--      see a QR code ONLY while they have a waiting request, and only through a
--      link that stops working after a few minutes. Nobody can upload from the
--      website: you upload the files yourself in the Supabase dashboard.
--
-- BahayFind still takes no money. The owner pays outside the app.

-- 1. The reference number -----------------------------------------------------

alter table plan_requests add column if not exists payment_reference text;
alter table plan_requests add column if not exists reference_sent_at timestamptz;

-- 6 to 40 letters, numbers, spaces and dashes, with at least 6 real letters or
-- numbers among them (so "------" does not count). GCash references are numbers;
-- Maya's and banks' can include letters.
alter table plan_requests drop constraint if exists plan_requests_reference_format;
alter table plan_requests
  add constraint plan_requests_reference_format
  check (
    payment_reference is null
    or payment_reference ~ '^(?=(?:[^A-Za-z0-9]*[A-Za-z0-9]){6})[A-Za-z0-9 -]{6,40}$'
  );

-- One reference number, one request: compared without capitals, spaces or
-- dashes, so "1234 5678" and "12345678" count as the same number.
create unique index if not exists plan_requests_reference_unique
  on plan_requests (lower(regexp_replace(payment_reference, '[ -]', '', 'g')))
  where payment_reference is not null;

-- 2. submit_payment_reference(): the owner sends the number ---------------------

create or replace function public.submit_payment_reference(p_reference text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid := (select auth.uid());
  v_ref   text := trim(coalesce(p_reference, ''));
begin
  if v_owner is null then
    raise exception 'You must be logged in.';
  end if;

  if v_ref !~ '^(?=(?:[^A-Za-z0-9]*[A-Za-z0-9]){6})[A-Za-z0-9 -]{6,40}$' then
    raise exception 'Please enter the reference number from your payment.';
  end if;

  -- Only the caller's own WAITING request. Sending it again before the team
  -- has activated the plan simply replaces the number (for a typing mistake).
  update public.plan_requests
  set payment_reference = v_ref,
      reference_sent_at = now()
  where owner_id = v_owner and status = 'pending';

  if not found then
    raise exception 'You have no plan request waiting.';
  end if;
exception
  when unique_violation then
    raise exception 'That reference number was already used.';
end;
$$;

revoke execute on function public.submit_payment_reference(text) from public, anon;
grant execute on function public.submit_payment_reference(text) to authenticated;

-- 3. activate_plan(): needs a reference number -----------------------------------
--
-- Same as 015 (admin only, only ever a step UP), plus one new rule: the request
-- must have a payment reference number.

create or replace function public.activate_plan(p_request_id uuid)
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

revoke execute on function public.activate_plan(uuid) from public, anon;
grant execute on function public.activate_plan(uuid) to authenticated;

-- 4. The private bucket for payment QR codes -------------------------------------
--
-- public = false: nobody can open a file by its address. The website asks for a
-- short-lived link (a "signed URL"), and Storage hands one out only to someone
-- the rule below allows.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-qr', 'payment-qr', false, 2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = false,
      file_size_limit = 2097152,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Who may READ a QR code: an owner with a waiting plan request, and an admin
-- (with two-step, once 020 is on). There is no insert, update or delete rule,
-- so the website cannot change these files at all: you upload them yourself in
-- the dashboard (Storage -> payment-qr -> Upload file).
drop policy if exists "Owners with a waiting request read payment QR codes" on storage.objects;
create policy "Owners with a waiting request read payment QR codes"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'payment-qr'
    and (
      public.is_admin()
      or exists (
        select 1 from public.plan_requests
        where owner_id = (select auth.uid()) and status = 'pending'
      )
    )
  );

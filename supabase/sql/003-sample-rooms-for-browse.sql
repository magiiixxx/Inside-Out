-- 003 — Sample rooms to test the Browse screen (Ticket 03)
--
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Run it ONCE. It only adds rows, it does not change the table.
--
-- All rooms are clearly marked SAMPLE and use fake phone numbers. We
-- delete them in Ticket 05, once real owners can post rooms.
--
-- Of these 5 rooms, students should see ONLY the first two. The other
-- three are here to prove Row Level Security hides them:
--   - a pending room (team has not approved it yet)
--   - a rejected room
--   - a stale room (approved, but not updated for 10 days)

insert into listings
  (description, price_per_month, distance_km, contact_phone,
   availability, approval_status, last_updated_at)
values
  -- Visible: approved, recently updated, available
  ('SAMPLE — Single room with own fan, near the jeepney stop',
   2200, 0.8, '0900 000 0001', 'available', 'approved', now() - interval '1 day'),

  -- Visible: approved, recently updated, occupied (shown with an Occupied label)
  ('SAMPLE — Bed space in a room for 4, includes water',
   1200, 1.5, '0900 000 0002', 'occupied', 'approved', now() - interval '3 days'),

  -- Hidden: still waiting for team approval
  ('SAMPLE (pending) — should NOT appear to students',
   1000, 0.5, '0900 000 0003', 'available', 'pending', now()),

  -- Hidden: team rejected it
  ('SAMPLE (rejected) — should NOT appear to students',
   900, 0.6, '0900 000 0004', 'available', 'rejected', now()),

  -- Hidden: approved, but not updated for more than 7 days
  ('SAMPLE (stale, 10 days old) — should NOT appear to students',
   1100, 0.7, '0900 000 0005', 'available', 'approved', now() - interval '10 days');

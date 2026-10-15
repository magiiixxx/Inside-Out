-- Remove the leftover SAMPLE rooms and test rooms.
--
-- This is a one-off clean-up, NOT a numbered database change, so it is not part
-- of rebuilding the database from the repo. Run it in the Supabase dashboard:
-- SQL Editor -> New query. Run STEP 1 first and read the result. Only then run
-- STEP 2.

-- STEP 1: look at every room, including pending, rejected and hidden ones.
-- A sample room has no owner. Real rooms have an owner.
select
  id,
  left(description, 60) as description,
  approval_status,
  case when owner_id is null then 'NO OWNER (sample)' else 'owner' end as who,
  created_at
from listings
order by created_at desc;

-- STEP 2: delete the sample rooms (the ones with no owner) and any test room
-- you can name. Deleting a room also deletes its permit check, saved-room
-- entries, ratings and reports. Change the words in the second line to match
-- your own test rooms, and run STEP 1 again to make sure only test rooms are
-- listed before you press Run.
--
-- delete from listings
-- where owner_id is null
--    or description ilike '%pwede bembangan%';

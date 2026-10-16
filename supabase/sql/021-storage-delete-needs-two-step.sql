-- 021 — Deleting photo files now needs the admin two-step check (code review fix)
--
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Run it ONCE. It is safe to run whether or not you have run 020 yet.
--
-- The problem this fixes
--   Every admin-only rule in the database asks public.is_admin(). After file 020,
--   is_admin() is true only for an admin whose login included a code from the
--   authenticator app. But the rule that lets an admin delete ANY room's photo
--   file (written in 012) checked the admin role directly instead of asking
--   is_admin(). So someone with a stolen admin PASSWORD, and no code, could
--   still delete photo files by calling Storage directly.
--
-- What this does
--   Replaces that one rule. An owner can still delete files in their own folder,
--   exactly as before. An admin can delete any file only when is_admin() says
--   so, which (after 020) means: signed in with the password AND a code.
--
-- Effects to expect
--   - Owners: no change.
--   - Admins WITH two-step (the normal case after 020): no change. Deleting a
--     room from the team page still removes its photo.
--   - If 020 has not been run: is_admin() is just "is this an admin", so nothing
--     changes yet; the rule gets stricter automatically the moment 020 runs.
--   - A password-only admin session can no longer delete other people's photos.

drop policy if exists "Owners and admins delete photos" on storage.objects;

create policy "Owners and admins delete photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'room-photos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.is_admin()
    )
  );

-- To check it took effect, run this on its own. The "qual" column should now
-- contain is_admin() and no longer contain the word 'admin' in quotes:
--
--   select policyname, qual
--   from pg_policies
--   where schemaname = 'storage' and tablename = 'objects'
--     and policyname = 'Owners and admins delete photos';
--
-- TO UNDO (puts back the old, weaker rule from 012):
--
--   drop policy if exists "Owners and admins delete photos" on storage.objects;
--   create policy "Owners and admins delete photos"
--     on storage.objects for delete to authenticated
--     using (
--       bucket_id = 'room-photos'
--       and (
--         (storage.foldername(name))[1] = (select auth.uid())::text
--         or exists (
--           select 1 from public.profiles
--           where id = (select auth.uid()) and role = 'admin'
--         )
--       )
--     );

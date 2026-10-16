# 27 — Two-step verification for the team (admin) accounts

**What to build:** A team member can add an authenticator app (a 6-digit code
that changes every 30 seconds) to their admin login. Once the team switches it
on, opening the team page needs the password AND the code, and the database
itself refuses admin actions without the code. This stops a stolen or guessed
admin password from opening the team page.

**Blocked by:** 24

**Status:** done

- [x] An admin can open Two-step (link on the team page) and set it up by
      scanning a QR code and typing one code from the app.
- [x] A wrong or expired code shows a clear message and does not set anything up.
- [x] A person who is not an admin sees the Not found page on both two-step pages.
- [x] With ADMIN_2FA off, the team page works as before for admins.
- [x] With ADMIN_2FA on, an admin who has set up the app is sent to a code page
      after logging in, and reaches the team page only after a correct code.
- [x] With ADMIN_2FA on, an admin who has NOT set up the app is sent to the set-up
      page instead of being shown the team page.
- [x] An admin can turn two-step off, but only after logging in with a code.
- [x] Too many wrong codes show a "please wait" message.
- [x] After the optional database rule is run, an admin without a code cannot read
      or change anything admin-only, even by skipping the pages.
- [x] Students and owners are not affected.
- [x] Works on the live URL

## How to switch it on safely (in this order)

1. In Supabase, check Authentication, Sign In / Providers, Multi Factor
   Authentication: the authenticator app (TOTP) option must be enabled. It is by
   default.
2. Each admin: log in, open the team page, press **Two-step** in the left panel,
   and set it up. Save the secret key somewhere safe too (it re-creates the app
   if the phone is lost).
3. Each admin: log out, log in again. The team page still opens (the switch is
   off). Open Two-step and check it says "Verified with a code" after you log in
   through the code page (step 5 shows how).
4. In Vercel add `ADMIN_2FA` = `on` and redeploy. Now each admin logging in is
   asked for a code before the team page opens.
5. Only when that works for every admin: run the database file
   `supabase/sql/020-admin-two-step.sql`. Its last lines say how to undo it.

If a phone is lost: in Supabase, Authentication, Users, open that person and
remove their factor, then they log in with the password and set it up again.
If every admin is locked out: run the undo block at the end of the 020 file.

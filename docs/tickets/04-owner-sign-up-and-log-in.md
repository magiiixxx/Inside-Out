# 04 — Owner sign up and log in

**What to build:** A boarding house owner can create an account, log in,
log out, and land on their own home page.

**Blocked by:** 02

**Status:** done

- [x] "Confirm email" is turned off in the Supabase Auth settings for the
      demo.
- [x] An owner can sign up with email and password and is logged in.
- [x] An owner can log in and log out.
- [x] The profiles table exists with Row Level Security ON. A user can
      read and create only their own row, and only with the role
      `owner`. Nobody can change their own role.
- [x] After login the owner lands on their home page, which says they
      have no rooms yet.
- [x] A logged-out visitor who opens the owner home page is sent to the
      log in screen.
- [x] Works on the live URL

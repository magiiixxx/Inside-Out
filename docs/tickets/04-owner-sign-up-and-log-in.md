# 04 — Owner sign up and log in

**What to build:** A boarding house owner can create an account, log in,
log out, and land on their own home page.

**Blocked by:** 02

**Status:** todo

- [ ] "Confirm email" is turned off in the Supabase Auth settings for the
      demo.
- [ ] An owner can sign up with email and password and is logged in.
- [ ] An owner can log in and log out.
- [ ] The profiles table exists with Row Level Security ON. A user can
      read and create only their own row, and only with the role
      `owner`. Nobody can change their own role.
- [ ] After login the owner lands on their home page, which says they
      have no rooms yet.
- [ ] A logged-out visitor who opens the owner home page is sent to the
      log in screen.
- [ ] Works on the live URL

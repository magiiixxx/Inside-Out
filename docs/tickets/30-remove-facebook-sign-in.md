# 30 — Remove Facebook sign-in

**What to build:** Facebook is no longer a way to sign up or log in. The Log in
and Sign up pages offer email and password, and Google when it is switched on.
People who already made an account with Facebook can still get in by choosing a
password through the email link.

**Blocked by:** 23

**Status:** todo

- [ ] The Log in and Sign up pages show no Facebook button.
- [ ] A request that names Facebook as the sign-in method is refused with the
      normal friendly message.
- [ ] Google sign-in, email sign-up and email log in all still work, and the
      Student / Owner choice still picks the right Google button.
- [ ] The Privacy page and the sign-up note no longer mention Facebook sign-in.
- [ ] An account made earlier with Facebook sees, in Settings, Security, how to
      create a password by email link, and can then log in with email and password.
- [ ] The team's own Facebook page contact link is not affected.
- [ ] No Facebook sign-in switch or secret remains in the project.
- [ ] Works on the live URL

## What the team must also do (outside the code)

1. **Supabase:** Authentication, Sign In / Providers, Facebook: switch it **off**.
   Until you do, a person could still reach Facebook sign-in by calling Supabase
   directly, skipping our pages.
2. **Vercel:** delete the `NEXT_PUBLIC_FACEBOOK_LOGIN` variable (Project,
   Settings, Environment Variables) and redeploy.
3. **Facebook (optional):** you may delete the Facebook app at
   developers.facebook.com, so its App ID and secret no longer exist anywhere.
4. Tell anyone who signed up with Facebook to use **Forgot password** on the Log in
   page, with the same email, to set a password.

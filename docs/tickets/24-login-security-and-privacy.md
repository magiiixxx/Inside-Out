# 24 — Safer login: passwords, recovery, privacy and browser protection

**What to build:** Logging in and signing up are harder to abuse and kinder
to people's privacy. Passwords must be stronger, a person who forgets one can
get back in, creating an account means agreeing to the Privacy page, the
forms never reveal who has an account, pages deny by default when a role is
missing, and the browser is told to use its built-in protections.

**Blocked by:** 23

**Status:** todo

- [ ] A new password needs at least 8 characters with a letter and a number,
      on sign up and on reset.
- [ ] Sign up needs the Privacy page tick box, and the Log in and Sign up
      pages say how the email is used and link to the Privacy page.
- [ ] "Forgot password?" on the Log in page leads to a form. Whatever email
      is typed, the answer is the same message, and an email with a one-time
      link arrives only if the account exists.
- [ ] The link opens a "New password" page. Saving works, logs the account
      out of other devices, and lands on the person's home page.
- [ ] Using the link a second time, or opening the New password page without
      a link, sends the person to ask for a new link.
- [ ] A wrong email and a wrong password show the same message at log in. A
      sign up with an email that already exists does not say so.
- [ ] A logged-out visitor opening Saved rooms or any owner page goes to the
      Log in page. An account with no role cannot open the owner pages.
- [ ] Every page is sent with the browser protection headers (nosniff,
      no framing, referrer policy, permissions policy, HSTS).
- [ ] Google and Facebook login still work.
- [ ] Works on the live URL

## Setting to check in Supabase (once)

Authentication, Sign In / Providers, Email: set the **Minimum password
length** to 8 (or more). The website enforces 8 with a letter and a number,
and this makes Supabase refuse weaker passwords even if the website is
bypassed. If your plan offers "Leaked password protection", switch it on.

# 21 — Sign up and log in with Facebook

**What to build:** People can create an account or log in with Facebook as
well as with email. On the Sign up page they choose "as a student" or "as an
owner" with the button they press. The Facebook button only appears once the
team has set up the Facebook app and switched it on. A Privacy page explains
what we keep.

**Blocked by:** 20

**Status:** done

- [x] The Log in page has "Continue with Facebook" and the Sign up page has
      "Sign up with Facebook as a student" or "…as an owner" (only the button for the
      account type chosen above it is shown), but only when
      NEXT_PUBLIC_FACEBOOK_LOGIN is "true".
- [x] A new person signing up with Facebook as a student lands on Saved rooms
      with a student account; as an owner, on the owner home with an owner
      account.
- [x] Their name from Facebook is saved on their profile.
- [x] Logging in again with Facebook signs them into the same account.
- [x] An account older than 10 minutes cannot be turned into an owner by
      pressing the owner button, and nobody can become an admin this way.
- [x] If Facebook fails or is cancelled, the person sees a clear message and
      can still use email and password.
- [x] The Privacy page is public and linked from the footer.
- [x] No Facebook secret appears anywhere in the project.
- [x] Works on the live URL

## Setup the team must do (once)

1. **Facebook:** at developers.facebook.com, create an app (use "Authenticate
   and request data from users with Facebook Login"). Add the "Facebook
   Login" product. Copy the **App ID** and **App Secret** (Settings, Basic).
2. **Supabase:** Authentication, Providers, Facebook. Switch it on, paste the
   App ID and App Secret, and copy the **Callback URL** shown there.
3. **Facebook again:** Facebook Login, Settings, Valid OAuth Redirect URIs:
   paste that Callback URL. Settings, Basic: set the Privacy Policy URL to
   `https://inside-out-two.vercel.app/privacy` and the User data deletion
   instructions URL to `https://inside-out-two.vercel.app/privacy#delete-your-data`.
4. **Supabase:** Authentication, URL Configuration. Site URL:
   `https://inside-out-two.vercel.app`. Add to Redirect URLs:
   `https://inside-out-two.vercel.app/auth/callback` (and
   `http://localhost:3000/auth/callback` to test on your own computer).
5. **Vercel:** add the variable `NEXT_PUBLIC_FACEBOOK_LOGIN` = `true`
   (Project, Settings, Environment Variables), then redeploy.
6. **Facebook:** while the app is in "Development" mode only people added as
   testers or developers can log in. Switch the app to **Live** so everyone
   can.

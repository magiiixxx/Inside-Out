# 23 — Sign up and log in with Google

**What to build:** People can create an account or log in with Google, the same
way they can with Facebook. On the Sign up page the Google button follows the
Student / Owner choice just like the Facebook one. The Google button only
appears once the team has set up Google sign-in and switched it on.

**Blocked by:** 21

**Status:** done

- [x] The Log in page has "Continue with Google" and the Sign up page has
      "Sign up with Google as a student" or "…as an owner" (only the one for
      the chosen account type is shown), but only when NEXT_PUBLIC_GOOGLE_LOGIN
      is "true".
- [x] A new person signing up with Google as a student lands on Saved rooms;
      as an owner, on the owner home.
- [x] Their name from Google is saved on their profile.
- [x] Logging in again with Google signs them into the same account.
- [x] An account older than 10 minutes cannot be turned into an owner by
      pressing the owner button, and nobody can become an admin this way.
- [x] If Google fails or is cancelled, the person sees a clear message and can
      still use email and password.
- [x] Facebook sign-in still works, and both buttons can be shown together.
- [x] No Google secret appears anywhere in the project.
- [x] Works on the live URL

## Setup the team must do (once)

1. **Google Cloud:** at console.cloud.google.com create a project (for example
   "BahayFind"). Open APIs & Services, OAuth consent screen: choose External,
   fill in the app name and your support email, and set the privacy policy link
   to `https://inside-out-two.vercel.app/privacy`. Keep the default scopes
   (email, profile, openid).
2. **Google Cloud:** Credentials, Create credentials, OAuth client ID, type
   "Web application". Under Authorized redirect URIs add the **Callback URL**
   shown on the Google page in Supabase (step 3). Copy the **Client ID** and
   **Client secret**.
3. **Supabase:** Authentication, Providers, Google. Switch it on, paste the
   Client ID and Client secret, and save. (The Callback URL is shown on this
   page, so you can come back to step 2.)
4. **Supabase:** the redirect addresses from the Facebook setup already cover
   Google (Site URL `https://inside-out-two.vercel.app` and
   `https://inside-out-two.vercel.app/auth/callback`). Nothing more to add.
5. **Vercel:** add `NEXT_PUBLIC_GOOGLE_LOGIN` = `true` (Project, Settings,
   Environment Variables), then redeploy.
6. **Google Cloud:** while the consent screen is in "Testing", only the test
   users you add can log in. Press **Publish app** so everyone can.

The database needs nothing new: SQL file 017 already handles names from
Google and the owner choice for new accounts.

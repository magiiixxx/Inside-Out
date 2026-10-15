# 02 — Connected to Supabase

**What to build:** The website talks to the hosted Supabase database. A
visitor to the live site sees a sample room that was read from the
database, protected by Row Level Security.

**Blocked by:** 01

**Status:** done

- [x] The two Supabase variables (project URL and publishable key) are
      set in `.env.local` and in Vercel, and the site was redeployed.
- [x] The listings table exists, created by a numbered SQL file in the
      repo so the database can be rebuilt.
- [x] Row Level Security is ON for the listings table.
- [x] A policy lets anyone read only rooms that are approved and updated
      in the last 7 days. Nobody can write rooms yet from the public
      site. (Tested: an anonymous insert is refused by RLS.)
- [x] One sample approved room is shown on the live page, read from
      Supabase.
- [x] No `service_role` or `sb_secret_` key is anywhere in the project.
- [x] Works on the live URL

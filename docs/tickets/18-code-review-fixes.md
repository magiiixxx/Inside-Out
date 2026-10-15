# 18 — Fixes from the code review of tickets 08–17

**What to build:** The problems the review found are fixed. Nothing new is
added for users: owners and students see the same screens, but mistakes are
caught earlier and pages load a little faster.

**Blocked by:** 17

**Status:** done

- [x] Choosing a photo that is too big or not a JPG, PNG or WebP shows a
      clear message straight away and the form is not sent.
- [x] Activating a plan request never lowers an owner's plan. If the owner
      already has that plan or a better one, the team sees a message and can
      Dismiss the request.
- [x] The database itself refuses a price above ₱100,000, a distance above
      50 km, and a phone number that is not 7 to 20 digits and symbols, even
      if the website's form is skipped.
- [x] Each page asks Supabase who is logged in once, not twice.
- [x] Plan prices are written in one place.
- [x] The spec matches what is built (student accounts, five tables, admins
      reading profiles).
- [x] Unused styles are removed.
- [x] Works on the live URL

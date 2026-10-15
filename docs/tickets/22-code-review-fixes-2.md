# 22 — Fixes from the code review of tickets 18–21

**What to build:** Ratings are harder to fake and easier to clean up, an owner
is told when a room was hidden because of a report, and the team page is made
of small pieces instead of one very long file. A phone-link bug on the plan
requests is fixed along the way.

**Blocked by:** 21

**Status:** todo

- [ ] A student can rate a room only after saving it. On a room they have not
      saved, the card says "Save this room to rate it", and the database
      refuses a rating for an unsaved room.
- [ ] The team can reset the ratings of a room from the Other rooms list, and
      the room then shows "No ratings yet".
- [ ] A room's average always matches its ratings, even when a student's
      account is deleted. Deleting a room still works.
- [ ] When the team hides a room because of a report, its owner sees "Our team
      is checking a report about this room". The message goes away when the
      team approves or rejects the room.
- [ ] The Privacy page says Facebook shares the name, email, profile picture
      link and account id.
- [ ] The star buttons are bigger and fit on a phone.
- [ ] The Facebook return address can be fixed with the SITE_URL setting.
- [ ] The phone number on a plan request taps to call correctly.
- [ ] The team page is split into small files, and the id check and form
      reader are written in one place.
- [ ] Works on the live URL

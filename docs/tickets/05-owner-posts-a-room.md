# 05 — Owner posts a room

**What to build:** A logged-in owner fills in a form to post a room. The
room is saved as pending and appears on the owner's home page with a
status badge. Students cannot see it yet.

**Blocked by:** 04

**Status:** todo

- [ ] The form asks for description, price per month, distance from
      PHINMA UI, contact phone, permit number, and the three validation
      questions.
- [ ] The form has a tick box "I understand my phone number will be
      public", which must be ticked to submit.
- [ ] The room is saved for the logged-in owner only, always with status
      pending.
- [ ] The listing_checks table exists with Row Level Security ON. Only
      the room's owner and admins can read or write it. A logged-out
      visitor cannot read it.
- [ ] The owner home page lists the owner's rooms with a status badge
      (pending, approved or rejected).
- [ ] A pending room does not appear on the student Browse screen.
- [ ] Works on the live URL

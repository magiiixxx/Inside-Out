# 09 — Student accounts and favorites

**What to build:** A student can create an account, log in, save rooms
they like, and see their saved rooms in one place. Browsing stays open
to everyone without logging in.

**Blocked by:** 03, 04

**Status:** done

- [x] Sign up asks whether the person is a student or a boarding house
      owner. The choice can never create an admin, even if the form is
      tampered with.
- [x] A new student account lands on the Saved rooms page. An owner
      still lands on the owner home page. Log in sends each role to its
      own page.
- [x] A logged-in student sees a Save button on each room on the student
      page, and the button shows Saved for rooms already saved.
- [x] Owners and admins do not see Save buttons, and a student who opens
      the owner pages is sent to Saved rooms.
- [x] A student cannot post a room.
- [x] The Saved rooms page lists the student's saved rooms with price,
      distance, available/occupied label, phone and a Remove button.
- [x] A saved room that is hidden or deleted does not show, and does not
      break the page.
- [x] A student can only see and change their own saved rooms. A logged-out
      visitor cannot read or change anyone's saved rooms.
- [x] A student can save at most 50 rooms.
- [x] Works on the live URL

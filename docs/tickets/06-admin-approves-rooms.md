# 06 — Admin approves rooms

**What to build:** A team member opens a hidden admin page, sees pending
rooms with the owner's permit number and answers, and approves or
rejects them. Approved rooms then appear to students.

**Blocked by:** 05

**Status:** done

- [x] A team member is made an admin by hand in the Supabase dashboard.
- [x] The admin page requires a login and the admin role, enforced by
      Row Level Security, not only by hiding the address.
- [x] A logged-out visitor or a normal owner who opens the admin page
      sees the Not found page.
- [x] The admin page lists pending rooms with the permit number and the
      validation answers.
- [x] Approve and reject buttons change the approval status.
- [x] An owner can never change the approval status of their own room.
- [x] An approved room appears on the student Browse screen, and the
      owner sees the badge change to approved.
- [x] The full demo path works: owner posts, admin approves, student
      sees the room.
- [x] Works on the live URL

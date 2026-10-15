# 07 — Owner keeps the room honest

**What to build:** An owner can mark a room available or occupied and
renew it, and is warned before a room hides because it has not been
updated.

**Blocked by:** 05

**Status:** done

- [x] An owner can mark their own room available or occupied, and
      students see the label change.
- [x] An owner can renew a room, which sets its last updated time to
      now, and a hidden room becomes visible to students again.
- [x] An owner can change only the availability and renew. They cannot
      change the approval status, price or description, and cannot
      change another owner's room.
- [x] A banner on the owner home page warns when a room is about to hide
      and when it is already hidden.
- [x] A room not updated for 7 days disappears from the student Browse
      screen.
- [ ] The SAMPLE rooms are deleted from the database before the real
      demo.
- [x] Works on the live URL

**Cut first if time is short:** the "about to hide" banner.

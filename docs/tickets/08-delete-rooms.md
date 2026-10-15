# 08 — Delete rooms

**What to build:** An owner can delete their own rooms, and an admin can
delete any room. This closes a gap: the spec says an owner changes a
room's price or description by deleting it and posting it again, but no
ticket built a delete button.

**Blocked by:** 05, 06

**Status:** done

- [x] Every room on the owner home page has a "Delete this room" control
      that asks for confirmation before deleting.
- [x] An owner can delete their own room whatever its status, and the
      room disappears from the student page.
- [x] An owner cannot delete another owner's room.
- [x] The team page lists rooms that are already approved or rejected,
      each with a confirmed delete, so spam and test rooms can be removed.
- [x] A room's private permit check is deleted with the room.
- [x] A logged-out visitor cannot delete anything.
- [x] Works on the live URL

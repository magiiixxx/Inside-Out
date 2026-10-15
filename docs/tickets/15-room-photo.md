# 15 — One photo per room

**What to build:** An owner can add one photo to a room, on every plan, when
posting it or later when editing. Students see the photo on the room card
once the room is approved. Replacing the photo sends an approved room back
to the team for checking, like changing the phone number.

**Blocked by:** 13

**Status:** done

- [x] The Add a room and Edit a room forms have an optional photo field that
      accepts JPG, PNG or WebP up to 2 MB.
- [x] A file that is too big, or is not really a JPG, PNG or WebP (for
      example a renamed document), is refused with a clear message.
- [x] The photo shows on the owner's room, on the team's review page, and
      on the student's room card. Rooms without a photo still show the
      house drawing.
- [x] A pending room's photo does not appear to students until the room is
      approved.
- [x] Replacing the photo of an approved room sends it back to pending.
- [x] An owner cannot add a file to another owner's folder, and a student
      account cannot upload at all.
- [x] Deleting a room, or replacing its photo, removes the old file.
- [x] Works on the live URL

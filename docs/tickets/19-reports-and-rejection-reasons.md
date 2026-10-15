# 19 — Report a room, and say why a room was rejected

**What to build:** A logged-in student can report a problem with a room they
can see (already taken, wrong phone, wrong details, scam, other). The team
sees the open reports and can hide the room until it has been checked, or
close the report. Separately, when the team rejects a room they must write
why, and the owner reads the reason on their home page.

**Blocked by:** 18

**Status:** done

- [x] A logged-in student sees "Report a problem with this room" on each room
      card, picks a reason, optionally adds a note, and sends it.
- [x] A student cannot report the same room twice while the first report is
      open. Logged-out visitors and owners do not get the report form.
- [x] The team page lists open reports with the room, the problem, the note,
      who reported it, and the owner's phone number.
- [x] "Hide room until checked" takes the room off the student list (back to
      waiting for review) and closes every open report about it. "Mark
      resolved" closes just that report.
- [x] Rejecting a room needs a reason of at least 5 characters. Approving
      does not.
- [x] The owner sees the reason on a rejected room, and it disappears once
      they edit the room or the team approves it.
- [x] Only an admin can resolve a report or review a room, even if the
      database function is called directly.
- [x] Works on the live URL

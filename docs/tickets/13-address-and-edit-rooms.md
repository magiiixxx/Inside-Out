# 13 — Address and editing rooms

**What to build:** Every room has an address that students can see, and
an owner can edit their own rooms. Changing only the price goes live
straight away. Changing the description, distance, address or phone number
sends the room back to the team for approval, so an approved room cannot
be quietly turned into something else.

**Blocked by:** 05, 06

**Status:** todo

- [ ] The Add a room form asks for an address and a tick box "I
      understand the address will be public". A room cannot be posted
      without both.
- [ ] Students see the address on each room that has one. Older rooms
      without an address still show normally.
- [ ] The team sees the address when reviewing a room.
- [ ] Each room on the owner home page has an Edit button, whatever its
      status.
- [ ] Changing only the price of an approved room keeps it visible to
      students, with the new price.
- [ ] Changing the description, distance, address or phone number of an
      approved room sends it back to pending, hides it from students, and
      tells the owner so.
- [ ] Editing a rejected room sends it back to pending for review.
- [ ] An owner cannot open the edit page for, or change, someone else's
      room, and the database refuses it even if the form is tampered with.
- [ ] An owner cannot change a room's approval status, permit, or plan by
      editing.
- [ ] Works on the live URL

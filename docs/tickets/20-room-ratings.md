# 20 — Rate a room

**What to build:** A logged-in student can give a room 1 to 5 stars, once
per room, and can change it later. Every visitor sees the average and the
number of ratings on the room card. Owners see the average on their own
rooms. There are no written reviews.

**Blocked by:** 19

**Status:** todo

- [ ] A logged-in student sees five star buttons on each room card; pressing
      one saves the rating, and pressing another changes it.
- [ ] The student's own rating is shown filled in.
- [ ] Every visitor sees "★ 4.3 (12)" on a room that has ratings and "No
      ratings yet" on one that has none.
- [ ] A student has one rating per room: rating again replaces the old one
      and the average updates.
- [ ] Owners, admins and logged-out visitors cannot rate, even by calling the
      database function directly.
- [ ] Only a room students can currently see can be rated.
- [ ] The owner's home page shows the average and the number of students for
      an approved room.
- [ ] Works on the live URL

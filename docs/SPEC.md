# Spec: BahayFind

## Problem
A new student near PHINMA UI searches for a room through Facebook
groups and messages many owners one by one. Posts stay up after the room
is taken, so students travel to rooms that are no longer free. Richelle
messaged 8+ owners and lost about ₱900 and 6+ hours on one such trip.

## Solution
Owners post their own rooms on BahayFind, each labelled **available** or
**occupied**. Our team approves every posting before students can see it.
Rooms that an owner has not updated for 7 days are hidden automatically.
A student opens the site, sees only approved, recently updated rooms,
and calls only the owners with rooms that are free.

## The user
The **student (seeker)** looking for a room near PHINMA UI. Two other
roles support the student: the **owner**, who posts rooms, and the
**admin** (our team), who approves them.

## User stories
1. As a student, I want to browse approved rooms near PHINMA UI without
   logging in, so that I can see what is free right now.
2. As a student, I want to filter by maximum price and sort by distance
   from PHINMA UI, so that I find a room I can afford and reach.
3. As a student, I never see pending, rejected or stale rooms, so that I
   am not sent to a room that is gone.
4. As an owner, I want to sign up and log in, so that I can manage my
   own rooms.
5. As an owner, I want to post a room with its details, permit number
   and answers to the validation questions, so that the team can approve
   it.
6. As an owner, I want to mark my room available or occupied, so that
   students see the truth.
7. As an owner, I want to be warned when a room is about to hide and be
   able to renew it, so that my room stays visible while it is free.
8. As an admin, I want to review pending rooms with their permit and
   answers and approve or reject them, so that students can trust what
   they see.

## Screens
1. **Browse rooms** (public): cards for approved rooms, each showing
   price, distance from PHINMA UI, an available/occupied label, last
   updated and the owner's phone. Max-price filter and sort by distance.
2. **Sign up / Log in**: email and password, for owners and admins.
3. **Owner home**: the owner's rooms with a status badge (pending,
   approved, rejected, hidden). A banner warns when a room is about to
   hide or is already hidden. Buttons: mark available/occupied, renew,
   and add a room.
4. **Add a room**: description, price per month, distance from PHINMA
   UI, contact phone, permit number, the three validation questions, and
   a tick box "I understand my phone number will be public".
5. **Admin page** (hidden address): pending rooms with the owner's
   permit number and answers, and approve / reject buttons. A person who
   is not an admin sees the Not found page.
6. **Not found**.

## Data
Row Level Security (RLS) is ON for every table.

**profiles**
- Columns: user id, name, role (`owner` or `admin`).
- A user may read and create only their own row, and only with role
  `owner`.
- Nobody may change their own role. Team members are made admins by hand
  in the Supabase dashboard.

**listings**
- Columns: owner (user id), description, price per month, distance in km
  from PHINMA UI, contact phone, availability (`available` or
  `occupied`), approval status (`pending`, `approved` or `rejected`),
  last updated, created at.
- Anyone, including logged-out visitors, may read rows that are
  `approved` **and** updated within the last 7 days. This rule is what
  hides stale rooms, so no scheduled job is needed.
- An owner may read all of their own rows, and create rows only for
  themselves with status `pending`.
- An owner may change only the availability of their own row, and renew
  it (which sets last updated to now). An owner can never change the
  approval status. To change price or description they delete the room
  and post it again. An owner may delete their own rooms.
- An admin may read all rows, change the approval status, and delete any
  room (to remove spam or leftover test rooms).

**listing_checks**
- Columns: listing, permit number (typed in), answers to the validation
  questions.
- Only the owner of that listing and admins may read or write a row.
  Students and logged-out visitors can never read it. It is a separate
  table because RLS works per row, and the permit must not sit on the
  public `listings` table.

**Validation questions** (to be confirmed by the team):
1. Are you the owner or a caretaker?
2. How many beds are open right now?
3. Can our team call this number to confirm?

## Login
Yes, for owners and admins: Supabase Auth, email and password. Students
do not log in. For the demo, turn off "Confirm email" in Supabase Auth
settings, because the free plan limits how many emails it sends and
signup could otherwise get stuck. Admin access needs both a login and
the `admin` role enforced by RLS. A hidden address is only an extra,
never the lock.

## Done for the demo
On the LIVE URL:
- [ ] A new owner can sign up, log in and land on their home page.
- [ ] The owner can post a room with permit number and answers.
- [ ] The room does not appear to students until approved.
- [ ] An admin can open the admin page, see the permit and answers, and
      approve the room. A non-admin sees Not found.
- [ ] A logged-out student sees the approved room with price, distance
      and available/occupied label.
- [ ] The owner can mark the room occupied and the label changes for
      students.
- [ ] A room not updated for 7 days disappears from the student view and
      the owner can renew it.
- [ ] RLS is on for all three tables, and no `service_role` or
      `sb_secret_` key is in the project.

If time runs short, cut in this order: the price filter, then the
"about to hide" banner. The core path stays: an owner posts, the team
approves, and a student sees it.

## Out of scope
- Photos
- Reviews or ratings
- Email notifications (the banner on the owner home is the notice)
- Editing a room's price or description after posting
- Stronger owner verification (ID, permit photos, house visits)
- Distance from schools other than PHINMA UI
- Payments, deposits or any payment procedure
- Messaging inside the app
- Workers as a user type

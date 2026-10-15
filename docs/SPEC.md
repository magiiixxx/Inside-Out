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
9. As a student, I want to create an account and log in, so that I can
   keep a list of rooms I like. (Browsing stays open to everyone.)
10. As a student, I want to save a room and see my saved rooms in one
    place, so that I can compare them and call the owners later.
11. As an owner, I want to see the owner plans and my own plan, so that I
    know how many rooms I can post and how to upgrade.
12. As an owner, I want to add an address and edit my room's details and
    price, so that students find the place and see correct information.

## Screens
1. **Browse rooms** (public): cards for approved rooms, each showing
   price, distance from PHINMA UI, an available/occupied label, last
   updated and the owner's phone. Max-price filter and sort by distance.
2. **Sign up / Log in**: email and password, for students, owners and
   admins. Sign-up asks whether you are a student or a boarding house
   owner. Admin can never be chosen here.
3. **Owner home**: the owner's rooms with a status badge (pending,
   approved, rejected, hidden). A banner warns when a room is about to
   hide or is already hidden. Buttons: mark available/occupied, renew,
   and add a room.
4. **Add a room**: description, price per month, distance from PHINMA
   UI, address, contact phone, permit number, the three validation
   questions, and tick boxes "I understand my phone number will be public"
   and "I understand the address will be public". **Edit a room** uses the
   same fields for a room the owner already posted.
5. **Admin page** (hidden address): pending rooms with the owner's
   permit number and answers, and approve / reject buttons. A person who
   is not an admin sees the Not found page.
6. **Not found**.
7. **Saved rooms** (students): the rooms the student saved that are still
   visible, each with price, distance, available/occupied label, phone
   and a button to remove it. Rooms that are hidden or deleted do not
   show here.
8. **Plans** (public): the Free, Premium Owner and Property Manager plans
   with their prices. Each feature is marked "Available now" or "Coming
   soon". Owners choose Premium Owner or Property Manager there (only a step up
  from their current plan), saying how they will pay and giving a phone
  number. The team page lists the requests, and
  an admin presses Activate after the payment has arrived. The app itself
  takes no payments.

## Data
Row Level Security (RLS) is ON for every table.

**profiles**
- Columns: user id, name, role (`student`, `owner` or `admin`), plan
  (`free`, `premium` or `manager`). New accounts start on `free`. Only the
  team can change a plan: an owner sends a request, pays the team directly
  (GCash, Maya or bank transfer), and an admin presses Activate. A `free` owner may post
  one room; other plans and admins may post several.
- A user may read only their own row. A profile is created by the
  database when someone signs up, as `student` or `owner` depending on
  the sign-up choice, and never as `admin`.
- Nobody may change their own role. Team members are made admins by hand
  in the Supabase dashboard.

**listings**
- Columns: owner (user id), description, price per month, distance in km
  from PHINMA UI, contact phone, availability (`available` or
  `occupied`), approval status (`pending`, `approved` or `rejected`),
  last updated, created at.
- Anyone, including logged-out visitors, may read rows that are
  `approved` **and** updated within the last 7 days. Each room may have one
  photo (`photo_path`), kept in a Storage bucket; it is JPG, PNG or WebP, up
  to 2 MB, and its random file name is only visible with the room.
  Only owner and admin accounts can upload, and only into a folder named
  after their own user id. This rule is what
  hides stale rooms, so no scheduled job is needed.
- An owner may read all of their own rows, and create rows only for
  themselves with status `pending`.
- An owner may mark their own room available or occupied, renew it
  (which sets last updated to now), edit it, and delete it. An owner can
  never change the approval status directly. **Editing rule:** changing
  only the price goes live straight away; changing the description,
  distance, address, phone number or photo sends an approved room back to
  `pending` for the team to check again, and a rejected room goes back to
  `pending` so the owner can fix it. The address is shown to students, and
  the owner agrees to that when posting.
- An admin may read all rows, change the approval status, and delete any
  room (to remove spam or leftover test rooms).

**favorites**
- Columns: user (a student), listing, saved at.
- A student may read only their own saved rooms. Saving and removing go
  through database functions: only students may save, only rooms that are
  currently visible to students may be saved, and a student may save at
  most 50 rooms.

**plan_requests**
- Columns: owner, plan (`premium` or `manager`), pay method (`gcash`, `maya` or `bank`),
  contact phone, status (`pending`, `activated` or `dismissed`), created at.
- An owner reads only their own requests; admins read all. Nobody writes
  to the table directly: owners use `request_plan()` (one waiting request at
  a time), and only admins can call `activate_plan()` and
  `dismiss_plan_request()`.

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
- More than one photo per room (one photo is in scope, see ticket 15)
- Reviews or ratings
- Email notifications (the banner on the owner home is the notice)
- Stronger owner verification (ID, permit photos, house visits)
- Distance from schools other than PHINMA UI
- Payments, deposits or any payment procedure
- Messaging inside the app
- Workers as a user type

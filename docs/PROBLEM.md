# BahayFind

## Who
A student from the province who is new to Iloilo and needs a boarding
house room near PHINMA UI.

Two other roles support that student, but the student is the person we
are building for:
- **Owner**: signs up, logs in, and posts their own rooms.
- **Admin** (our team): approves or rejects postings and monitors them.

We do not set up the boarding houses or rooms ourselves.

## The struggle
We watched Richelle, a student, search for a room through Facebook
groups. She messaged more than 8 owners to confirm price and
availability. She then travelled to see a room that was already taken,
because the post was still up after the room was gone. That trip cost
about ₱900 in fare and more than 6 hours.

This happens every enrollment period and at the start of the school
year, when many new students arrive at once.

## Today's workaround
Facebook groups and messaging owners one by one. Facebook shows posts,
but not whether a room is still available. There is no way to tell
which posts are old, and no way to filter by price or distance.

## The MVP
A website where owners sign up, log in and post their rooms, our team
approves each posting, and a student can browse only approved rooms near
PHINMA UI, each clearly labelled **available** or **occupied**.

How it works:
1. **Owner** signs up and logs in, lands on their profile home, and adds
   a room: description, price, distance from PHINMA UI, contact
   information, and an available/occupied label. The owner can change
   that label whenever the room status changes.
2. **Team (admin)** reviews each new posting and approves or rejects it.
3. **Student** browses approved listings, with no login needed, and sees
   which rooms are available now.

## How we'll know it worked
The demo shows the whole flow in three minutes: an owner posts a room,
the team approves it, and a student finds it and sees it is available.

Before Session 3, three people try the live app:
- **Richelle** (student) says whether she would have skipped the ₱900
  trip.
- **Joshua** (student) finds an available room under his budget in under
  a minute.
- **Monica** (owner) signs up, posts her own room and marks it
  available or occupied.

## Rules for the MVP
- Students do not need to log in to browse. A student may create an
  account only to save favorite rooms. Owners must sign up and log in.
  Only approved listings are visible to students.
- Owners can edit only their own rooms. Only the team can approve.
- The app never handles money, deposits or payments.
- Owner contact information is shown publicly, so owners must know that
  when they post it.

## Decisions

- **What approval checks.** Before a listing goes live, the team checks
  the owner's **permit** and the owner's answers to a short set of
  **validation questions**. This is the "trust" promise to students.
- **Stale listings.** If an owner does not update a room for **7 days**,
  the owner is notified and the room is **hidden** from students until
  the owner renews or updates the post.
- **Admin access.** The admin page is hidden and only team members can
  open it. Hiding the link is not the lock: it also requires login and
  an admin role enforced by the database (Row Level Security).

## Still to settle in `/to-spec`
- What exactly are the validation questions, and how is the permit
  provided (a permit number typed in, or a photo uploaded)? A photo is
  private personal data and needs private storage, so a typed number is
  the smaller MVP.
- How is the owner "notified"? The smallest version is a banner on the
  owner's profile home. Email is extra work.
- What does "payment procedure" mean for this app? It is parked in
  LATER, because the MVP never handles money.

## Out of scope
- More than one photo per room (one photo is in the app now)
- Written reviews or comments (star ratings are in the app now)
- Stronger owner verification (ID, permits, house visits)
- Distance from schools other than PHINMA UI
- Payments or deposits
- Messaging inside the app

## Glossary
- **Listing**: one room or bed space posted by an owner, with its
  description, price, distance from PHINMA UI, contact information and
  status.
- **Property**: a boarding house building that one owner manages. A
  property has many rooms. BahayFind has no separate property record yet;
  each room is posted on its own.
- **Available / Occupied**: the label an owner sets on a listing to say
  whether a bed is open today.
- **Approved**: a listing the team has reviewed and allowed to show to
  students.
- **Owner**: a boarding house owner with an account who posts listings.
- **Admin**: a member of our team who approves or rejects listings.
- **Seeker**: the student searching for a room.
- **PHINMA UI**: the fixed reference point for all distances in the MVP.

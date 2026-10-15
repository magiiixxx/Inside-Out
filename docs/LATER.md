# Later

Good ideas that are not in the MVP.

Parking something here is a decision, not a loss. It is how the MVP
stays small enough to actually ship by Session 3.

- Photos
- Reviews or ratings
- Stronger owner verification (ID, permits, house visits)
- Distance from schools other than PHINMA UI
- Payments or deposits, and any payment procedure or improvement
- Messaging inside the app

## Rent tracker for students (needs its own problem statement and spec)

Students seeing their monthly bill amount and due date. This is not a
small feature: it needs to know which room a student rents, the monthly
amount, the due date, and who records that a payment was made. That is a
tenant, rental agreement and payments system. The app never handles
money, so payments would stay in person and the app would only record
them. Run `/grill-with-docs` again before building it.

## Owner plans (only owners pay; students always stay free)

The draft plans. The prices are guesses until real owners say they would
pay. Ask Monica and two more owners "Would you pay ₱149 a month for
this?" before building anything.

**Free, ₱0** (for new landlords)
- One basic listing
- Standard search visibility
- Basic availability updates
- Direct contact from renters

**Premium Owner, ₱149 a month** (for small boarding houses, recommended)
- Multiple active room listings
- Listing analytics
- Inquiry and waiting-list management
- Availability reminders
- Additional photos and property details

**Property Manager, ₱299 a month** (for larger boarding houses)
- Everything in Premium Owner
- Multiple room and bed inventory
- Occupancy and vacancy reports
- Rental income summaries
- Multiple authorized staff accounts

**Words, so we all mean the same thing.** A *property* is a boarding
house building. A *room listing* is one room or bed space posted inside
it. Today BahayFind has only room listings. "Property" would become a
real thing in the app only if a plan needs it (for example bed
inventory).

**Build in phases, in this order:**
1. **Done:** the plans are written here and in the pitch.
2. **Done (ticket 12), the minimal version:** a plan on each owner
   account, a Plans page, a limit of **one room** on the Free plan, and
   the team switching a plan by hand after the owner arranges payment
   with the team. The app still never handles money and uses no payment
   provider. Only the room limit is built; every other premium feature
   is marked "Coming soon" on the Plans page.
3. **Later, one at a time, each with its own spec:** analytics, inquiry
   and waiting lists, availability reminders (needs an email or SMS
   service), extra photos (needs file storage), bed inventory and
   occupancy reports, rental income summaries (this is the rent tracker
   above), and staff accounts. Anything that needs a new service needs the
   team's agreement first.

## Other monetization ideas (only after the free version is proven)

- Local ads or partnerships: laundry shops, water refilling stations,
  printing shops and food places near campus pay to advertise. Needs
  steady traffic first.

## Account menu ideas, not built yet

- "See all profiles": the app has one profile per account, so there is nothing
  to switch between.
- Real notification preferences (email or text when a room is approved, about
  to hide, or reported). Needs an email or SMS service, so the team must agree
  first. Until then the Notifications settings page says so.
- Saving display choices to the account so they follow a person to another
  phone. Today they are kept on each device.
- Uploading your own profile picture. Today the picture comes from Google or
  Facebook, otherwise initials are shown.
- Deleting your own account with one button. Today a person asks the team.
- A reply from the team inside the app. Today the team replies outside the app
  and marks the message handled.

## Seen in the frontend design, not in the MVP

The design boards show some things the app does not do yet. They were left
out on purpose, because the MVP has one job: help a student find a room
that is really free.

- Messages between students and owners, and visit or reservation booking
  (the spec says no messaging inside the app and no payments).
- "Continue with Google", "Forgot password", "Keep me logged in", mobile
  number and school fields on sign up (needs extra Supabase Auth setup).
- A map of rooms around PHINMA UI with walking-time rings.
- Filters for room type, WiFi and own CR, and the "within 10 minutes walk"
  chips (rooms do not store these details yet).
- A heart button on the room picture, a Saved rooms side panel, and
  "Compare saved rooms".
- An FAQ on the landing page.
- The admin Access control console: role changes, suspending users,
  two-step verification, an audit log, and "Landlord verification" as its
  own screen (today the team approves rooms, not accounts).
- A "Verified" badge on rooms (today every visible room is approved, so
  the badge would say the same thing on all of them).

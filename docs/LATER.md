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
1. **Now (done):** the plans are written here and in the pitch. Nothing
   is built.
2. **After the demo, a minimal version:** a plan on each owner account, a
   pricing page, a limit on how many rooms the Free plan may post, and the
   team switching a plan by hand after the owner pays in person or by
   GCash. The app still never handles money and uses no payment provider.
   First decide what the Free limit means: one room, or one property.
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

# 26 — Team contact and payment details

**What to build:** The team's real contact details and payment accounts show
up where people need them, without being written into the code. Owners who ask
for a paid plan see exactly where to send the payment. The Help and Privacy
pages show how to reach the team.

**Blocked by:** 17

**Status:** done

- [x] The Help page and the Privacy page list the contact details the team has
      set (phone, email, Facebook page). Anything not set is not shown.
- [x] An owner whose plan request is waiting sees the amount, the account name
      and number for the way they chose to pay (GCash, Maya or bank), and how to
      send proof of payment.
- [x] Nobody else sees the payment account: not logged-out visitors, students,
      or owners who have not asked for a plan.
- [x] With nothing set, the pages look exactly as before and say the team will
      contact the owner.
- [x] The details are settings in Vercel, not in the repository.
- [x] A wrongly typed setting never shows odd text or a harmful link.
- [x] Works on the live URL

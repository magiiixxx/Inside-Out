# 16 — Premium upgrade requests

**What to build:** An owner on the Free plan can ask for Premium Owner on
the Plans page, choosing to pay by GCash, Maya or bank transfer and giving
a phone number. The app takes no money. The team contacts the owner, and
after the payment has arrived, an admin presses Activate on the team page,
which switches the owner to Premium so they can post more rooms.

**Blocked by:** 12

**Status:** todo

- [ ] A logged-in owner on Free sees a request form on the Plans page, with
      GCash, Maya and Bank transfer, and a phone number.
- [ ] After sending, the owner sees "Your request is waiting", and cannot
      send a second request while one is waiting.
- [ ] Logged-out visitors are asked to log in; students and owners already
      on a paid plan do not see the form.
- [ ] The team page lists waiting requests with the owner's name, how they
      will pay, and their phone number.
- [ ] Activate Premium changes the owner's plan, and the owner can then
      post a second room. Dismiss turns the request down.
- [ ] A non-admin cannot activate or dismiss a request, even by calling the
      database function directly.
- [ ] An owner can read only their own requests.
- [ ] Only Premium Owner can be requested (Property Manager is still
      "Coming soon").
- [ ] Works on the live URL

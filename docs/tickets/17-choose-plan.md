# 17 — Owners choose their plan

**What to build:** When an owner asks to upgrade, they choose which plan:
Premium Owner or Property Manager. Each plan card on the Plans page has a
"Choose" button that takes them to the request form with that plan
selected. The owner still pays the team directly, and an admin activates
the plan they asked for.

**Blocked by:** 16

**Status:** done

- [x] An owner on Free can choose Premium Owner or Property Manager, with
      the price shown for each.
- [x] An owner on Premium can only choose Property Manager; an owner on
      Property Manager sees that they already have the top plan.
- [x] The Choose button on a plan card selects that plan in the form.
- [x] The form says the extra Property Manager features are still coming
      soon.
- [x] The waiting-request message and the team page both name the plan that
      was asked for, and Activate switches the owner to exactly that plan.
- [x] The database refuses a request for a plan the owner already has, or
      one that is not an upgrade.
- [x] Works on the live URL

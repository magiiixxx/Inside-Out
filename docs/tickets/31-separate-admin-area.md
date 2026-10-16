# 31 — A separate admin area with its own sign-in

**What to build:** The team area gets its own address (/admin) and its own sign-in
page (/admin/login), apart from the student and owner site. It uses the same
Supabase login (there is no second set of passwords), but only a team account is
let through. The old /review-desk address still works by redirecting.

**Blocked by:** 28

**Status:** todo

- [ ] /admin/login is a team sign-in page with no Google button and no sign-up link.
- [ ] A team account that signs in there lands on the team page.
- [ ] A student or owner who signs in there is signed out again and sees the same
      message as a wrong password, so the page does not reveal which accounts exist.
- [ ] A logged-out visitor opening /admin, /admin/security or /admin/verify is sent
      to /admin/login. A logged-in student or owner sees the Not found page.
- [ ] A team member who is already signed in and opens /admin/login goes to /admin.
- [ ] Logging out from the team area returns to /admin/login with a short message.
- [ ] A team account that signs in on the main Log in page also lands on /admin.
- [ ] The old /review-desk address (and its sub-pages) redirect to /admin.
- [ ] Search engines are asked not to list any /admin page.
- [ ] Reviewing rooms, reports, messages, plan requests, deleting, two-step and the
      Return button all work as before, and the database is still the real lock.
- [ ] Works on the live URL

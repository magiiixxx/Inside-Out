# 28 — Return button and a clearer team sidebar

**What to build:** The team page gets a Return button at the top left of its
header, and its left panel becomes easier to use: grouped links with icons and
number badges, the current section clearly marked, and a menu drawer on phones.
Nothing the team page does changes, only how it is navigated.

**Blocked by:** 27

**Status:** todo

- [ ] A "← Return" button sits at the top left of the team page header.
- [ ] If the admin came from another page of the site, Return goes back to it.
- [ ] If the page was opened directly, in a new tab, or the previous page was a
      log in, sign up, password or code page, Return goes to the public home page.
      It never bounces the admin forward again.
- [ ] Refreshing the page does not break Return.
- [ ] The two-step set-up page has a Return button that goes to the team page.
- [ ] The left panel groups links under headings, with an icon and a number badge
      (how many are waiting) on each.
- [ ] The section the admin is looking at is highlighted, and the highlight
      follows scrolling and clicks.
- [ ] On phones the panel is a drawer opened by a menu button. It closes with the
      close button, Escape, the dark backdrop, or choosing a link, and keyboard
      focus stays inside it while open.
- [ ] On tablets and desktops the panel stays visible and does not cover content.
- [ ] Every link and button can be reached and used with the keyboard and shows a
      visible focus ring. Reduced motion is respected.
- [ ] Reviewing, reports, messages, plan requests, deleting, and two-step all work
      as before.
- [ ] Works on the live URL

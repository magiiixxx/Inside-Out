# 25 — Account menu, settings, help, and display choices

**What to build:** A logged-in person opens an account menu from their picture
in the header. It shows who they are (picture, name, email, account type) and
leads to Settings & Privacy, Help & Support, Report a Problem, Display &
Accessibility and Log Out. The pages behind it work: account, privacy,
security and notification settings, a help center with FAQs, a form that sends
a message to our team, and display choices (light, dark or system theme, text
size, reduced motion, underlined links) that apply to the whole site and are
remembered on the device.

**Blocked by:** 24

**Status:** done

- [x] The account menu opens when the picture is pressed, and closes when you
      click or tap outside it, press Escape, or follow a link.
- [x] The menu shows the logged-in person's own name, email and account type
      (and the plan, for owners). A person who signed in with Google or
      Facebook sees their picture; others see their initials.
- [x] Arrow keys, Home and End move between the menu items, and every item
      has a clear label for screen readers.
- [x] Settings & Privacy opens Account, Privacy, Security and Notifications.
      Display & Accessibility and Help & Support open inside the menu too.
- [x] A logged-out visitor opening any settings page or Report a Problem goes
      to the Log in page.
- [x] Account settings lets a person change their name. It shows the new name
      in the menu.
- [x] Security lets a person email themselves a password link and log out
      their other devices.
- [x] Privacy and Notifications say plainly what is true, with no switches
      that do nothing.
- [x] The Help center has guides, FAQs and a way to contact support.
- [x] Report a Problem sends a message (bug, idea or question). The team sees
      it under Messages on the team page and can mark it handled. A person
      can send at most 10 a day.
- [x] Choosing Dark, Light or System changes the colours of every page, and
      the choice is still there after closing and reopening the site.
- [x] Text size, Reduce motion and Underline links work on every page.
- [x] Log Out shows "Logging out…", ends the session and lands on the Log in
      page with a short message.
- [x] The menu fits a phone, a tablet and a computer, in light and dark.
- [x] Nothing that worked before is broken.
- [x] Works on the live URL

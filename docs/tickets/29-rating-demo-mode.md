# 29 — Rating preview (demo mode)

**What to build:** A preview of how star ratings and sample reviews will look,
for showing the project to others. It is OFF for everyone by default. Opening a
page with ?demo=ratings in the address switches it on for that browser tab, and
?demo=off switches it off. While it is on, rooms that have no real ratings show
five clickable stars instead of "No ratings yet". Pressing a star selects that
rating and opens a sample review. Everything in the preview is fictional, is
labelled as demo data, and is kept completely apart from real ratings: nothing
is saved, no database table is touched, and no real average changes.

**Blocked by:** 20

**Status:** done

- [x] With demo mode off (the normal case), room cards look exactly as before:
      "No ratings yet", or the real average, and the real Rate this room row.
- [x] Opening the home page with ?demo=ratings shows a "Demo mode" banner with a
      Turn off button, and five stars beside the price on rooms with no ratings.
- [x] Hovering or focusing a star fills the stars up to it; pressing one
      selects it, shows "N.0 / 5", and opens a sample review panel.
- [x] The panel shows the matching rating, a fictional reviewer, a sample date,
      sample text, and the label "DEMO DATA — NOT A REAL USER REVIEW".
- [x] Pressing a different star updates the rating and the review. Pressing the
      same star again changes nothing and causes no duplicate panel.
- [x] The panel closes with its Close buttons, the Escape key, or the backdrop,
      and keyboard focus goes back to the star that opened it. The selection
      stays, and with nothing selected the card says "No rating selected".
- [x] Rooms with real ratings keep showing their real average, never the demo.
- [x] While demo mode is on, the real rating stars are hidden so two sets of
      stars never compete.
- [x] Nothing is written to Supabase, and the demo never changes a real rating.
- [x] The stars and panel work on a phone, a tablet and a computer, in light and
      dark mode, with the keyboard, and with reduced motion.
- [x] Turning demo mode off, or closing the tab, brings back the normal cards.
- [x] Works on the live URL

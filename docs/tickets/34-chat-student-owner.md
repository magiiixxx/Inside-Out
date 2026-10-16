# 34 — Chat between a student and a room's owner

**What to build:** Next to the Call button on every room there is a "Message owner" button.
A logged-in student writes a first message, which opens a chat with that room's owner.
The owner is notified (a number on "Messages" in the header and an unread dot in the
inbox) and can reply. Both can keep writing, and new messages appear without refreshing.

**Blocked by:** 29

**Status:** done

- [x] "Message owner" shows next to Call on each room for logged-in students, and leads
      logged-out visitors to Log in. Owners and the team do not see it.
- [x] A student can write a first message about an approved, visible room, and it opens
      one chat for that student and room (pressing the button again goes to the same chat).
- [x] The owner sees a number on "Messages" in the header and an unread dot in the inbox, and
      can open the chat and reply. Opening the chat clears the notification.
- [x] New messages appear in an open chat without refreshing the page.
- [x] Only the two people in a chat can read it. Another student, another owner and the
      team cannot open it (it says not found).
- [x] Messages are limited to 1000 characters and 10 a minute; a student can start at most
      10 chats a day; only students start chats.
- [x] Works on a phone and in dark mode. The Privacy page mentions chat.
- [x] Works on the live URL

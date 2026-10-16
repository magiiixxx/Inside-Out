# 32 — Payment QR code and payment reference number

**What to build:** After an owner presses Request plan, the Plans page shows the
team's payment QR code (GCash, Maya or bank) with the amount, the owner pays outside
the app, and types the payment reference number from their receipt. The team sees
that number on the team page, checks it against their own GCash, Maya or bank
records, and presses Activate. BahayFind still takes no money.

**Blocked by:** 17

**Status:** done

- [x] After requesting, the owner sees two steps: pay (the QR code, or the account
      details when there is no QR code), then enter the reference number.
- [x] The QR code shown matches the plan and the way of paying (a QR code carries one
      amount, so Premium and Property Manager have their own).
- [x] The QR code is not in the code repository and not at any public address. Only an
      owner with a waiting request can see it, through a link that stops working after
      10 minutes. A logged-out visitor, a student, and an owner with no waiting request
      cannot open it.
- [x] The owner can send, and later correct, the reference number while the request is
      waiting. Too short, too long or strange characters give a clear message.
- [x] A reference number that was already used for another request is refused.
- [x] On the team page the request shows the amount to look for and the reference number
      (or "Not sent yet"). Activate stays off until a reference number has been sent, and
      the database refuses to activate without one.
- [x] Activating still moves the owner up to the plan they asked for, as before.
- [x] Nothing is charged by the website.
- [x] Works on the live URL

## One-time set up by the team (the QR codes)

1. Run `supabase/sql/022-payment-reference-and-qr.sql` in the Supabase SQL Editor.
2. In Supabase, open **Storage**, then the **payment-qr** bucket (the SQL creates it as
   private).
3. Upload your GCash QR code image for the amount, and name the file exactly
   `gcash-premium.jpg` (use `.png` or `.webp` if that is your file type). A QR code
   holds one amount, so for Property Manager upload a second QR made for that price,
   named `gcash-manager.jpg`. Do the same for Maya (`maya-premium.jpg`,
   `maya-manager.jpg`) or a bank (`bank-premium.jpg`, `bank-manager.jpg`) if you use
   them.
4. If a plan or method has no QR file, owners see the account details from the Vercel
   settings, or a note that the team will contact them.
5. Do NOT put QR code images in the project folder or in GitHub. The repository is
   public.

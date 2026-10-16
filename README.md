# BahayFind

Student rooms near PHINMA University of Iloilo. Students browse rooms that our
team has approved and that owners confirm are still available. Owners post rooms
and can upgrade their plan. Our team approves rooms and plan requests.

**Live URL:** https://inside-out-two.vercel.app

## Stack

Next.js (App Router) + TypeScript, Tailwind CSS, Supabase (hosted: database,
auth, storage), Vercel. Every push to `main` deploys.

## Where things live

- `docs/SPEC.md` — what the system does
- `docs/tickets/` — every ticket, with its status
- `docs/LATER.md` — ideas that are not built yet
- `supabase/sql/` — every database change, numbered. Run them in order in the
  Supabase SQL Editor to rebuild the database.
- `src/lib/supabase/` — the database clients (see the README there)
- `src/app/admin/` — the team area, with its own sign-in

## Run it locally

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the values (never commit it).
3. `npm run dev`

## Settings (set in Vercel, Settings, Environment Variables)

| Name | What it does |
|------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The Supabase project (the only values the browser may see) |
| `SITE_URL` | The live address, used in emails and links |
| `ADMIN_2FA` | `on` makes the team area require a two-step code |
| `NEXT_PUBLIC_GOOGLE_LOGIN` | `true` shows the Google sign-in button |
| `NEXT_PUBLIC_RATING_DEMO` | `on` lets the demo rating feature be tried; keep `off` for real use |
| `CONTACT_PHONE`, `CONTACT_EMAIL`, `CONTACT_FACEBOOK` | Contact details shown on the site |
| `PAYMENT_GCASH`, `PAYMENT_MAYA`, `PAYMENT_BANK` | Payment account details shown when no QR code is uploaded |

The payment QR codes are uploaded by hand in Supabase (Storage, `payment-qr`),
never through the website. The Supabase `service_role` key is never used here.

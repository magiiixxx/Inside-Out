import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ContactLines } from "@/components/contact-lines";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";

// The Help center: short guides and frequently asked questions. Everyone can
// read it. Contacting the team needs an account. Keep every answer true to
// what the app does today.

export const dynamic = "force-dynamic";

const GUIDES = [
  {
    title: "Finding a room (students)",
    steps: [
      "Open Browse rooms. You do not need an account to look.",
      "Set the most you can pay a month, and choose to sort by distance or by most recently updated.",
      "Check the Available or Occupied label, the address and the photo, then call the owner.",
      "Create a free student account to save rooms, rate them and report a problem.",
    ],
  },
  {
    title: "Posting a room (owners)",
    steps: [
      "Sign up as an owner and open My rooms, then Add a room.",
      "Fill in the details, a photo, your permit number and the three questions our team asks.",
      "Our team checks and approves the room before students can see it.",
      "Keep it honest: mark it occupied when it is taken, and press Renew at least every 7 days.",
    ],
  },
  {
    title: "Plans for owners",
    steps: [
      "Every owner starts Free with one room.",
      "To post more rooms, open Owner plans and ask for Premium Owner.",
      "After you ask for a plan, you pay by scanning the QR code shown (GCash, Maya or bank). BahayFind does not take payments on the website.",
      "Type the payment reference number from your receipt. Once our team has confirmed your payment, they switch your plan on.",
    ],
  },
];

const FAQS = [
  {
    q: "Do I need an account to look at rooms?",
    a: "No. Anyone can browse approved rooms. You need a free student account to save, rate or report a room.",
  },
  {
    q: "Why can't I see a room I saw yesterday?",
    a: "Rooms that the owner has not updated for 7 days are hidden until the owner renews them, so you are not sent to a room that is gone. A room can also be waiting for our team to check it again.",
  },
  {
    q: "What does 'approved' mean?",
    a: "Our team checked the owner's permit number and their answers to three questions before the room went live. It does not mean we visited the room.",
  },
  {
    q: "Who can give a room stars?",
    a: "Logged-in students, and only for a room they have saved. The stars come from students, and we cannot prove they visited. Our team can reset a room's ratings.",
  },
  {
    q: "A room I called is already taken. What do I do?",
    a: "On the room card, press Report a problem with this room, and pick 'The room is already taken'. Our team will check it with the owner.",
  },
  {
    q: "I forgot my password.",
    a: "Open Log in and press Forgot password. We email a one-time link. Open it in the same browser you asked from.",
  },
  {
    q: "How do I delete my account?",
    a: "Send our team a message through Contact support and say you want your account deleted. Owners can delete their own rooms any time from the owner home page.",
  },
  {
    q: "Is my phone number shown to everyone?",
    a: "Only an owner's room phone number is public, because owners agree to that when they post. Students' details are never shown to other users.",
  },
];

export default async function HelpPage() {
  const { user } = await getCurrentUser();

  return (
    <main id="main" className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-8 sm:py-12">
      <header>
        <p className="eyebrow mb-2">Help & Support</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Help center</h1>
        <p className="mt-2 text-muted-foreground">Short guides and quick answers for students and owners.</p>
      </header>

      <section aria-labelledby="guides" className="flex flex-col gap-4">
        <h2 id="guides" className="text-xl font-extrabold">
          Guides
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          {GUIDES.map((guide) => (
            <Card key={guide.title}>
              <CardHeader>
                <CardTitle className="text-lg">{guide.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal space-y-3 pl-5 text-[0.9375rem] leading-relaxed marker:font-extrabold marker:text-amber-text">
                  {guide.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="faq" aria-labelledby="faq-title" className="mx-auto flex w-full max-w-3xl scroll-mt-20 flex-col gap-3">
        <h2 id="faq-title" className="text-xl font-extrabold">
          Frequently asked questions
        </h2>
        {FAQS.map((item) => (
          <details key={item.q} className="card group px-5 py-1">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-bold">
              {item.q}
              <span aria-hidden="true" className="text-xl leading-none text-amber-text group-open:hidden">+</span>
              <span aria-hidden="true" className="hidden text-xl leading-none text-amber-text group-open:inline">&ndash;</span>
            </summary>
            <p className="pb-4 text-[0.9375rem] leading-relaxed text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </section>

      <section aria-labelledby="contact" className="card mx-auto flex w-full max-w-3xl flex-col gap-3 p-6">
        <h2 id="contact" className="text-xl font-extrabold">
          Still need help?
        </h2>
        <p className="text-[0.9375rem] text-muted-foreground">
          Send our team a message and we will get back to you.
          {!user && " You need to log in first, so we know who to reply to."}
        </p>
        <ContactLines />
        <div className="flex flex-wrap gap-3">
          {user ? (
            <>
              <Link href="/report-problem?kind=question" className={buttonVariants()}>
                Contact support
              </Link>
              <Link href="/report-problem?kind=bug" className={buttonVariants({ variant: "outline" })}>
                Report a problem
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonVariants()}>
                Log in
              </Link>
              <Link href="/signup" className={buttonVariants({ variant: "outline" })}>
                Create an account
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

// What BahayFind does with people's information. Facebook requires a page
// like this before a Facebook login can be used by the public, and it is the
// honest thing to publish anyway. Keep it true: if the app starts collecting
// something new, change this page in the same ticket.

export const metadata = { title: "Privacy — BahayFind" };

export default function PrivacyPage() {
  return (
    <main id="main" className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:py-14">
      <header className="flex flex-col gap-2">
        <p className="eyebrow">Your information</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Privacy</h1>
        <p className="text-muted-foreground">
          BahayFind helps students find boarding house rooms near PHINMA
          University of Iloilo. This page says what we keep and why, in plain
          words.
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">What we keep</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-[0.9375rem]">
          <li>
            <strong>Everyone with an account:</strong> your name, your email
            address, and whether you are a student or an owner. If you sign up
            with Google or Facebook, we receive the name, email address and
            profile picture link that they share, and their id for your
            account. We never see your Google or Facebook password.
          </li>
          <li>
            <strong>Students:</strong> the rooms you save, the reports you send,
            and the star ratings you give.
          </li>
          <li>
            <strong>Owners:</strong> the rooms you post, including the address,
            phone number and photo, and the permit number you give our team. The
            permit number stays private to you and our team.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">What other people can see</h2>
        <p className="text-[0.9375rem]">
          A room&apos;s description, price, distance, address, phone number,
          photo and star average are shown to every visitor once our team has
          approved the room. Owners agree to this when they post. Your email
          address, your saved rooms and your own ratings are never shown to
          other users.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">Who looks after the data</h2>
        <p className="text-[0.9375rem]">
          Your information is stored with Supabase, our database provider, and
          the website runs on Vercel. Passwords are handled by Supabase
          and are stored scrambled, so our team cannot read them. We do not sell
          your information and we do not show advertising. BahayFind does not take payments on this
          website.
        </p>
      </section>

      <section className="flex flex-col gap-2" id="delete-your-data">
        <h2 className="text-xl font-bold">Deleting your data</h2>
        <p className="text-[0.9375rem]">
          You can ask the BahayFind team to delete your account and everything
          linked to it (your rooms, saved rooms, reports and ratings). Owners
          can also delete their own rooms from the owner home page at any time.
          Tell any member of the team, or message us through the page where
          you found BahayFind, and we will remove your account.
        </p>
      </section>

      <Link href="/" className={buttonVariants({ variant: "ghost" }) + " w-fit"}>
        ← Back to rooms
      </Link>
    </main>
  );
}

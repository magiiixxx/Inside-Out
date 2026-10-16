import Link from "next/link";
import { HouseIcon } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";

// Shown for any address that does not exist, and, on purpose, for the team pages
// when the visitor is logged in but is not an admin, so it looks like nothing is
// there at all. The wording must therefore never hint at what the page was.

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-5 px-4 py-16 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-navy-soft text-link">
        <HouseIcon className="h-10 w-10" />
      </span>
      <div>
        <p className="eyebrow mb-2">Error 404</p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">We can&apos;t find that page</h1>
        <p className="mt-3 text-muted-foreground">
          The address may be wrong, or the page may have moved. Here are some places to start.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className={buttonVariants({ variant: "accent" })}>
          Find a room
        </Link>
        <Link href="/pricing" className={buttonVariants({ variant: "outline" })}>
          Owner plans
        </Link>
        <Link href="/help" className={buttonVariants({ variant: "ghost" })}>
          Help center
        </Link>
      </div>
    </main>
  );
}

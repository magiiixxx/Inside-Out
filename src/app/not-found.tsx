import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

// Shown for any address that does not exist — and, on purpose, for the
// team page when the visitor is not an admin, so it looks like nothing is
// there at all.

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground">
        We could not find the page you were looking for.
      </p>
      <Link href="/" className={buttonVariants()}>
        Back to rooms
      </Link>
    </main>
  );
}

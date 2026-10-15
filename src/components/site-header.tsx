import Link from "next/link";
import { HouseIcon } from "@/components/icons";

// The bar at the top of every page: the logo, which always leads home.
// It stays visible while scrolling, so a student on a phone is never more
// than one tap from the list of rooms.

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HouseIcon className="h-5 w-5" />
          </span>
          <span className="text-lg">BahayFind</span>
        </Link>
        <span className="hidden text-sm text-muted-foreground sm:block">
          Rooms near PHINMA UI
        </span>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 text-sm text-muted-foreground">
        BahayFind helps students find boarding house rooms near PHINMA UI.
        Every room is approved by our team, and the owner confirms it is still
        available.{" "}
        <Link href="/pricing" className="underline underline-offset-4">
          Plans for owners
        </Link>
      </div>
    </footer>
  );
}

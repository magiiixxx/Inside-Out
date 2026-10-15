import Link from "next/link";
import { logout } from "@/app/auth/actions";
import { getUserAndRole, homeFor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { initials } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

// The bar at the top of every page: the logo, which always leads home, a few
// links, and either Log in / Sign up or the name of whoever is logged in.

// The BahayFind mark: a house on a rounded square. "onDark" swaps the colours
// so it stands out on a navy background.
export function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <span className={`flex items-center gap-2.5 text-[1.375rem] font-extrabold tracking-tight ${onDark ? "text-white" : ""}`}>
      <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill={onDark ? "#f2b134" : "#0f2d52"} />
        <path d="M7 16 16 8l9 8v9H7z" fill={onDark ? "#0f2d52" : "#f2b134"} />
        <rect x="13" y="18" width="6" height="7" fill={onDark ? "#f2b134" : "#0f2d52"} />
      </svg>
      BahayFind
    </span>
  );
}

const NAV_LINK = "border-b-[3px] border-transparent py-[1.125rem] hover:border-amber";

export async function SiteHeader() {
  const supabase = await createClient();
  const { user, role, fullName } = await getUserAndRole(supabase);
  const displayName = fullName || user?.email || "";

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-white">
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-x-8 px-4 sm:px-8">
        <Link href="/" aria-label="BahayFind home" className="py-3">
          <Logo />
        </Link>

        <nav aria-label="Main" className="order-last flex w-full gap-6 border-t border-line text-[0.9375rem] font-semibold sm:order-none sm:w-auto sm:gap-8 sm:border-t-0">
          <Link href="/" className={NAV_LINK}>
            Browse rooms
          </Link>
          {role === "student" && (
            <Link href="/saved" className={NAV_LINK}>
              Saved
            </Link>
          )}
          {(role === "owner" || role === "admin") && (
            <Link href="/owner" className={NAV_LINK}>
              My rooms
            </Link>
          )}
          <Link href="/pricing" className={NAV_LINK}>
            Owner plans
          </Link>
        </nav>

        {user ? (
          <div className="flex items-center gap-3">
            <Link href={homeFor(role)} className="flex items-center gap-2.5" aria-label="Your home page">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-[0.8125rem] font-extrabold text-white">
                {initials(displayName)}
              </span>
              <span className="hidden max-w-[10rem] truncate text-sm font-bold sm:block">{displayName}</span>
            </Link>
            <form action={logout}>
              <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Log out
              </button>
            </form>
          </div>
        ) : (
          <div className="flex gap-2.5 py-2">
            <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Log in
            </Link>
            <Link href="/signup" className={buttonVariants({ size: "sm" })}>
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="on-dark mt-auto bg-navy text-white">
      <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-4 py-12 sm:grid-cols-[1.5fr_1fr_1fr] sm:px-8">
        <div className="max-w-xs">
          <p className="text-xl font-extrabold">BahayFind</p>
          <p className="mt-3 text-sm leading-relaxed text-navy-text">
            Student rooms near PHINMA University of Iloilo. Every room is
            approved by our team, and the owner confirms it is still available.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-bold">Students</p>
          <Link href="/" className="mt-3 block text-navy-text hover:text-white">
            Browse rooms
          </Link>
          <Link href="/signup" className="mt-3 block text-navy-text hover:text-white">
            Create an account
          </Link>
        </div>
        <div className="text-sm">
          <p className="font-bold">Owners</p>
          <Link href="/pricing" className="mt-3 block text-navy-text hover:text-white">
            Plans for owners
          </Link>
          <Link href="/login" className="mt-3 block text-navy-text hover:text-white">
            Log in
          </Link>
        </div>
      </div>
      <div className="border-t border-navy-edge">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-5 text-[0.8125rem] text-navy-text sm:px-8">
          © 2026 BahayFind. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { cookies } from "next/headers";
import { AccountMenu } from "@/components/account-menu";
import { Logo } from "@/components/logo";
import { getCurrentUser } from "@/lib/auth";
import { PLAN_NAMES, type Plan } from "@/lib/plans";
import { parsePrefs, PREFS_COOKIE } from "@/lib/preferences";
import { buttonVariants } from "@/components/ui/button";

// The bar at the top of every page: the logo, which always leads home, a few
// links, and either Log in / Sign up or the name of whoever is logged in.

const NAV_LINK = "border-b-[3px] border-transparent py-[1.125rem] hover:border-amber";

export async function SiteHeader() {
  const { user, role, fullName, plan } = await getCurrentUser();
  const displayName = fullName || user?.email || "";
  const prefs = parsePrefs((await cookies()).get(PREFS_COOKIE)?.value);

  // The picture comes from the person's Google or Facebook sign-in, when they
  // used one. Email sign-ups have none, and show their initials instead.
  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const picture = metadata.avatar_url ?? metadata.picture;
  const avatarUrl = typeof picture === "string" ? picture : null;

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-card">
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
          <AccountMenu
            name={displayName}
            email={user.email ?? ""}
            avatarUrl={avatarUrl}
            roleLabel={role === "owner" ? "Owner" : role === "admin" ? "Admin" : "Student"}
            planLabel={role === "owner" ? `${PLAN_NAMES[(plan as Plan) ?? "free"] ?? "Free"} plan` : null}
            homeHref={role === "student" ? "/saved" : "/owner"}
            homeLabel={role === "student" ? "Go to my saved rooms" : "Go to my rooms"}
            prefs={prefs}
          />
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
          © 2026 BahayFind. All rights reserved.{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-white">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}

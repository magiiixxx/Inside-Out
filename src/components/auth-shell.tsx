import Link from "next/link";
import type { ReactNode } from "react";
import { CheckIcon } from "@/components/icons";
import { Logo } from "@/components/logo";

// The layout shared by Log in and Sign up: a navy panel with the pitch on
// the left (hidden on phones, where the form needs the room), and the form
// card on the right.

export function AuthShell({
  headline,
  blurb,
  points,
  children,
}: {
  headline: string;
  blurb: string;
  points: string[];
  children: ReactNode;
}) {
  return (
    <div className="grid flex-1 md:grid-cols-2">
      <div className="on-dark hidden flex-col justify-between gap-12 bg-navy p-14 text-white md:flex">
        <Link href="/" aria-label="BahayFind home" className="self-start">
          <Logo onDark />
        </Link>
        <div>
          <h2 className="text-balance text-[2.75rem] font-extrabold leading-[1.1] tracking-tight">{headline}</h2>
          <p className="mt-5 max-w-md text-[1.0625rem] leading-relaxed text-navy-text">{blurb}</p>
          <ul className="mt-8 grid gap-4">
            {points.map((point) => (
              <li key={point} className="flex items-center gap-3 text-base text-[#e3ecf6]">
                <CheckIcon className="h-[18px] w-[18px] shrink-0 text-amber" />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[0.8125rem] text-navy-text">© 2026 BahayFind. Rooms near PHINMA University of Iloilo.</p>
      </div>

      <main id="main" className="flex items-center justify-center bg-surface px-4 py-10 sm:px-8 sm:py-12">
        <div className="flex w-full max-w-[460px] flex-col gap-6">
          <Link href="/" aria-label="BahayFind home" className="self-start md:hidden">
            <Logo />
          </Link>
          <div className="rounded-[1.25rem] border border-line bg-card p-6 shadow-[0_16px_40px_rgb(15_45_82/0.08)] sm:p-10">
            {children}
          </div>
          <Link href="/" className="self-center text-sm font-semibold text-muted-foreground hover:text-ink">
            ← Back to rooms
          </Link>
        </div>
      </main>
    </div>
  );
}

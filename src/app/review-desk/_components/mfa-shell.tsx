import type { ReactNode } from "react";
import { Logo } from "@/components/site-header";

// The frame for the two-step pages: a centred card on the soft background,
// with no site header (these are team-only pages).

export function MfaShell({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <main id="main" className="flex flex-1 items-start justify-center bg-surface px-4 py-10 sm:py-16">
      <div className="flex w-full max-w-[34rem] flex-col gap-6">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="rounded-md bg-amber px-[7px] py-[3px] text-[0.6875rem] font-bold tracking-wide text-on-amber">ADMIN</span>
        </div>
        <div className="flex flex-col gap-5 rounded-[1.25rem] border border-line bg-card p-6 shadow-[0_16px_40px_rgb(15_45_82/0.08)] sm:p-9">
          <div>
            <h1 className="text-[1.625rem] font-extrabold tracking-tight">{title}</h1>
            <p className="mt-2 text-[0.9375rem] text-muted-foreground">{intro}</p>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}

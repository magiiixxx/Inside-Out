import type { ReactNode } from "react";
import { SettingsNav } from "./settings-nav";

// The frame every settings page sits in: a title, the tab row, and the page.

export function SettingsShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main id="main" className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:py-12">
      <header>
        <p className="eyebrow mb-2">Settings & Privacy</p>
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 text-muted-foreground">{intro}</p>
      </header>
      <SettingsNav />
      <div className="flex flex-col gap-5">{children}</div>
    </main>
  );
}

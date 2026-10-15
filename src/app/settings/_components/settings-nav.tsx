"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The row of links at the top of every settings page. The page you are on is
// marked, for screen readers too.

const TABS = [
  { href: "/settings/account", label: "Account" },
  { href: "/settings/privacy", label: "Privacy" },
  { href: "/settings/security", label: "Security" },
  { href: "/settings/notifications", label: "Notifications" },
  { href: "/settings/display", label: "Display" },
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Settings" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b border-line">
        {TABS.map((tab) => {
          const here = pathname === tab.href;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={here ? "page" : undefined}
                className={`block border-b-[3px] px-4 py-3 text-[0.9375rem] font-bold ${
                  here ? "border-amber text-ink" : "border-transparent text-muted-foreground hover:text-ink"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

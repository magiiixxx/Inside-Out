"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@/components/icons";

// A "Return" button for the top-left of a page. It decides where to go in this
// order:
//   1. If a target page (href) is given, go straight there.
//   2. Otherwise go back to the page the person was on before, using the
//      browser's history, when that makes sense.
//   3. Otherwise (a page opened directly, in a new tab, or after a refresh with
//      nothing before it) go to the fallback page.
//
// "Makes sense" is decided by the tracker in src/components/app-chrome.tsx,
// which remembers the previous page of this tab. We never go back to a log in,
// sign up, password or two-step page, because the person would just be bounced
// forward again (a redirect loop), so those count as "no previous page".
//
// It is a real link, so it still works if scripts have not loaded, and it keeps
// the keyboard and screen reader behaviour of a link.

export const NAV_STORAGE_KEY = "bf_nav";

// Pages we never "go back" to.
const NEVER_RETURN_TO = ["/login", "/signup", "/forgot-password", "/reset-password", "/auth/callback", "/admin/verify"];

function readPreviousPath(currentPath: string): string | null {
  try {
    const state = JSON.parse(window.sessionStorage.getItem(NAV_STORAGE_KEY) ?? "{}") as { prev?: unknown; current?: unknown };
    const prev = typeof state.prev === "string" ? state.prev : null;
    // Must be a page of this site, not this very page, and not one of the pages above.
    if (!prev || !prev.startsWith("/") || prev.startsWith("//")) return null;
    const prevPath = prev.split("?")[0].split("#")[0];
    if (prevPath === currentPath) return null;
    if (NEVER_RETURN_TO.some((blocked) => prevPath === blocked || prevPath.startsWith(blocked + "/"))) return null;
    return prev;
  } catch {
    return null; // session storage can be blocked; then we simply use the fallback
  }
}

const LOOK =
  "inline-flex min-h-10 w-fit items-center gap-2 rounded-xl border border-field-line bg-card px-3.5 text-sm font-bold text-ink transition-colors hover:border-ink hover:bg-surface motion-reduce:transition-none";

export function ReturnButton({
  href,
  fallbackHref = "/owner",
  label = "Return",
}: {
  href?: string;
  fallbackHref?: string;
  label?: string;
}) {
  const router = useRouter();

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    // Priority 1: an explicit target is a plain link. Let it work as it is.
    if (href) return;
    // Let the browser handle new-tab clicks (Ctrl, Cmd, Shift, middle button).
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    // Priority 2: go back, when there is a real previous page and history to go back to.
    if (window.history.length > 1 && readPreviousPath(window.location.pathname)) {
      event.preventDefault();
      router.back();
    }
    // Priority 3: otherwise the link goes to the fallback page on its own.
  }

  return (
    <Link href={href ?? fallbackHref} onClick={onClick} className={LOOK}>
      <ArrowLeftIcon className="h-4 w-4" />
      {label}
    </Link>
  );
}

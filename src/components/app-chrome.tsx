"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { NAV_STORAGE_KEY } from "@/components/return-button";

// Most pages get the site header and footer. The log in, sign up and team
// pages have their own full-screen layouts (a navy side panel), so for those
// the header and footer are left out.

const OWN_LAYOUT = ["/login", "/signup", "/forgot-password", "/reset-password", "/review-desk"];

export function AppChrome({
  header,
  footer,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();

  // Remember which page this tab was on before this one, so a Return button can
  // tell whether there is a sensible page to go back to. It lives only in this
  // tab (session storage) and holds just two page addresses.
  useEffect(() => {
    try {
      const state = JSON.parse(window.sessionStorage.getItem(NAV_STORAGE_KEY) ?? "{}") as { current?: string };
      if (state.current === pathname) return; // a refresh of the same page changes nothing
      window.sessionStorage.setItem(NAV_STORAGE_KEY, JSON.stringify({ prev: state.current ?? null, current: pathname }));
    } catch {
      // storage can be blocked (private windows); Return then uses its fallback
    }
  }, [pathname]);
  // The team pages (the review desk and its two-step pages) have their own layout.
  if (OWN_LAYOUT.includes(pathname) || pathname.startsWith("/review-desk")) return <>{children}</>;
  return (
    <>
      {header}
      {children}
      {footer}
    </>
  );
}

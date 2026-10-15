"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

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

"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

// Most pages get the site header and footer. The log in, sign up and team
// pages have their own full-screen layouts (a navy side panel), so for those
// the header and footer are left out.

const OWN_LAYOUT = ["/login", "/signup", "/review-desk"];

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
  if (OWN_LAYOUT.includes(pathname)) return <>{children}</>;
  return (
    <>
      {header}
      {children}
      {footer}
    </>
  );
}

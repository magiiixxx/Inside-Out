import type { Metadata } from "next";
import type { ReactNode } from "react";

// Everything under /admin: the team sign-in, the review page and the two-step
// pages. Search engines are asked not to list any of it, and the area is not
// linked from the public site (only an admin sees a link to it, on their owner
// home page and in their account menu).

export const metadata: Metadata = {
  title: "BahayFind team",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

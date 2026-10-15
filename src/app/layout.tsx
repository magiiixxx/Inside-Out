import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "BahayFind — rooms near PHINMA UI",
  description:
    "Find boarding house rooms near PHINMA University of Iloilo that owners confirm are available.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}

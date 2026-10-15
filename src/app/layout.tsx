import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AppChrome } from "@/components/app-chrome";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import "./globals.css";

// The font. next/font downloads it once when the app is built and serves it
// from our own site, so visitors' phones never contact Google. The variable
// is used by --font-sans in globals.css.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BahayFind — rooms near PHINMA UI",
  description:
    "Find boarding house rooms near PHINMA University of Iloilo that owners confirm are available.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <AppChrome header={<SiteHeader />} footer={<SiteFooter />}>
          {children}
        </AppChrome>
      </body>
    </html>
  );
}

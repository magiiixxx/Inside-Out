import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cookies } from "next/headers";
import Script from "next/script";
import { AppChrome } from "@/components/app-chrome";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { htmlAttributes, parsePrefs, PREFS_COOKIE } from "@/lib/preferences";
import "./globals.css";

// If the person chose "System" for the colour theme, this tiny script (which
// runs before the page is painted, so there is no flash) copies the device's
// light or dark setting onto <html>, and follows it if the device changes.
const SYSTEM_THEME_SCRIPT = `(function(){try{var d=document.documentElement;var m=window.matchMedia("(prefers-color-scheme: dark)");function a(){if(d.getAttribute("data-theme-pref")==="system"){d.setAttribute("data-theme",m.matches?"dark":"light")}}a();m.addEventListener("change",a)}catch(e){}})();`;

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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The person's display choices (colour theme, text size, ...), kept in a
  // cookie on their device. Unknown values fall back to the defaults.
  const prefs = parsePrefs((await cookies()).get(PREFS_COOKIE)?.value);

  return (
    <html
      lang="en"
      className={`${jakarta.variable} h-full antialiased`}
      {...htmlAttributes(prefs)}
      // The script above and the account menu change these attributes in the
      // browser, so React should not treat that as a mistake.
      suppressHydrationWarning
    >
      <head>
        <Script id="system-theme" strategy="beforeInteractive">
          {SYSTEM_THEME_SCRIPT}
        </Script>
      </head>
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

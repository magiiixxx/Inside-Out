// Display and accessibility preferences. They are kept in a cookie on the
// person's own device, so they work for everyone, need no database table, and
// can be read by the server on the next page load (no flash of the wrong
// colours). They are not secret and not sent anywhere else.
//
// Both the server (src/app/layout.tsx) and the account menu read and write
// the cookie with the functions below, so the allowed values live in one place.

export const PREFS_COOKIE = "bf_prefs";

export type Theme = "light" | "dark" | "system";
export type TextSize = "small" | "default" | "large";

export type Prefs = {
  theme: Theme;
  size: TextSize;
  reduceMotion: boolean;
  underlineLinks: boolean;
};

export const DEFAULT_PREFS: Prefs = {
  theme: "light",
  size: "default",
  reduceMotion: false,
  underlineLinks: false,
};

const THEMES: Theme[] = ["light", "dark", "system"];
const SIZES: TextSize[] = ["small", "default", "large"];

// Read the cookie text. Anything unexpected falls back to the default, so a
// tampered cookie can never put odd values into the page.
export function parsePrefs(raw: string | undefined | null): Prefs {
  if (!raw) return DEFAULT_PREFS;
  try {
    const data = JSON.parse(decodeURIComponent(raw)) as Partial<Record<keyof Prefs, unknown>>;
    return {
      theme: THEMES.includes(data.theme as Theme) ? (data.theme as Theme) : DEFAULT_PREFS.theme,
      size: SIZES.includes(data.size as TextSize) ? (data.size as TextSize) : DEFAULT_PREFS.size,
      reduceMotion: data.reduceMotion === true,
      underlineLinks: data.underlineLinks === true,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function serializePrefs(prefs: Prefs): string {
  return encodeURIComponent(JSON.stringify(prefs));
}

// The attributes put on the <html> element. The CSS in globals.css reacts to
// them. "data-theme" is the colour scheme actually shown (light or dark);
// when the choice is "system", a tiny script in the page head works it out
// from the device setting before the page is painted.
export function htmlAttributes(prefs: Prefs) {
  return {
    "data-theme": prefs.theme === "dark" ? "dark" : "light",
    "data-theme-pref": prefs.theme,
    "data-size": prefs.size,
    "data-motion": prefs.reduceMotion ? "reduce" : "normal",
    "data-links": prefs.underlineLinks ? "underline" : "normal",
  };
}

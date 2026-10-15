// Where a form sends the person afterwards. Used by the Save, Report and
// Rate buttons, which all return to the page they were pressed on.

// Where we are willing to send the person: the Saved page, or the home page
// with its filter (/?max=1500&sort=recent). Anything else, like another
// website's address, is ignored.
const SAFE_BACK = /^\/(\?[A-Za-z0-9=&._%-]*)?$/;

export function safeBack(value: string): string {
  return value === "/saved" || SAFE_BACK.test(value) ? value : "/saved";
}

// Add a short message CODE to the address (the page looks it up in
// src/lib/messages.ts; we never put raw text in the address).
export function withCode(back: string, key: "notice" | "error", code: string): string {
  return `${back}${back.includes("?") ? "&" : "?"}${key}=${code}`;
}

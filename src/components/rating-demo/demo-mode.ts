"use client";

import { useSyncExternalStore } from "react";

// Demo mode: a preview of how star ratings and sample reviews will look, shown
// only when someone asks for it. Nothing about it is saved to the database or
// counted as a real rating.
//
// It is OFF for everyone by default, and on the live site it cannot be turned on
// at all unless the team sets NEXT_PUBLIC_RATING_DEMO to "on" in Vercel (and
// redeploys). Without that, a link containing ?demo=ratings does nothing, so
// nobody can send real visitors a link that shows fictional reviews.
//
// With the setting on, opening a page with ?demo=ratings in the address turns the
// preview on, and ?demo=off turns it off. It lasts for this browser tab only
// (session storage).
//
// The setting is not a secret: it only allows the preview. Turn it on for a
// presentation and off again afterwards.

const KEY = "bf_rating_demo";
const EVENT = "bf-rating-demo";

// Is the preview allowed on this site at all?
export const DEMO_ALLOWED = process.env.NEXT_PUBLIC_RATING_DEMO === "on";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function snapshot(): boolean {
  if (!DEMO_ALLOWED) return false;
  try {
    return window.sessionStorage.getItem(KEY) === "on";
  } catch {
    return false; // storage can be blocked; then demo mode is simply off
  }
}

// true while demo mode is on. The page is first drawn with it off (as the server
// sees it), then switches over, so a normal visitor never sees a flash of demo.
export function useDemoMode(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}

export function setDemoMode(on: boolean) {
  if (!DEMO_ALLOWED) return; // not switched on for this site: ignore the address
  try {
    if (on) window.sessionStorage.setItem(KEY, "on");
    else window.sessionStorage.removeItem(KEY);
  } catch {
    // ignore: nothing to save when storage is blocked
  }
  window.dispatchEvent(new Event(EVENT));
}

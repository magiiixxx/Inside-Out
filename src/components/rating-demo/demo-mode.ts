"use client";

import { useSyncExternalStore } from "react";

// Demo mode: a preview of how star ratings and sample reviews will look, shown
// only when someone asks for it. Nothing about it is saved to the database or
// counted as a real rating.
//
// It is OFF for everyone by default. Opening a page with ?demo=ratings in the
// address turns it on, and ?demo=off turns it off. It lasts for this browser tab
// only (session storage), so a visitor who never uses that address never sees it.

const KEY = "bf_rating_demo";
const EVENT = "bf-rating-demo";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function snapshot(): boolean {
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
  try {
    if (on) window.sessionStorage.setItem(KEY, "on");
    else window.sessionStorage.removeItem(KEY);
  } catch {
    // ignore: nothing to save when storage is blocked
  }
  window.dispatchEvent(new Event(EVENT));
}

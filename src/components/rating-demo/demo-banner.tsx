"use client";

import { useEffect } from "react";
import { setDemoMode, useDemoMode } from "./demo-mode";

// Reads ?demo=ratings (on) and ?demo=off from the address, and while demo mode
// is on, says so clearly with a button to turn it off. Shows nothing otherwise.

export function DemoBanner() {
  const demo = useDemoMode();

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("demo");
    if (value === "ratings") setDemoMode(true);
    if (value === "off") setDemoMode(false);
  }, []);

  if (!demo) return null;

  return (
    <div role="status" className="alert-warning flex-wrap items-center justify-between gap-3">
      <p>
        <strong>Demo mode.</strong> The stars on rooms with no ratings are a preview with fictional sample reviews.
        Nothing you press is saved or counted, and real ratings are not changed.
      </p>
      <button type="button" onClick={() => setDemoMode(false)} className="btn-secondary min-h-10 px-4 py-1.5 text-sm">
        Turn off demo mode
      </button>
    </div>
  );
}

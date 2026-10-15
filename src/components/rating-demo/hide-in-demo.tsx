"use client";

import type { ReactNode } from "react";
import { useDemoMode } from "./demo-mode";

// Hides its content while demo mode is on. The real "Rate this room" row is
// wrapped in this, so a card never shows two competing sets of stars.

export function HideInDemo({ children }: { children: ReactNode }) {
  return useDemoMode() ? null : <>{children}</>;
}

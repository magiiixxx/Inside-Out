import type { ReactNode } from "react";

// Settings pages share this frame. Each page checks for a logged-in person
// itself (requireUser), because Next.js does not re-run a layout when someone
// moves between two pages inside it.

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

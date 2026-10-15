"use client";

import { useFormStatus } from "react-dom";
import { LogoutIcon } from "@/components/icons";

// The Log Out row of the account menu. It sits inside a form that calls the
// logout action, and shows "Logging out…" while that runs.

export function LogoutButton({ className }: { className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface">
        <LogoutIcon className="h-5 w-5" />
      </span>
      <span className="flex-1 text-left font-bold">{pending ? "Logging out\u2026" : "Log Out"}</span>
    </button>
  );
}

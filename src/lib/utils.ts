import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes, with later classes winning conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** A tap-to-call link for a phone number: spaces are removed ("0917 123 4567" becomes "tel:09171234567"). */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

/** Two letters for a round name badge: "Maria Santos" becomes "MS". */
export function initials(name: string): string {
  const letters = name
    .trim()
    .split(/s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return letters || "?";
}

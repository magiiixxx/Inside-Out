"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_PREFS,
  PREFS_COOKIE,
  serializePrefs,
  type Prefs,
  type TextSize,
  type Theme,
} from "@/lib/preferences";

// Colour theme, text size and two accessibility switches. The choices are
// applied at once, saved in a cookie on this device (see src/lib/preferences.ts)
// and announced to every other copy of these controls on the page, so the
// account menu and the Display settings page always agree.

const EVENT = "bf-prefs";

function applyToPage(prefs: Prefs) {
  const html = document.documentElement;
  const dark =
    prefs.theme === "dark" ||
    (prefs.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  html.setAttribute("data-theme", dark ? "dark" : "light");
  html.setAttribute("data-theme-pref", prefs.theme);
  html.setAttribute("data-size", prefs.size);
  html.setAttribute("data-motion", prefs.reduceMotion ? "reduce" : "normal");
  html.setAttribute("data-links", prefs.underlineLinks ? "underline" : "normal");
}

function save(prefs: Prefs) {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${PREFS_COOKIE}=${serializePrefs(prefs)}; path=/; max-age=31536000; samesite=lax${secure}`;
}

function usePrefs(initial: Prefs) {
  const [prefs, setPrefs] = useState<Prefs>(initial);

  // Stay in step with another copy of the controls on the same page.
  useEffect(() => {
    const onChange = (event: Event) => setPrefs((event as CustomEvent<Prefs>).detail);
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  function update(patch: Partial<Prefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    applyToPage(next);
    save(next);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
  }

  return { prefs, update };
}

const THEMES: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const SIZES: { value: TextSize; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "default", label: "Default" },
  { value: "large", label: "Large" },
];

// Three side-by-side choices (a "segmented control"), as a radio group.
function Choice<T extends string>({
  label,
  hint,
  options,
  value,
  onPick,
}: {
  label: string;
  hint?: string;
  options: { value: T; label: string }[];
  value: T;
  onPick: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-2">
      <div>
        <p className="text-sm font-bold">{label}</p>
        {hint && <p className="text-[0.8125rem] text-muted-foreground">{hint}</p>}
      </div>
      <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-surface p-1">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onPick(option.value)}
              className={`min-h-10 rounded-lg px-2 text-sm font-bold transition-colors ${
                selected ? "bg-action text-white shadow-sm" : "text-ink hover:bg-navy-soft"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// An on/off switch with a short explanation.
function Toggle({
  label,
  hint,
  checked,
  onToggle,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className="flex min-h-12 w-full items-center justify-between gap-4 rounded-xl px-1 py-1.5 text-left hover:bg-surface"
    >
      <span>
        <span className="block text-sm font-bold">{label}</span>
        <span className="block text-[0.8125rem] text-muted-foreground">{hint}</span>
      </span>
      <span
        aria-hidden="true"
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-action" : "bg-[#7d8ca3]"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[1.375rem]" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}

export function DisplayControls({
  initial = DEFAULT_PREFS,
  variant,
}: {
  initial?: Prefs;
  variant: "menu" | "page";
}) {
  const { prefs, update } = usePrefs(initial);
  const inMenu = variant === "menu";

  return (
    <div className="flex flex-col gap-5">
      <Choice
        label="Colour theme"
        hint={inMenu ? undefined : "System follows your phone or computer setting."}
        options={THEMES}
        value={prefs.theme}
        onPick={(theme) => update({ theme })}
      />
      <Choice
        label="Text size"
        hint={inMenu ? undefined : "Makes all the text on BahayFind bigger or smaller."}
        options={SIZES}
        value={prefs.size}
        onPick={(size) => update({ size })}
      />
      <div className="flex flex-col gap-1">
        <Toggle
          label="Reduce motion"
          hint="Turns off sliding and fading effects."
          checked={prefs.reduceMotion}
          onToggle={() => update({ reduceMotion: !prefs.reduceMotion })}
        />
        <Toggle
          label="Underline links"
          hint="Underlines every link, not just the coloured ones."
          checked={prefs.underlineLinks}
          onToggle={() => update({ underlineLinks: !prefs.underlineLinks })}
        />
      </div>
      <p className="text-[0.8125rem] text-muted-foreground">Saved on this device, so it stays when you come back.</p>
    </div>
  );
}

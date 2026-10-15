"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";
import { logout } from "@/app/auth/actions";
import { Avatar } from "@/components/avatar";
import { DisplayControls } from "@/components/display-controls";
import {
  ArrowLeftIcon,
  BellIcon,
  BookIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FlagIcon,
  GearIcon,
  HelpIcon,
  LockIcon,
  MessageIcon,
  MoonIcon,
  ShieldIcon,
  UserIcon,
} from "@/components/icons";
import { LogoutButton } from "@/components/logout-button";
import type { Prefs } from "@/lib/preferences";

// The account menu in the site header: the logged-in person's picture, name
// and email at the top, then Settings & Privacy, Help & Support, Report a
// Problem, Display & Accessibility and Log Out.
//
// All of the information comes from the logged-in account (see
// src/components/site-header.tsx); nothing here is sample data. Opening it
// shows a panel; it closes when you click outside, press Escape, or follow a
// link. Arrow keys, Home and End move between the items.

type View = "main" | "settings" | "help" | "display";

export type AccountMenuProps = {
  name: string;
  email: string;
  avatarUrl: string | null;
  roleLabel: string;
  planLabel: string | null;
  homeHref: string;
  homeLabel: string;
  prefs: Prefs;
};

const ROW =
  "flex min-h-12 w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left text-[0.9375rem] hover:bg-surface focus-visible:bg-surface disabled:opacity-60";

function IconCircle({ children }: { children: ReactNode }) {
  return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface">{children}</span>;
}

// One row of the menu: either a link to a page or a button that opens a panel.
function Row({
  icon,
  label,
  hint,
  href,
  onPick,
  chevron,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  href?: string;
  onPick: () => void;
  chevron?: boolean;
}) {
  const inner = (
    <>
      <IconCircle>{icon}</IconCircle>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{label}</span>
        {hint && <span className="block text-[0.8125rem] font-normal text-muted-foreground">{hint}</span>}
      </span>
      {chevron && <ChevronRightIcon className="h-5 w-5 shrink-0 text-muted-foreground" />}
    </>
  );
  return href ? (
    <Link href={href} onClick={onPick} className={ROW}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onPick} className={ROW}>
      {inner}
    </button>
  );
}

export function AccountMenu(props: AccountMenuProps) {
  const { name, email, avatarUrl, roleLabel, planLabel, homeHref, homeLabel, prefs } = props;
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("main");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  function close() {
    setOpen(false);
    setView("main");
  }

  // Close when the person clicks or taps anywhere outside the menu.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setView("main");
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Put the keyboard focus inside the panel when it opens or changes view.
  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("a[href], button:not([disabled])")?.focus();
  }, [open, view]);

  function focusables(): HTMLElement[] {
    return Array.from(panelRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? []);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
      triggerRef.current?.focus();
      return;
    }
    const items = focusables();
    if (items.length === 0) return;
    const index = items.indexOf(document.activeElement as HTMLElement);
    let next: number | null = null;
    if (event.key === "ArrowDown") next = index < 0 ? 0 : (index + 1) % items.length;
    if (event.key === "ArrowUp") next = index <= 0 ? items.length - 1 : index - 1;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = items.length - 1;
    if (next !== null) {
      event.preventDefault();
      items[next].focus();
    }
  }

  // Tabbing out of the panel closes it.
  function onBlur(event: FocusEvent<HTMLDivElement>) {
    if (!wrapperRef.current?.contains(event.relatedTarget as Node | null) && event.relatedTarget) close();
  }

  const goBack = (
    <button type="button" onClick={() => setView("main")} className={`${ROW} font-bold`}>
      <IconCircle>
        <ArrowLeftIcon className="h-5 w-5" />
      </IconCircle>
      <span>Back</span>
    </button>
  );

  return (
    <div ref={wrapperRef} className="relative" onBlur={onBlur}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Account menu for ${name}`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? close() : setOpen(true))}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-surface"
      >
        <Avatar name={name} url={avatarUrl} size={40} />
        <span className="hidden max-w-[10rem] truncate text-sm font-bold sm:block">{name}</span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          id={panelId}
          ref={panelRef}
          role="region"
          aria-label="Account menu"
          onKeyDown={onKeyDown}
          className="absolute right-0 top-full z-30 mt-2 max-h-[calc(100dvh-5.5rem)] w-[min(22.5rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-line bg-card p-2 shadow-[0_16px_40px_rgb(15_45_82/0.2)]"
        >
          {view === "main" && (
            <>
              <div className="rounded-xl border border-line p-3">
                <div className="flex items-center gap-3">
                  <Avatar name={name} url={avatarUrl} size={52} />
                  <div className="min-w-0">
                    <p className="truncate text-base font-extrabold">{name}</p>
                    <p className="truncate text-sm text-muted-foreground">{email}</p>
                    <p className="mt-1 flex flex-wrap gap-1.5">
                      <span className="chip chip-navy">{roleLabel}</span>
                      {planLabel && <span className="chip chip-amber">{planLabel}</span>}
                    </p>
                  </div>
                </div>
                <Link href={homeHref} onClick={close} className="btn-secondary mt-3 w-full">
                  {homeLabel}
                </Link>
              </div>

              <hr className="my-2 border-line" />

              <Row icon={<GearIcon className="h-5 w-5" />} label="Settings & Privacy" onPick={() => setView("settings")} chevron />
              <Row icon={<HelpIcon className="h-5 w-5" />} label="Help & Support" onPick={() => setView("help")} chevron />
              <Row icon={<FlagIcon className="h-5 w-5" />} label="Report a Problem" href="/report-problem" onPick={close} />
              <Row icon={<MoonIcon className="h-5 w-5" />} label="Display & Accessibility" onPick={() => setView("display")} chevron />

              <hr className="my-2 border-line" />

              <form action={logout}>
                <LogoutButton className={ROW} />
              </form>
            </>
          )}

          {view === "settings" && (
            <>
              {goBack}
              <p className="px-2 pb-1 pt-2 text-lg font-extrabold">Settings & Privacy</p>
              <Row icon={<UserIcon className="h-5 w-5" />} label="Account settings" hint="Your name and email" href="/settings/account" onPick={close} />
              <Row icon={<LockIcon className="h-5 w-5" />} label="Privacy" hint="What others can see" href="/settings/privacy" onPick={close} />
              <Row icon={<ShieldIcon className="h-5 w-5" />} label="Security" hint="Password and devices" href="/settings/security" onPick={close} />
              <Row icon={<BellIcon className="h-5 w-5" />} label="Notifications" hint="What we send you" href="/settings/notifications" onPick={close} />
            </>
          )}

          {view === "help" && (
            <>
              {goBack}
              <p className="px-2 pb-1 pt-2 text-lg font-extrabold">Help & Support</p>
              <Row icon={<BookIcon className="h-5 w-5" />} label="Help center" hint="Short guides for students and owners" href="/help" onPick={close} />
              <Row icon={<HelpIcon className="h-5 w-5" />} label="FAQs" hint="Quick answers" href="/help#faq" onPick={close} />
              <Row icon={<MessageIcon className="h-5 w-5" />} label="Contact support" hint="Send our team a question" href="/report-problem?kind=question" onPick={close} />
            </>
          )}

          {view === "display" && (
            <>
              {goBack}
              <p className="px-2 pb-3 pt-2 text-lg font-extrabold">Display & Accessibility</p>
              <div className="px-2 pb-2">
                <DisplayControls initial={prefs} variant="menu" />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

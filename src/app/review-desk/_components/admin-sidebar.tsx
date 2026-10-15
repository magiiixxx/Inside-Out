"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { logout } from "@/app/auth/actions";
import {
  ClockIcon,
  CloseIcon,
  CreditCardIcon,
  FlagIcon,
  HouseIcon,
  MenuIcon,
  MessageIcon,
  ShieldIcon,
} from "@/components/icons";
import { Logo } from "@/components/logo";
import { initials } from "@/lib/utils";

// The navy side panel of the team page.
//
// Desktop and tablet (768px and wider): a fixed panel on the left that stays in
// view while the page scrolls. Phone: a top bar with a menu button that opens
// the same panel as a drawer.
//
// The team page is ONE long page with sections, so the links jump to a section,
// and the section you are looking at is marked as the current one (scroll
// tracking). Links are grouped under small headings. A number badge shows how
// much is waiting in each section.

type Counts = { waiting: number; reports: number; messages: number; plans: number };

type Section = { id: string; label: string; icon: typeof ClockIcon; count?: keyof Counts };

const GROUPS: { label: string; items: Section[] }[] = [
  {
    label: "Review",
    items: [
      { id: "waiting", label: "Rooms waiting", icon: ClockIcon, count: "waiting" },
      { id: "reports", label: "Reports", icon: FlagIcon, count: "reports" },
      { id: "messages", label: "Messages", icon: MessageIcon, count: "messages" },
    ],
  },
  { label: "Owners", items: [{ id: "plans", label: "Plan requests", icon: CreditCardIcon, count: "plans" }] },
  { label: "Rooms", items: [{ id: "other", label: "Other rooms", icon: HouseIcon }] },
];

const SECTION_IDS = GROUPS.flatMap((group) => group.items.map((item) => item.id));

const ITEM =
  "group flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.9375rem] font-semibold transition-colors motion-reduce:transition-none";
const ITEM_IDLE = "text-navy-text hover:bg-navy-deep hover:text-white";
const ITEM_ACTIVE = "bg-navy-deep text-white shadow-[inset_3px_0_0_var(--color-amber)]";

export function AdminSidebar({ name, counts }: { name: string; counts: Counts }) {
  const [open, setOpen] = useState(false); // the drawer, on phones
  const [active, setActive] = useState(SECTION_IDS[0]);
  const pinned = useRef<string | null>(null); // a section the admin chose by clicking a link
  const asideRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  function closeDrawer(returnFocus = false) {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }

  // Scroll tracking: the current section is the last one whose top has passed a
  // line a little way down the screen. Above the first section, the first one is
  // current; at the very bottom of the page, the last one is.
  //
  // A link the admin clicked stays current until they scroll by hand. Without
  // that, a section near the bottom (which the page cannot scroll up to the top
  // of the screen) would lose the highlight to the last section.
  useEffect(() => {
    let frame = 0;
    function update() {
      frame = 0;
      if (pinned.current) {
        setActive(pinned.current);
        return;
      }
      const line = window.innerHeight * 0.3;
      let current = SECTION_IDS[0];
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom && window.scrollY > 0) current = SECTION_IDS[SECTION_IDS.length - 1];
      setActive(current);
    }
    // At most once per screen refresh, however fast the page is scrolled.
    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(update);
    }
    // The admin scrolling by hand (wheel, touch, scroll keys, or the scrollbar)
    // releases a clicked link.
    function release() {
      pinned.current = null;
      schedule();
    }
    function onKey(event: globalThis.KeyboardEvent) {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) release();
    }
    function onPointer(event: PointerEvent) {
      if (event.target === document.documentElement) release(); // the page's own scrollbar
    }
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("wheel", release, { passive: true });
    window.addEventListener("touchmove", release, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("wheel", release);
      window.removeEventListener("touchmove", release);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  // The drawer: Escape closes it, the page behind does not scroll, and focus
  // moves into it. (On wide screens the panel is always shown, so this never
  // runs there.)
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!open) return;
    if (event.key === "Escape") {
      event.stopPropagation();
      closeDrawer(true);
      return;
    }
    // Keep Tab inside the open drawer.
    if (event.key === "Tab") {
      const items = Array.from(asideRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? []);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  return (
    <>
      {/* Phone: a bar across the top with the menu button. */}
      <div className="on-dark sticky top-0 z-30 flex items-center justify-between gap-3 bg-navy px-4 py-3 text-white md:hidden">
        <div className="flex items-center gap-2.5">
          <Logo onDark />
          <span className="rounded-md bg-amber px-[7px] py-[3px] text-[0.6875rem] font-bold tracking-wide text-on-amber">ADMIN</span>
        </div>
        <button
          ref={toggleRef}
          type="button"
          aria-label="Open admin menu"
          aria-expanded={open}
          aria-controls="admin-nav"
          onClick={() => setOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-navy-deep"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      </div>

      {/* The dark backdrop behind the open drawer. Clicking it closes the drawer. */}
      {open && <div className="fixed inset-0 z-40 bg-black/55 md:hidden" aria-hidden="true" onClick={() => closeDrawer(true)} />}

      <aside
        id="admin-nav"
        ref={asideRef}
        onKeyDown={onKeyDown}
        aria-label="Team navigation"
        className={`on-dark z-50 flex flex-col gap-6 bg-navy px-4 py-5 text-white max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:w-[min(20rem,85vw)] max-md:overflow-y-auto max-md:shadow-2xl max-md:transition-transform motion-reduce:transition-none md:sticky md:top-0 md:h-dvh md:self-start md:overflow-y-auto ${
          open ? "" : "max-md:invisible max-md:-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2.5">
            <Logo onDark />
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close admin menu"
            onClick={() => closeDrawer(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-navy-deep md:hidden"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-1">
          <span className="rounded-md bg-amber px-[7px] py-[3px] text-[0.6875rem] font-bold tracking-wide text-on-amber">ADMIN</span>
          <p className="mt-2 text-[0.8125rem] text-navy-text">Team console</p>
        </div>

        <nav aria-label="Team sections" className="flex flex-1 flex-col gap-5">
          {GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-3 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-navy-text">{group.label}</p>
              <ul className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const isActive = active === item.id;
                  const count = item.count ? counts[item.count] : 0;
                  return (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        aria-current={isActive ? "location" : undefined}
                        onClick={() => {
                          pinned.current = item.id;
                          setActive(item.id);
                          setOpen(false);
                        }}
                        className={`${ITEM} ${isActive ? ITEM_ACTIVE : ITEM_IDLE}`}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {count > 0 && (
                          <span
                            className="min-w-6 rounded-full bg-amber px-2 py-0.5 text-center text-xs font-extrabold text-on-amber"
                            aria-label={`${count} waiting`}
                          >
                            {count}
                          </span>
                        )}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div>
            <p className="mb-1.5 px-3 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-navy-text">Your account</p>
            <ul className="flex flex-col gap-1">
              <li>
                <Link href="/review-desk/security" onClick={() => setOpen(false)} className={`${ITEM} ${ITEM_IDLE}`}>
                  <ShieldIcon className="h-5 w-5 shrink-0" />
                  <span className="flex-1">Two-step verification</span>
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        <div className="flex items-center gap-3 border-t border-navy-edge px-1 pt-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber text-[0.8125rem] font-extrabold text-on-amber">
            {initials(name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{name}</p>
            <form action={logout}>
              <button
                type="submit"
                className="rounded text-[0.8125rem] text-navy-text underline-offset-4 hover:text-white hover:underline"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}

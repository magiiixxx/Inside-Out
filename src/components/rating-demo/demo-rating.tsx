"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { CloseIcon, StarIcon } from "@/components/icons";
import { DEMO_LABEL, DEMO_REVIEWS, isDemoStars } from "./demo-reviews";

// A preview of the star rating and sample review that rooms will have. Five
// stars; pressing one selects that rating and opens a sample review for it.
// It is a PREVIEW: pressing a star saves nothing, submits nothing and changes no
// real rating. Everything it shows is labelled as demo data.

function Stars({
  value,
  onPick,
  onHover,
  size = "h-6 w-6",
  readOnly = false,
  groupLabel,
}: {
  value: number; // what is filled in (the hovered star, or the selected one)
  onPick?: (n: number, button: HTMLButtonElement) => void;
  onHover?: (n: number) => void;
  size?: string;
  readOnly?: boolean;
  groupLabel: string;
}) {
  return (
    <span role="group" aria-label={groupLabel} className="inline-flex" onPointerLeave={() => onHover?.(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= value;
        const star = (
          <StarIcon
            className={`${size} transition-[color,transform] duration-150 motion-reduce:transition-none ${
              on ? "scale-100 text-amber stroke-amber-text" : "text-star-off stroke-star-off"
            }`}
          />
        );
        return readOnly ? (
          <span key={n} className="inline-flex">
            {star}
          </span>
        ) : (
          <button
            key={n}
            type="button"
            aria-label={`Preview ${n} out of 5 stars (demo)`}
            onClick={(event) => onPick?.(n, event.currentTarget)}
            // The fill-up preview follows a MOUSE pointer only. Keyboard focus and
            // touch must not set it: they could leave a stale preview behind, so
            // the stars would disagree with the number shown beside them.
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") onHover?.(n);
            }}
            className="inline-flex h-8 w-7 items-center justify-center rounded-md hover:scale-110 motion-reduce:hover:scale-100"
          >
            {star}
          </button>
        );
      })}
    </span>
  );
}

export function DemoRating() {
  const [selected, setSelected] = useState(0); // 0 means nothing chosen yet
  const [hover, setHover] = useState(0);
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();

  function pick(n: number, button?: HTMLButtonElement) {
    if (!isDemoStars(n)) return;
    if (button) opener.current = button;
    setHover(0); // a clicked star shows the choice itself, never an old hover preview
    setSelected(n); // choosing the same star again changes nothing, it just keeps the panel open
    setOpen(true);
  }

  function close() {
    setOpen(false);
    opener.current?.focus();
  }

  const shown = hover || selected;
  const review = isDemoStars(selected) ? DEMO_REVIEWS[selected] : null;

  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5">
      <Stars value={shown} onPick={pick} onHover={setHover} groupLabel="Demo rating preview" />
      <p className="flex items-center gap-1.5 text-xs">
        <span className="rounded bg-amber-soft px-1.5 py-0.5 font-bold text-amber-text">DEMO</span>
        {selected ? (
          <span className="font-bold" aria-live="polite">
            {selected}.0 / 5
          </span>
        ) : (
          <span className="text-muted-foreground" aria-live="polite">
            No rating selected
          </span>
        )}
      </p>

      {open && review && isDemoStars(selected) && (
        <ReviewPanel
          titleId={titleId}
          rating={selected}
          review={review}
          onChange={(n) => pick(n)}
          onClose={close}
        />
      )}
    </div>
  );
}

// The sample review, as a dialog drawn above the page. It is placed on the page
// body (a "portal"), because a room card moves slightly when hovered and that
// would otherwise drag the dialog with it.
function ReviewPanel({
  titleId,
  rating,
  review,
  onChange,
  onClose,
}: {
  titleId: string;
  rating: number;
  review: { reviewer: string; date: string; text: string };
  onChange: (n: number) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [hover, setHover] = useState(0);

  // Move focus into the dialog, and stop the page behind it from scrolling.
  useEffect(() => {
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key === "Tab") {
      const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])") ?? []);
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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" onKeyDown={onKeyDown}>
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[92dvh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-3xl border border-line bg-card p-5 text-left shadow-[0_24px_60px_rgb(0_0_0/0.45)] sm:rounded-3xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-lg font-extrabold leading-tight">
              Sample review
            </h2>
            <p className="mt-1 inline-block rounded-md border border-amber bg-amber-soft px-2 py-1 text-[0.6875rem] font-extrabold tracking-wide text-amber-text">
              {DEMO_LABEL}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close sample review"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl hover:bg-surface"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Stars value={rating} readOnly size="h-7 w-7" groupLabel={`${rating} out of 5 stars`} />
          <p className="text-xl font-extrabold" aria-live="polite">
            {rating}.0 <span className="text-sm font-semibold text-muted-foreground">/ 5</span>
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <p className="font-bold">{review.reviewer}</p>
            <p className="text-sm text-muted-foreground">{review.date}</p>
          </div>
          <p className="mt-2 text-[0.9375rem] leading-relaxed">{review.text}</p>
        </div>

        <div>
          <p className="mb-1 text-sm font-bold">Try another rating</p>
          <Stars value={hover || rating} onPick={(n) => onChange(n)} onHover={setHover} groupLabel="Change the demo rating" />
        </div>

        <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
          This is an example of how ratings and reviews will look. Pressing a star does not submit a review, is
          not saved, and does not count toward any room&apos;s real rating. Real ratings come only from
          students who saved a room.
        </p>

        <button type="button" onClick={onClose} className="btn-secondary w-full">
          Close
        </button>
      </div>
    </div>,
    document.body,
  );
}

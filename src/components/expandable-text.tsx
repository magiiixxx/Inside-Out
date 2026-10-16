"use client";

import { useState } from "react";

// A paragraph that is cut off after a few lines when it is long, with a "Read
// more" button to show the rest. Room descriptions can be several hundred
// characters; shown in full they push the price and the Call button far down the
// card. Short text is shown as it is, with no button.

const LONG_AFTER = 170; // characters

export function ExpandableText({ text, className = "" }: { text: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > LONG_AFTER;

  return (
    <div>
      <p className={`break-words ${className} ${long && !open ? "line-clamp-4" : ""}`}>{text}</p>
      {long && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="mt-1.5 rounded text-sm font-bold text-link underline underline-offset-4"
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

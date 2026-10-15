"use client";

import { useState } from "react";
import { initials } from "@/lib/utils";

// The person's picture. It comes from their Google or Facebook account when
// they signed in with one. Without a picture, or if it fails to load, we show
// their initials instead. Only https addresses are used.

export function Avatar({
  name,
  url,
  size = 40,
}: {
  name: string;
  url?: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const usable = url && url.startsWith("https://") && !failed;

  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-action font-extrabold text-white"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {usable ? (
        // eslint-disable-next-line @next/next/no-img-element -- a small picture hosted by Google or Facebook
        <img
          src={url}
          alt=""
          width={size}
          height={size}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}

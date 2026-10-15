"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_BYTES } from "@/lib/photos";

// The photo picker on the Add and Edit room forms. It checks the chosen file
// in the browser, so a photo that is too big or the wrong kind gets a clear
// message right away. (Without this, a very large file would be stopped by
// the server with a plain error page.) The server checks again, because the
// browser's check can be skipped by anyone.

const PROBLEM = "The photo must be a JPG, PNG or WebP picture, up to 2 MB.";

export function PhotoField({ currentPhotoUrl }: { currentPhotoUrl?: string | null }) {
  const [problem, setProblem] = useState("");

  function check(input: HTMLInputElement) {
    const file = input.files?.[0];
    const bad = !!file && (file.size > MAX_PHOTO_BYTES || !ALLOWED_PHOTO_TYPES.includes(file.type));
    // A custom validity message also stops the form from being sent.
    input.setCustomValidity(bad ? PROBLEM : "");
    setProblem(bad ? PROBLEM : "");
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="photo">Photo of the room (optional)</Label>
      {currentPhotoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- a small preview of a file stored in Supabase
        <img src={currentPhotoUrl} alt="Current photo of the room" className="h-40 w-full rounded-xl object-cover" />
      )}
      <input
        id="photo"
        name="photo"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => check(event.currentTarget)}
        aria-invalid={problem ? true : undefined}
        aria-describedby="photo-hint"
        className="field mt-0 file:mr-3 file:rounded-lg file:border-0 file:bg-navy-soft file:px-3 file:py-1.5 file:font-semibold file:text-navy"
      />
      {problem && (
        <p role="alert" className="error-text">
          {problem}
        </p>
      )}
      <p id="photo-hint" className="hint">
        {currentPhotoUrl
          ? "Choose a file only if you want to replace this photo. A new photo is checked by our team again. "
          : ""}
        JPG, PNG or WebP, up to 2 MB.
      </p>
    </div>
  );
}

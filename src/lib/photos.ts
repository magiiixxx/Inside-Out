import type { SupabaseClient } from "@supabase/supabase-js";

// Room photos: one per room, stored in the Supabase Storage bucket
// "room-photos" (see supabase/sql/012-room-photos.sql). The database stores
// only the file's name inside the bucket (the "photo path").

export const PHOTO_BUCKET = "room-photos";
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2 MB, the same limit as the bucket

// The web address of a photo, built from its path. The bucket is public, but
// the path is a random name that only appears in rooms the visitor may see.
export function photoUrl(path: string | null | undefined): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!path || !base) return null;
  return `${base}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`;
}

// What kind of picture is this, judged by the file's first bytes? The file's
// declared type comes from the browser and can be faked, so we look inside.
function sniffExtension(bytes: Uint8Array): "jpg" | "png" | "webp" | null {
  const starts = (sig: number[], at = 0) => sig.every((b, i) => bytes[at + i] === b);
  if (starts([0xff, 0xd8, 0xff])) return "jpg";
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  // WebP is "RIFF" + 4 size bytes + "WEBP"
  if (starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8)) return "webp";
  return null;
}

const CONTENT_TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;

export type PhotoResult =
  | { ok: true; path: string | null } // path is null when no file was chosen
  | { ok: false; code: "bad_photo" | "photo_failed" };

// Check the chosen file and upload it into the caller's own folder. Uses the
// logged-in user's session, so the storage policies apply: nobody can add a
// file to someone else's folder.
export async function uploadPhoto(
  supabase: SupabaseClient,
  userId: string,
  file: FormDataEntryValue | null,
): Promise<PhotoResult> {
  // No file chosen: browsers send an empty file.
  if (!(file instanceof File) || file.size === 0) return { ok: true, path: null };
  if (file.size > MAX_PHOTO_BYTES) return { ok: false, code: "bad_photo" };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = sniffExtension(bytes);
  if (!extension) return { ok: false, code: "bad_photo" };

  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, bytes, { contentType: CONTENT_TYPES[extension], upsert: false });
  if (error) {
    console.error("Photo upload failed:", error.message);
    return { ok: false, code: "photo_failed" };
  }
  return { ok: true, path };
}

// Delete a photo file. Best effort: if it fails, the room is still fine and
// the leftover file is harmless, so we only log it.
export async function removePhoto(supabase: SupabaseClient, path: string | null | undefined) {
  if (!path) return;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([path]);
  if (error) console.error("Photo removal failed:", error.message);
}

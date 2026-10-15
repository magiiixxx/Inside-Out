import { headers } from "next/headers";

// Our own public address, for links that send the person back to us (social
// login, password emails). Supabase only accepts addresses on its allowed list
// (Authentication, URL Configuration), so a faked address is refused. If the
// team sets SITE_URL (for example https://inside-out-two.vercel.app) we use it
// as is; without it we use the address the request came to.
export async function siteUrl(): Promise<string> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  return (process.env.SITE_URL ?? `${protocol}://${host}`).replace(/\/$/, "");
}

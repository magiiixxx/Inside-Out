import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Runs before the pages below. Its only job is to keep the login session
// fresh: Supabase login tokens expire after about an hour, and only code
// that can set cookies (like this) can renew them. Without it, an owner
// would be logged out mid-session.
//
// It also sends a logged-OUT visitor away from the owner and saved-rooms
// pages before they load. That is a first gate only. It does NOT decide who
// may see what: every protected page checks the user and the role itself
// (see src/app/owner/page.tsx), and the database enforces the real rules
// with Row Level Security.

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  let response = NextResponse.next({ request });
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Asking Supabase who the user is is what triggers the token refresh.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // The team area: everything under /admin except its own sign-in page needs a
  // login. Whether the account is really an admin is checked by each page and by
  // the database, not here.
  if (!user && pathname.startsWith("/admin") && pathname !== "/admin/login") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const needsLogin =
    pathname === "/saved" ||
    pathname === "/report-problem" ||
    pathname.startsWith("/owner") ||
    pathname.startsWith("/settings");
  if (!user && needsLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

// Only pages that can show a logged-in person: the home page (a student
// sees Save buttons there), saved rooms, the plans page (the header shows
// who is logged in), the owner pages, log in, sign up, the password pages and
// the team page, settings, help and report a problem (the header shows who is
// logged in on all of them).
export const config = {
  matcher: [
    "/",
    "/saved",
    "/pricing",
    "/owner/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/admin",
    "/admin/:path*",
    "/settings/:path*",
    "/report-problem",
    "/help",
  ],
};

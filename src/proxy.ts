import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Runs before the pages below. Its only job is to keep the login session
// fresh: Supabase login tokens expire after about an hour, and only code
// that can set cookies (like this) can renew them. Without it, an owner
// would be logged out mid-session.
//
// It does NOT decide who may see what. Every protected page checks the
// user itself (see src/app/owner/page.tsx), and the database enforces the
// real rules with Row Level Security.

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
  await supabase.auth.getUser();

  return response;
}

// Only pages that involve login. The public Browse page needs no session.
export const config = {
  matcher: ["/owner/:path*", "/login", "/signup", "/admin/:path*"],
};

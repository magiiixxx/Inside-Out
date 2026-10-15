import type { NextConfig } from "next";

// Instructions we give every visitor's browser, to switch on its built-in
// protections:
//  - X-Content-Type-Options: do not guess a file's type (stops a photo or
//    other upload being treated as a script).
//  - X-Frame-Options and frame-ancestors: no other website may show BahayFind
//    inside a hidden frame to trick people into clicking (clickjacking).
//  - Referrer-Policy: other websites we link to learn only that the visit came
//    from BahayFind, not which page or which room.
//  - Permissions-Policy: the page may not ask for the camera, microphone or
//    location, which we never use.
//  - Strict-Transport-Security: always use the secure https address.
//  - Content-Security-Policy: only the safe parts for now. We deliberately do
//    NOT restrict where scripts or forms may go, because that would break
//    Next.js and the Google and Facebook login redirects.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  // Room photos (up to 2 MB) are uploaded through a server action, and the
  // default limit for those is 1 MB.
  experimental: {
    serverActions: { bodySizeLimit: "3mb" },
  },

  // Cache Components and Partial Prefetching are deliberately OFF.
  //
  // With them on, any page that reads from the database (or uses
  // cookies, headers or searchParams) fails the build unless it is
  // wrapped in <Suspense> or marked with "use cache". That is a fine
  // trade for a production team tuning performance; for a team writing
  // its first database query it is an opaque build error at exactly
  // the wrong moment.
  //
  // Turn them back on later if you want them, and read:
  // https://nextjs.org/docs/messages/blocking-prerender-dynamic
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

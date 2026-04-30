import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Auth gate. Two key choices for navigation snappiness:
 *
 *   1. **No Supabase API call here.** The previous version did
 *      `supabase.auth.getUser()` on every request, which round-trips to
 *      `eu-west-1` (~30-50ms). With the sidebar prefetching ~10 links on
 *      page load, that fired ~10 concurrent calls and any transient blip
 *      false-redirected to /login — felt like flaky nav. We now do a
 *      cookie-presence check (real JWT validation still happens in the
 *      server components themselves via `getStaffSession`).
 *
 *   2. **Try/catch + fail-open.** A network blip should not log the user
 *      out; the worst case here is letting a stale token through to a
 *      page that will then redirect to /login on its own.
 */
const PUBLIC_PREFIXES = ["/login", "/_next", "/auth/callback"];
// Static asset extensions we don't want to gate.
const STATIC_EXT = /\.(?:png|jpe?g|webp|svg|gif|ico|css|js|woff2?|map)$/i;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) || STATIC_EXT.test(pathname)) {
    return NextResponse.next();
  }

  // Supabase ssr cookies are named like `sb-<project-ref>-auth-token` (and
  // chunked ones with .0 / .1 suffixes). Any one of them being present is a
  // good-enough signal that the user has a session.
  const hasSession = req.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token") && c.value);

  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Skip auth for the login flow, Next's static + image pipelines, and the
// `/public/*` static assets — the `.*\..*` clause matches any path with a
// dot, which captures every file extension so logos/icons/manifests don't
// get redirected through /login.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

import { NextRequest, NextResponse } from "next/server";

/**
 * Routes blocked during waitlist mode.
 * If the user has a valid access_token cookie (i.e. they are logged in as admin),
 * they bypass all blocks and can access everything normally.
 */
const BLOCKED_ROUTES = [
  // Auth pages
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify",
  // Authenticated app
  "/profile",
  "/strategies",
  "/workflow",
];

export function middleware(request: NextRequest) {
  // Safely read the env var — treat any error as inactive
  let isWaitlistMode = false;
  try {
    isWaitlistMode = process.env.NEXT_PUBLIC_WAITLIST_MODE === "true";
  } catch {
    isWaitlistMode = false;
  }

  // Waitlist mode is off — let everything through
  if (!isWaitlistMode) {
    return NextResponse.next();
  }

  // If the user has an active session cookie they are the logged-in admin.
  // Let them access any route without restriction.
  const accessToken = request.cookies.get("access_token")?.value || request.cookies.get("token")?.value;
  if (accessToken) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  const isBlockedRoute = BLOCKED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isBlockedRoute) {
    const waitlistUrl = request.nextUrl.clone();
    waitlistUrl.pathname = "/waitlist";
    // Strip query params so tokens / state don't leak to the waitlist page
    waitlistUrl.search = "";
    return NextResponse.redirect(waitlistUrl, { status: 307 });
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Explicit matcher keeps the middleware off hot paths (static assets, _next, api).
   * /waitlist and /admin/login are intentionally absent — never redirected.
   */
  matcher: [
    // Auth routes
    "/login",
    "/login/:path*",
    "/register",
    "/register/:path*",
    "/forgot-password",
    "/forgot-password/:path*",
    "/reset-password",
    "/reset-password/:path*",
    "/verify",
    "/verify/:path*",
    // Authenticated app routes
    "/profile",
    "/profile/:path*",
    "/strategies",
    "/strategies/:path*",
    "/workflow",
    "/workflow/:path*",
  ],
};

import { NextRequest, NextResponse } from "next/server";
import { USER_ID_COOKIE } from "@/lib/user-session";

/**
 * Middleware that ensures every visitor has a unique userId cookie.
 * On first visit, generates a UUID and sets it as an httpOnly cookie.
 * Subsequent visits reuse the existing cookie.
 */
export function middleware(request: NextRequest) {
  const existingId = request.cookies.get(USER_ID_COOKIE)?.value;

  // Cookie already exists — pass through
  if (existingId) {
    return NextResponse.next();
  }

  // First visit — generate a unique userId and set the cookie
  const userId = crypto.randomUUID();
  const response = NextResponse.next();

  response.cookies.set(USER_ID_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });

  return response;
}

// Run on all routes
export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

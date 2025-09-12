import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Add routes that don't require authentication
const publicRoutes = [
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
];

// Add API routes that don't require authentication
const publicApiRoutes = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/refresh",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (
    publicRoutes.includes(pathname) ||
    publicApiRoutes.some((route) => pathname.startsWith(route))
  ) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/_next") ||
    pathname.includes(".") || // static files
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Check for auth token in cookies
  const token = request.cookies.get("auth-token");

  // Redirect to login if no token
  if (!token && !pathname.startsWith("/auth/")) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if trying to access auth pages while logged in
  if (token && pathname.startsWith("/auth/")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};

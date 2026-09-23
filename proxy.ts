import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE } from "@/lib/admin-session";

const SESSION_COOKIE = ADMIN_SESSION_COOKIE;

const PROTECTED_ROUTES = [
  "/admin",
  "/teams",
  "/matches",
];

function isProtectedRoute(pathname: string) {
  return PROTECTED_ROUTES.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`),
  );
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return NextResponse.next();
  }

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE);

  if (verifyAdminSessionToken(session?.value)) {
    return NextResponse.next();
  }

  const loginUrl = new URL(
    "/admin/login",
    request.url,
  );

  loginUrl.searchParams.set(
    "next",
    pathname,
  );

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/teams/:path*",
    "/matches/:path*",
  ],
};
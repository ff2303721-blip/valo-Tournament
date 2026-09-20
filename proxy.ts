import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "valorant_admin_session";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  const isLoginPage = pathname === "/admin/login";

  if (!isAdminRoute || isLoginPage) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE);

  if (session?.value === "authenticated") {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", request.url);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
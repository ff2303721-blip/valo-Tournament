import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session";

const SESSION_COOKIE = ADMIN_SESSION_COOKIE;

function shouldUseSecureCookie(request: Request) {
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();

  return (
    forwardedProtocol === "https" ||
    new URL(request.url).protocol === "https:"
  );
}

export async function POST(request: Request) {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: shouldUseSecureCookie(request),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

import { NextResponse } from "next/server";

const SESSION_COOKIE = "valorant_admin_session";

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

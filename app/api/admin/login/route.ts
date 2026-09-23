import { NextResponse } from "next/server";
import { createAdminSessionToken, ADMIN_SESSION_COOKIE } from "@/lib/admin-session";

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
  try {
    const body = await request.json();

    const username = String(body.username ?? "");
    const password = String(body.password ?? "");

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      return NextResponse.json(
        {
          error: "Admin authentication is not configured.",
        },
        { status: 500 },
      );
    }

    if (
      username !== adminUsername ||
      password !== adminPassword
    ) {
      return NextResponse.json(
        {
          error: "Invalid username or password.",
        },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set({
      name: SESSION_COOKIE,
      value: createAdminSessionToken(),
      httpOnly: true,
      secure: shouldUseSecureCookie(request),
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch {
    return NextResponse.json(
      {
        error: "Invalid login request.",
      },
      { status: 400 },
    );
  }
}

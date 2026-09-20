import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SESSION_COOKIE = "valorant_admin_session";

function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase public environment variables.",
    );
  }

  return createClient(url, key);
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase service role environment variable.",
    );
  }

  return createClient(url, serviceRoleKey);
}

function isAdmin(request: NextRequest) {
  return (
    request.cookies.get(SESSION_COOKIE)?.value ===
    "authenticated"
  );
}

export async function GET() {
  try {
    const supabase = getPublicClient();

    const { data, error } = await supabase
      .from("tournament_settings")
      .select(
        "id,tournament_name,tagline,updated_at",
      )
      .eq("id", 1)
      .single();

    if (error) {
      console.error(
        "GET /api/settings error:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load tournament settings.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      id: data.id,
      tournamentName: data.tournament_name,
      tagline: data.tagline,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error(
      "GET /api/settings exception:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to load tournament settings.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();

    const tournamentName =
      typeof body.tournamentName === "string"
        ? body.tournamentName.trim()
        : "";

    const tagline =
      typeof body.tagline === "string"
        ? body.tagline.trim()
        : "";

    if (!tournamentName) {
      return NextResponse.json(
        {
          error:
            "Tournament name is required.",
        },
        { status: 400 },
      );
    }

    if (tournamentName.length > 100) {
      return NextResponse.json(
        {
          error:
            "Tournament name must be 100 characters or fewer.",
        },
        { status: 400 },
      );
    }

    if (tagline.length > 160) {
      return NextResponse.json(
        {
          error:
            "Tagline must be 160 characters or fewer.",
        },
        { status: 400 },
      );
    }

    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("tournament_settings")
      .upsert(
        {
          id: 1,
          tournament_name: tournamentName,
          tagline,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        },
      )
      .select(
        "id,tournament_name,tagline,updated_at",
      )
      .single();

    if (error) {
      console.error(
        "PUT /api/settings error:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Unable to save tournament settings.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      id: data.id,
      tournamentName: data.tournament_name,
      tagline: data.tagline,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error(
      "PUT /api/settings exception:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to save tournament settings.",
      },
      { status: 500 },
    );
  }
}
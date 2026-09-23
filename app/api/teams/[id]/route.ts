import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE } from "@/lib/admin-session";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const SESSION_COOKIE = ADMIN_SESSION_COOKIE;

function resolveTeamLogo(teamId: string, rawLogo?: string | null): string {
  const pngPath = path.join(process.cwd(), "public", "logos", `${teamId}.png`);
  if (fs.existsSync(pngPath)) {
    return `/logos/${teamId}.png`;
  }
  const jpgPath = path.join(process.cwd(), "public", "logos", `${teamId}.jpg`);
  if (fs.existsSync(jpgPath)) {
    return `/logos/${teamId}.jpg`;
  }
  if (rawLogo && rawLogo.trim().length > 0) {
    if (rawLogo.startsWith("http://") || rawLogo.startsWith("https://") || rawLogo.startsWith("/logos/")) {
      return rawLogo;
    }
    return `/api/teams/${teamId}/logo`;
  }
  return "";
}

function getSupabaseAdmin() {
  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

function isAdmin(request: NextRequest) {
  return verifyAdminSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

async function getTeam(
  client: ReturnType<typeof getSupabaseAdmin>,
  id: string,
) {
  const { data: team, error: teamError } =
    await client
      .from("teams")
      .select("*")
      .eq("id", id)
      .maybeSingle();

  if (teamError) {
    throw new Error(teamError.message);
  }

  if (!team) {
    return null;
  }

  const { data: players, error: playersError } =
    await client
      .from("players")
      .select(
        "id, team_id, name, role",
      )
      .eq("team_id", id)
      .order("created_at", {
        ascending: true,
      });

  if (playersError) {
    throw new Error(playersError.message);
  }

  return {
    id: team.id,
    name: team.name,
    tag: team.tag,
    seed: team.seed,
    logo: resolveTeamLogo(team.id, team.logo),
    wins: team.wins ?? 0,
    losses: team.losses ?? 0,
    captainRank:
      team.captain_rank ?? "",
    players: (players ?? []).map(
      (player) => ({
        id: player.id,
        name: player.name,
        role:
          player.role ?? undefined,
      }),
    ),
  };
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const { id } = await context.params;

    const client = getSupabaseAdmin();

    const team = await getTeam(
      client,
      id,
    );

    if (!team) {
      return NextResponse.json(
        { error: "Team not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(team, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load team.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    const {
      name,
      tag,
      seed,
      logo,
      wins,
      losses,
      captainRank,
      players,
    } = body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof tag !== "string" ||
      !tag.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Team name and tag are required.",
        },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(Number(seed)) ||
      Number(seed) < 1
    ) {
      return NextResponse.json(
        {
          error:
            "Seed must be a positive integer.",
        },
        { status: 400 },
      );
    }

    const client = getSupabaseAdmin();

    const { data: existingTeam } =
      await client
        .from("teams")
        .select("id, logo")
        .eq("id", id)
        .maybeSingle();

    if (!existingTeam) {
      return NextResponse.json(
        { error: "Team not found." },
        { status: 404 },
      );
    }

    let logoToSave = existingTeam.logo ?? "";
    if (typeof logo === "string") {
      if (logo.startsWith("data:image/")) {
        logoToSave = logo;
        try {
          const match = logo.match(/^data:([a-zA-Z0-9\/\+]+);base64,(.+)$/);
          if (match) {
            const ext = match[1].includes("jpeg") || match[1].includes("jpg") ? "jpg" : "png";
            const targetPath = path.join(process.cwd(), "public", "logos", `${id}.${ext}`);
            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            fs.writeFileSync(targetPath, Buffer.from(match[2], "base64"));
          }
        } catch (e) {
          console.error("Failed to write updated logo file:", e);
        }
      } else if (logo === "") {
        logoToSave = "";
        try {
          const pPng = path.join(process.cwd(), "public", "logos", `${id}.png`);
          if (fs.existsSync(pPng)) fs.unlinkSync(pPng);
        } catch {}
      } else if (logo.startsWith("http://") || logo.startsWith("https://")) {
        logoToSave = logo;
      }
    }

    const { error: teamError } =
      await client
        .from("teams")
        .update({
          name: name.trim(),
          tag: tag.trim(),
          seed: Number(seed),
          logo: logoToSave,
          wins:
            Number.isInteger(Number(wins))
              ? Number(wins)
              : 0,
          losses:
            Number.isInteger(Number(losses))
              ? Number(losses)
              : 0,
          captain_rank:
            typeof captainRank ===
            "string"
              ? captainRank
              : "",
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", id);

    if (teamError) {
      return NextResponse.json(
        { error: teamError.message },
        { status: 400 },
      );
    }

    if (Array.isArray(players)) {
      const cleanPlayers = players
        .filter(
          (player) =>
            player &&
            typeof player.id === "string" &&
            typeof player.name ===
              "string" &&
            player.name.trim(),
        )
        .map((player) => ({
          id: player.id,
          team_id: id,
          name: player.name.trim(),
          role:
            typeof player.role ===
            "string"
              ? player.role
              : null,
        }));

      const { error: deleteError } =
        await client
          .from("players")
          .delete()
          .eq("team_id", id);

      if (deleteError) {
        return NextResponse.json(
          {
            error:
              deleteError.message,
          },
          { status: 400 },
        );
      }

      if (cleanPlayers.length > 0) {
        const { error:
          insertError } =
          await client
            .from("players")
            .insert(
              cleanPlayers,
            );

        if (insertError) {
          return NextResponse.json(
            {
              error:
                insertError.message,
            },
            { status: 400 },
          );
        }
      }
    }

    const updatedTeam =
      await getTeam(
        client,
        id,
      );

    return NextResponse.json(
      updatedTeam,
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update team.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
  }

  try {
    const { id } = await context.params;

    const client = getSupabaseAdmin();

    const { error } = await client
      .from("teams")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete team.",
      },
      { status: 500 },
    );
  }
}
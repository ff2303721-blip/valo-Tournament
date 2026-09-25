import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { unstable_cache, revalidateTag } from "next/cache";
import fs from "fs";
import path from "path";
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE } from "@/lib/admin-session";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SESSION_COOKIE = ADMIN_SESSION_COOKIE;

const TEAM_COLUMNS = "id, name, tag, seed, logo, wins, losses, captain_rank";
const PLAYER_COLUMNS = "id, team_id, name, role";

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

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getSupabasePublic() {
  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  return createClient(supabaseUrl, publishableKey);
}

function isAdmin(request: NextRequest) {
  return verifyAdminSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

type SupabaseTeamRow = {
  id: string;
  name: string;
  tag: string;
  seed: number;
  logo?: string | null;
  wins?: number | null;
  losses?: number | null;
  captain_rank?: string | null;
};

async function buildTeamResponse(
  client: ReturnType<typeof getSupabaseAdmin> | ReturnType<typeof getSupabasePublic>,
) {
  const { data: teamsData, error: teamsError } = await client
    .from("teams")
    .select(TEAM_COLUMNS)
    .order("seed", { ascending: true });

  if (teamsError) {
    throw new Error(teamsError.message);
  }

  const rawTeams = (teamsData as unknown as SupabaseTeamRow[]) ?? [];
  const teamIds = rawTeams.map((team) => team.id);

  let players: Array<{
    id: string;
    team_id: string;
    name: string;
    role: string | null;
  }> = [];

  if (teamIds.length > 0) {
    const { data, error } = await client
      .from("players")
      .select(PLAYER_COLUMNS)
      .in("team_id", teamIds)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      throw new Error(error.message);
    }

    players = data ?? [];
  }

  return rawTeams.map((team) => ({
    id: team.id,
    name: team.name,
    tag: team.tag,
    seed: team.seed,
    logo: resolveTeamLogo(team.id, team.logo),
    wins: team.wins ?? 0,
    losses: team.losses ?? 0,
    captainRank: team.captain_rank ?? "",
    players: players
      .filter((player) => player.team_id === team.id)
      .map((player) => ({
        id: player.id,
        name: player.name,
        role: player.role ?? undefined,
      })),
  }));
}

const getCachedTeams = unstable_cache(
  async () => {
    const client = getSupabasePublic();
    return await buildTeamResponse(client);
  },
  ["public-teams-list"],
  {
    revalidate: 60,
    tags: ["teams"],
  },
);

export async function GET() {
  try {
    const teams = await getCachedTeams();

    return NextResponse.json(teams, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load teams.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();

    const {
      id,
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
      typeof id !== "string" ||
      !id.trim() ||
      typeof name !== "string" ||
      !name.trim() ||
      typeof tag !== "string" ||
      !tag.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Team id, name, and tag are required.",
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

    const { error: teamError } = await client
      .from("teams")
      .insert({
        id: id.trim(),
        name: name.trim(),
        tag: tag.trim(),
        seed: Number(seed),
        logo:
          typeof logo === "string" ? logo : "",
        wins:
          Number.isInteger(Number(wins))
            ? Number(wins)
            : 0,
        losses:
          Number.isInteger(Number(losses))
            ? Number(losses)
            : 0,
        captain_rank:
          typeof captainRank === "string"
            ? captainRank
            : "",
      });

    if (teamError) {
      return NextResponse.json(
        { error: teamError.message },
        { status: 400 },
      );
    }

    if (Array.isArray(players) && players.length > 0) {
      const playerRows = players
        .filter(
          (player) =>
            player &&
            typeof player.id === "string" &&
            typeof player.name === "string" &&
            player.name.trim(),
        )
        .map((player) => ({
          id: player.id,
          team_id: id.trim(),
          name: player.name.trim(),
          role:
            typeof player.role === "string"
              ? player.role
              : null,
        }));

      if (playerRows.length > 0) {
        const { error: playersError } =
          await client
            .from("players")
            .insert(playerRows);

        if (playersError) {
          await client
            .from("teams")
            .delete()
            .eq("id", id.trim());

          return NextResponse.json(
            { error: playersError.message },
            { status: 400 },
          );
        }
      }
    }

    const teams = await buildTeamResponse(client);
    const createdTeam = teams.find(
      (team) => team.id === id.trim(),
    );

    try {
      revalidateTag("teams", "default");
      revalidateTag("matches", "default");
    } catch (e) {
      console.warn("revalidateTag error:", e);
    }

    return NextResponse.json(createdTeam, {
      status: 201,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create team.",
      },
      { status: 500 },
    );
  }
}
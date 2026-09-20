import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SESSION_COOKIE = "valorant_admin_session";

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
  return (
    request.cookies.get(SESSION_COOKIE)?.value ===
    "authenticated"
  );
}

async function buildTeamResponse(
  client: ReturnType<typeof getSupabaseAdmin>,
) {
  const { data: teams, error: teamsError } = await client
    .from("teams")
    .select("*")
    .order("seed", { ascending: true });

  if (teamsError) {
    throw new Error(teamsError.message);
  }

  const teamIds = (teams ?? []).map((team) => team.id);

  let players: Array<{
    id: string;
    team_id: string;
    name: string;
    role: string | null;
  }> = [];

  if (teamIds.length > 0) {
    const { data, error } = await client
      .from("players")
      .select("id, team_id, name, role")
      .in("team_id", teamIds)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      throw new Error(error.message);
    }

    players = data ?? [];
  }

  return (teams ?? []).map((team) => ({
    id: team.id,
    name: team.name,
    tag: team.tag,
    seed: team.seed,
    logo: team.logo ?? "",
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

export async function GET() {
  try {
    const client = getSupabasePublic();

    const { data: teams, error: teamsError } = await client
      .from("teams")
      .select("*")
      .order("seed", {
        ascending: true,
      });

    if (teamsError) {
      return NextResponse.json(
        { error: teamsError.message },
        { status: 500 },
      );
    }

    const teamIds = (teams ?? []).map((team) => team.id);

    let players: Array<{
      id: string;
      team_id: string;
      name: string;
      role: string | null;
    }> = [];

    if (teamIds.length > 0) {
      const { data, error } = await client
        .from("players")
        .select("id, team_id, name, role")
        .in("team_id", teamIds)
        .order("created_at", {
          ascending: true,
        });

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 },
        );
      }

      players = data ?? [];
    }

    const response = (teams ?? []).map((team) => ({
      id: team.id,
      name: team.name,
      tag: team.tag,
      seed: team.seed,
      logo: team.logo ?? "",
      wins: team.wins ?? 0,
      losses: team.losses ?? 0,
      captainRank: team.captain_rank ?? "",
      players: players
        .filter(
          (player) => player.team_id === team.id,
        )
        .map((player) => ({
          id: player.id,
          name: player.name,
          role: player.role ?? undefined,
        })),
    }));

    return NextResponse.json(response, {
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
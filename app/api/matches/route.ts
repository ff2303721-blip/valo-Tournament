import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { syncPlayoffsWithDatabase } from "@/lib/playoffs";
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE } from "@/lib/admin-session";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const SESSION_COOKIE = ADMIN_SESSION_COOKIE;

function getPublicClient() {
  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL",
    );
  }

  if (!publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  return createClient(
    supabaseUrl,
    publishableKey,
  );
}

function getAdminClient() {
  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL",
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY",
    );
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

function isAdmin(
  request: NextRequest,
) {
  return verifyAdminSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

interface DbMatch {
  id: string;
  match_number: number;
  stage: string;
  team1_id: string | null;
  team2_id: string | null;
  scheduled_at: string | null;
  map: string | null;
  best_of: number | null;
  team1_score: number | null;
  team2_score: number | null;
  status: "Scheduled" | "Live" | "Completed" | "Cancelled" | null;
  winner_id: string | null;
  mvp_player_id: string | null;
  top_fragger_player_id: string | null;
  created_at: string;
}

interface DbPlayerStat {
  id?: number;
  match_id?: string;
  player_id: string | null;
  player_name: string;
  team_id: string | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  acs: number | null;
  adr: number | string | null;
  kast: number | string | null;
}

function normalizeMatch(
  match: DbMatch,
  stats: DbPlayerStat[],
) {
  return {
    id: match.id,
    matchNumber:
      match.match_number,
    stage: match.stage,
    team1Id:
      match.team1_id ?? "",
    team2Id:
      match.team2_id ?? "",
    scheduledAt:
      match.scheduled_at ?? "",
    map: match.map ?? "TBD",
    bestOf:
      match.best_of ?? 1,
    team1Score:
      match.team1_score ?? 0,
    team2Score:
      match.team2_score ?? 0,
    status:
      match.status ?? "Scheduled",
    winnerId:
      match.winner_id ?? undefined,
    mvpPlayerId:
      match.mvp_player_id ??
      undefined,
    topFraggerPlayerId:
      match.top_fragger_player_id ??
      undefined,
    playerStats: stats.map(
      (stat) => ({
        playerId:
          stat.player_id ?? "",
        playerName:
          stat.player_name,
        teamId:
          stat.team_id ?? "",
        kills:
          stat.kills ?? 0,
        deaths:
          stat.deaths ?? 0,
        assists:
          stat.assists ?? 0,
        acs:
          stat.acs ?? 0,
        adr:
          Number(stat.adr ?? 0),
        kast:
          Number(stat.kast ?? 0),
      }),
    ),
    createdAt:
      match.created_at,
  };
}

async function getAllMatches(
  client: ReturnType<
    typeof getPublicClient
  >,
) {
  const {
    data: matches,
    error: matchesError,
  } = await client
    .from("matches")
    .select("*")
    .order(
      "match_number",
      {
        ascending: true,
      },
    );

  if (matchesError) {
    throw new Error(
      matchesError.message,
    );
  }

  if (!matches?.length) {
    return [];
  }

  const matchIds =
    matches.map(
      (match) => match.id,
    );

  const {
    data: stats,
    error: statsError,
  } = await client
    .from("match_player_stats")
    .select("*")
    .in(
      "match_id",
      matchIds,
    )
    .order("id", {
      ascending: true,
    });

  if (statsError) {
    throw new Error(
      statsError.message,
    );
  }

  return matches.map(
    (match) =>
      normalizeMatch(
        match,
        (stats ?? []).filter(
          (stat) =>
            stat.match_id ===
            match.id,
        ),
      ),
  );
}

export async function GET() {
  try {
    // Non-blocking background sync so GET response returns immediately
    try {
      const adminClient = getAdminClient();
      syncPlayoffsWithDatabase(adminClient).catch(() => {});
    } catch {
      // Ignore background sync errors
    }

    const client = getPublicClient();
    const matches = await getAllMatches(client);

    return NextResponse.json(matches, {
      headers: {
        "Cache-Control": "public, s-maxage=5, stale-while-revalidate=25",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load matches.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: NextRequest,
) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      {
        error:
          "Unauthorized.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const body =
      await request.json();

    const {
      id,
      matchNumber,
      stage,
      team1Id,
      team2Id,
      scheduledAt,
      map,
      bestOf,
      team1Score,
      team2Score,
      status,
      winnerId,
      mvpPlayerId,
      topFraggerPlayerId,
      playerStats,
    } = body;

    if (
      typeof id !==
        "string" ||
      !id.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Match ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      typeof stage !==
        "string" ||
      !stage.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Stage is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !Number.isInteger(
        Number(matchNumber),
      ) ||
      Number(matchNumber) < 1
    ) {
      return NextResponse.json(
        {
          error:
            "Match number must be a positive integer.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      ![1, 3, 5].includes(
        Number(bestOf),
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Best-of must be 1, 3, or 5.",
        },
        {
          status: 400,
        },
      );
    }

    const allowedStatuses = [
      "Scheduled",
      "Live",
      "Completed",
      "Cancelled",
    ];

    if (
      !allowedStatuses.includes(
        status,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid match status.",
        },
        {
          status: 400,
        },
      );
    }

    const client =
      getAdminClient();

    const {
      data: existing,
      error:
        existingError,
    } = await client
      .from("matches")
      .select("id")
      .eq(
        "id",
        id.trim(),
      )
      .maybeSingle();

    if (existingError) {
      throw new Error(
        existingError.message,
      );
    }

    if (existing) {
      return NextResponse.json(
        {
          error:
            "A match with this ID already exists.",
        },
        {
          status: 409,
        },
      );
    }

    const {
      error:
        insertError,
    } = await client
      .from("matches")
      .insert({
        id: id.trim(),
        match_number:
          Number(matchNumber),
        stage:
          stage.trim(),
        team1_id:
          team1Id || null,
        team2_id:
          team2Id || null,
        scheduled_at:
          scheduledAt ||
          null,
        map:
          typeof map ===
          "string"
            ? map
            : "TBD",
        best_of:
          Number(bestOf),
        team1_score:
          Number(team1Score) ||
          0,
        team2_score:
          Number(team2Score) ||
          0,
        status,
        winner_id:
          winnerId || null,
        mvp_player_id:
          mvpPlayerId || null,
        top_fragger_player_id:
          topFraggerPlayerId ||
          null,
      });

    if (insertError) {
      return NextResponse.json(
        {
          error:
            insertError.message,
        },
        {
          status: 400,
        },
      );
    }

    if (
      Array.isArray(
        playerStats,
      ) &&
      playerStats.length > 0
    ) {
      const rows =
        playerStats
          .filter(
            (stat) =>
              stat &&
              typeof stat.playerName ===
                "string" &&
              stat.playerName.trim(),
          )
          .map(
            (stat) => ({
              match_id:
                id.trim(),
              player_id:
                stat.playerId ||
                null,
              player_name:
                stat.playerName.trim(),
              team_id:
                stat.teamId ||
                null,
              kills:
                Number(
                  stat.kills,
                ) || 0,
              deaths:
                Number(
                  stat.deaths,
                ) || 0,
              assists:
                Number(
                  stat.assists,
                ) || 0,
              acs:
                Number(
                  stat.acs,
                ) || 0,
              adr:
                Number(
                  stat.adr,
                ) || 0,
              kast:
                Number(
                  stat.kast,
                ) || 0,
            }),
          );

      if (rows.length > 0) {
        const {
          error:
            statsError,
        } = await client
          .from(
            "match_player_stats",
          )
          .insert(rows);

        if (statsError) {
          await client
            .from("matches")
            .delete()
            .eq(
              "id",
              id.trim(),
            );

          return NextResponse.json(
            {
              error:
                statsError.message,
            },
            {
              status: 400,
            },
          );
        }
      }
    }

    const {
      data: created,
      error:
        createdError,
    } = await client
      .from("matches")
      .select("*")
      .eq(
        "id",
        id.trim(),
      )
      .single();

    if (createdError) {
      throw new Error(
        createdError.message,
      );
    }

    const {
      data: createdStats,
      error:
        createdStatsError,
    } = await client
      .from("match_player_stats")
      .select("*")
      .eq(
        "match_id",
        id.trim(),
      )
      .order("id", {
        ascending: true,
      });

    if (createdStatsError) {
      throw new Error(
        createdStatsError.message,
      );
    }

    return NextResponse.json(
      normalizeMatch(
        created,
        createdStats ?? [],
      ),
      {
        status: 201,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create match.",
      },
      {
        status: 500,
      },
    );
  }
}
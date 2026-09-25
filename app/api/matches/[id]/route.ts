import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { unstable_cache, revalidateTag } from "next/cache";
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
      match.winner_id ??
      undefined,
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
          Number(
            stat.adr ?? 0,
          ),
        kast:
          Number(
            stat.kast ?? 0,
          ),
      }),
    ),
    createdAt:
      match.created_at,
  };
}

const MATCH_COLUMNS =
  "id, match_number, stage, team1_id, team2_id, scheduled_at, map, best_of, team1_score, team2_score, status, winner_id, mvp_player_id, top_fragger_player_id, starting_side, created_at";

const STAT_COLUMNS =
  "id, match_id, player_id, player_name, team_id, kills, deaths, assists, acs, adr, kast";

async function loadMatch(
  client: ReturnType<
    typeof getPublicClient
  >,
  id: string,
) {
  const {
    data: match,
    error: matchError,
  } = await client
    .from("matches")
    .select(MATCH_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (matchError) {
    throw new Error(
      matchError.message,
    );
  }

  if (!match) {
    return null;
  }

  const {
    data: stats,
    error: statsError,
  } = await client
    .from("match_player_stats")
    .select(STAT_COLUMNS)
    .eq("match_id", id)
    .order("id", {
      ascending: true,
    });

  if (statsError) {
    throw new Error(
      statsError.message,
    );
  }

  return normalizeMatch(
    match as unknown as DbMatch,
    (stats ?? []) as unknown as DbPlayerStat[],
  );
}

const loadMatchCached = unstable_cache(
  async (id: string) => {
    const client = getPublicClient();
    return await loadMatch(client, id);
  },
  ["match-detail-by-id"],
  {
    revalidate: 60,
    tags: ["matches"],
  },
);

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  try {
    const { id } =
      await context.params;

    const match =
      await loadMatchCached(id);

    if (!match) {
      return NextResponse.json(
        {
          error:
            "Match not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      match,
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load match.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
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
    const { id } =
      await context.params;

    const body =
      await request.json();

    const {
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

    const client =
      getAdminClient();

    const {
      data: existing,
      error:
        existingError,
    } = await client
      .from("matches")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      throw new Error(
        existingError.message,
      );
    }

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Match not found.",
        },
        {
          status: 404,
        },
      );
    }

    const {
      error:
        updateError,
    } = await client
      .from("matches")
      .update({
        match_number:
          Number(matchNumber),
        stage:
          typeof stage ===
          "string"
            ? stage.trim()
            : "Group Stage",
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
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        {
          error:
            updateError.message,
        },
        {
          status: 400,
        },
      );
    }

    if (
      Array.isArray(
        playerStats,
      )
    ) {
      const {
        error:
          deleteStatsError,
      } = await client
        .from(
          "match_player_stats",
        )
        .delete()
        .eq(
          "match_id",
          id,
        );

      if (deleteStatsError) {
        return NextResponse.json(
          {
            error:
              deleteStatsError.message,
          },
          {
            status: 400,
          },
        );
      }

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
                id,
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
            insertStatsError,
        } = await client
          .from(
            "match_player_stats",
          )
          .insert(rows);

        if (
          insertStatsError
        ) {
          return NextResponse.json(
            {
              error:
                insertStatsError.message,
            },
            {
              status: 400,
            },
          );
        }
      }
    }

    try {
      await syncPlayoffsWithDatabase(client);
    } catch {
      // Ignore background sync errors
    }

    try {
      revalidateTag("matches", "default");
    } catch {}

    const updated =
      await loadMatch(
        client,
        id,
      );

    return NextResponse.json(
      updated,
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update match.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
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
    const { id } =
      await context.params;

    const client =
      getAdminClient();

    const {
      error,
    } = await client
      .from("matches")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message,
        },
        {
          status: 400,
        },
      );
    }

    try {
      revalidateTag("matches", "default");
    } catch {}

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
            : "Failed to delete match.",
      },
      {
        status: 500,
      },
    );
  }
}
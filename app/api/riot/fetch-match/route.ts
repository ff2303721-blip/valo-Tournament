import { NextRequest, NextResponse } from "next/server";

interface TeamPlayer {
  id: string;
  name: string;
}

interface FetchMatchRequestBody {
  riotId?: string;
  matchId?: string;
  region?: string;
  apiKey?: string;
  team1Id?: string;
  team2Id?: string;
  team1Players?: TeamPlayer[];
  team2Players?: TeamPlayer[];
}

interface RawPlayer {
  puuid?: string;
  name?: string;
  tag?: string;
  team?: string;
  character?: string;
  damage_made?: number;
  stats?: {
    score?: number;
    kills?: number;
    deaths?: number;
    assists?: number;
    headshots?: number;
    damage_made?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: FetchMatchRequestBody = await request.json();

    const apiKey =
      (body.apiKey && body.apiKey.trim()) ||
      (process.env.HENRIK_API_KEY && process.env.HENRIK_API_KEY.trim()) ||
      "";

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "HenrikDev API key is missing. Please set your free API key in Admin Settings or pass it in the request. (Get a free key at https://api.henrikdev.xyz/dashboard/)",
        },
        { status: 400 },
      );
    }

    const region = (body.region && body.region.trim().toLowerCase()) || "ap";
    const riotId = body.riotId?.trim();
    const matchId = body.matchId?.trim();

    if (!riotId && !matchId) {
      return NextResponse.json(
        {
          error:
            "Please provide a player's Riot ID (e.g. PlayerName#TAG) or a Match UUID.",
        },
        { status: 400 },
      );
    }

    let rawMatchData: any = null;

    if (matchId) {
      // Query specific match by ID
      const url = `https://api.henrikdev.xyz/valorant/v4/match/${encodeURIComponent(region)}/pc/${encodeURIComponent(matchId)}`;
      const res = await fetch(url, {
        headers: {
          Authorization: apiKey,
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        return NextResponse.json(
          {
            error: `HenrikDev API error (${res.status}): ${errText || "Unable to find match with that ID."}`,
          },
          { status: res.status },
        );
      }

      const json = await res.json();
      rawMatchData = json.data || json;
    } else if (riotId) {
      // Query latest match for player by Name + Tag
      if (!riotId.includes("#")) {
        return NextResponse.json(
          {
            error:
              "Invalid Riot ID format. Please use 'Name#TAG' (e.g. Nishku#VAL).",
          },
          { status: 400 },
        );
      }

      const [namePart, tagPart] = riotId.split("#");
      const name = namePart.trim();
      const tag = tagPart.trim();

      if (!name || !tag) {
        return NextResponse.json(
          {
            error:
              "Both Name and Tag are required in Riot ID (e.g. PlayerName#TAG).",
          },
          { status: 400 },
        );
      }

      // Try v4 endpoint first
      const v4Url = `https://api.henrikdev.xyz/valorant/v4/matches/${encodeURIComponent(region)}/pc/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?size=3`;
      let res = await fetch(v4Url, {
        headers: {
          Authorization: apiKey,
          Accept: "application/json",
        },
        cache: "no-store",
      });

      // If v4 returns 404/failure, fallback to v3
      if (!res.ok && res.status !== 401 && res.status !== 403 && res.status !== 429) {
        const v3Url = `https://api.henrikdev.xyz/valorant/v3/matches/${encodeURIComponent(region)}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?size=3`;
        res = await fetch(v3Url, {
          headers: {
            Authorization: apiKey,
            Accept: "application/json",
          },
          cache: "no-store",
        });
      }

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          return NextResponse.json(
            {
              error:
                "Invalid HenrikDev API Key. Please verify your key at https://api.henrikdev.xyz/dashboard/",
            },
            { status: 401 },
          );
        }
        if (res.status === 429) {
          return NextResponse.json(
            {
              error:
                "Rate limit exceeded on HenrikDev API (30 req/min). Please wait a few seconds and try again.",
            },
            { status: 429 },
          );
        }
        if (res.status === 404) {
          return NextResponse.json(
            {
              error: `Player '${riotId}' was not found on region '${region}'. Check spelling, capitalization, or region.`,
            },
            { status: 404 },
          );
        }

        const errText = await res.text().catch(() => "");
        return NextResponse.json(
          {
            error: `API returned error (${res.status}): ${errText || "Unable to fetch match history."}`,
          },
          { status: res.status },
        );
      }

      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [json];

      if (!list || list.length === 0) {
        return NextResponse.json(
          {
            error: `No recent matches found for '${riotId}'. If the match just finished, wait 15 seconds for Riot to process it.`,
          },
          { status: 404 },
        );
      }

      // Pick the most recent match
      rawMatchData = list[0];
    }

    if (!rawMatchData) {
      return NextResponse.json(
        { error: "Could not parse match data from Riot response." },
        { status: 500 },
      );
    }

    // Extract metadata
    const metadata = rawMatchData.metadata || {};
    let mapName = "Bind";
    if (typeof metadata.map === "object" && metadata.map !== null) {
      mapName = metadata.map.name || metadata.map.id || "Bind";
    } else if (typeof metadata.map === "string" && metadata.map.trim()) {
      mapName = metadata.map.trim();
    }

    // Extract team rounds
    let redRounds = 0;
    let blueRounds = 0;
    let redWon = false;
    let blueWon = false;

    if (Array.isArray(rawMatchData.teams)) {
      for (const t of rawMatchData.teams) {
        const teamId = (
          typeof t.team_id === "object" && t.team_id !== null
            ? t.team_id.name || t.team_id.id || ""
            : String(t.team_id || t.team || "")
        ).toLowerCase();
        const won = Boolean(t.won ?? t.has_won);
        let rounds = 0;
        if (typeof t.rounds === "object" && t.rounds !== null) {
          rounds = Number(t.rounds.won ?? t.rounds.score ?? 0);
        } else {
          rounds = Number(t.rounds_won ?? t.score ?? 0);
        }
        if (teamId === "red") {
          redRounds = rounds;
          redWon = won;
        } else if (teamId === "blue") {
          blueRounds = rounds;
          blueWon = won;
        }
      }
    } else if (rawMatchData.teams && typeof rawMatchData.teams === "object") {
      const red = rawMatchData.teams.red;
      const blue = rawMatchData.teams.blue;
      if (red) {
        if (typeof red.rounds === "object" && red.rounds !== null) {
          redRounds = Number(red.rounds.won ?? red.rounds.score ?? 0);
        } else {
          redRounds = Number(red.rounds_won ?? red.score ?? 0);
        }
        redWon = Boolean(red.has_won ?? red.won);
      }
      if (blue) {
        if (typeof blue.rounds === "object" && blue.rounds !== null) {
          blueRounds = Number(blue.rounds.won ?? blue.rounds.score ?? 0);
        } else {
          blueRounds = Number(blue.rounds_won ?? blue.score ?? 0);
        }
        blueWon = Boolean(blue.has_won ?? blue.won);
      }
    }

    let roundsPlayed =
      Number(metadata.rounds_played) ||
      (Array.isArray(rawMatchData.rounds) ? rawMatchData.rounds.length : 0) ||
      0;
    if (roundsPlayed === 0) {
      roundsPlayed = redRounds + blueRounds;
    }
    if (roundsPlayed === 0) {
      roundsPlayed = 20;
    }

    // Extract raw players list
    const rawPlayersList: any[] =
      rawMatchData.players?.all_players ||
      (Array.isArray(rawMatchData.players) ? rawMatchData.players : []) ||
      [];

    // Normalize team roster names for matching
    const team1Roster = body.team1Players || [];
    const team2Roster = body.team2Players || [];

    const norm = (s: string) => (s || "").split("#")[0].toLowerCase().replace(/[^a-z0-9]/g, "");

    const matchRoster = (r: TeamPlayer, pName: string, pFullName: string) => {
      const rNorm = norm(r.name);
      const pNorm = norm(pName);
      if (rNorm === pNorm) return true;

      const rFull = (r.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const fNorm = (pFullName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (rFull === fNorm) return true;

      return (
        (pNorm.length >= 3 && rNorm.includes(pNorm)) ||
        (rNorm.length >= 3 && pNorm.includes(rNorm)) ||
        (fNorm.length >= 3 && rFull.includes(fNorm))
      );
    };

    // Count how many team1 players are on "Red" vs "Blue"
    let team1OnRed = 0;
    let team1OnBlue = 0;
    let team2OnRed = 0;
    let team2OnBlue = 0;

    for (const p of rawPlayersList) {
      const pName =
        typeof p.name === "object" && p.name !== null
          ? String(p.name?.name || "Unknown")
          : String(p.name || "Unknown");
      const pTag = p.tag ? String(p.tag) : "";
      const pFullName = pTag ? `${pName}#${pTag}` : pName;

      let pTeam = "";
      if (typeof p.team === "object" && p.team !== null) {
        pTeam = String(p.team.name || p.team.id || "").toLowerCase();
      } else if (p.team) {
        pTeam = String(p.team).toLowerCase();
      } else if (p.team_id) {
        pTeam = String(p.team_id).toLowerCase();
      }

      const inTeam1 = team1Roster.some((r) => matchRoster(r, pName, pFullName));
      const inTeam2 = team2Roster.some((r) => matchRoster(r, pName, pFullName));

      if (inTeam1) {
        if (pTeam === "red") team1OnRed++;
        if (pTeam === "blue") team1OnBlue++;
      }
      if (inTeam2) {
        if (pTeam === "red") team2OnRed++;
        if (pTeam === "blue") team2OnBlue++;
      }
    }

    // Decide which in-game color maps to team1 and team2
    // If team1 has more on Red or team2 has more on Blue -> team1 is Red
    let team1Color = "red";
    let team2Color = "blue";

    if (team1OnBlue > team1OnRed || team2OnRed > team2OnBlue) {
      team1Color = "blue";
      team2Color = "red";
    }

    const team1Score = team1Color === "red" ? redRounds : blueRounds;
    const team2Score = team2Color === "red" ? redRounds : blueRounds;

    let winnerId = "";
    if (team1Score > team2Score && body.team1Id) {
      winnerId = body.team1Id;
    } else if (team2Score > team1Score && body.team2Id) {
      winnerId = body.team2Id;
    }

    // Format all player stats
    interface FormattedStat {
      playerId: string;
      playerName: string;
      teamId: string;
      kills: number;
      deaths: number;
      assists: number;
      acs: number;
      adr: number;
      kast: number;
      agent: string;
      combatScore: number;
    }

    const formattedStats: FormattedStat[] = [];
    let topFraggerName = "";
    let topFraggerId = "";
    let maxKills = -1;

    let mvpName = "";
    let mvpId = "";
    let maxCombatScoreOnWinner = -1;

    for (const p of rawPlayersList) {
      const pName =
        typeof p.name === "object" && p.name !== null
          ? String(p.name?.name || "Unknown")
          : String(p.name || "Unknown");
      const pTag = p.tag ? String(p.tag) : "";
      const pFullName = pTag ? `${pName}#${pTag}` : pName;

      let pTeam = "";
      if (typeof p.team === "object" && p.team !== null) {
        pTeam = String(p.team.name || p.team.id || "").toLowerCase();
      } else if (p.team) {
        pTeam = String(p.team).toLowerCase();
      } else if (p.team_id) {
        pTeam = String(p.team_id).toLowerCase();
      }

      let character = "";
      if (typeof p.agent === "object" && p.agent !== null) {
        character = String(p.agent.name || p.agent.id || "");
      } else if (typeof p.agent === "string") {
        character = p.agent;
      } else if (typeof p.character === "object" && p.character !== null) {
        character = String(p.character.name || p.character.id || "");
      } else if (typeof p.character === "string") {
        character = p.character;
      }

      const kills = Number(p.stats?.kills ?? 0);
      const deaths = Number(p.stats?.deaths ?? 0);
      const assists = Number(p.stats?.assists ?? 0);
      const score = Number(p.stats?.score ?? 0);
      const damage = Number(
        p.damage_made ??
          p.stats?.damage_made ??
          (typeof p.stats?.damage === "object" && p.stats?.damage !== null
            ? p.stats.damage.dealt
            : p.stats?.damage) ??
          0,
      );

      const acs = roundsPlayed > 0 ? Math.round(score / roundsPlayed) : score;
      const adr = roundsPlayed > 0 ? Math.round(damage / roundsPlayed) : 0;
      const kast = 75; // standard placeholder

      // Determine team assignment
      let assignedTeamId = "";
      let matchedPlayerId = "";

      if (pTeam === team1Color && body.team1Id) {
        assignedTeamId = body.team1Id;
        const matched = team1Roster.find((r) => matchRoster(r, pName, pFullName));
        if (matched) matchedPlayerId = matched.id;
      } else if (pTeam === team2Color && body.team2Id) {
        assignedTeamId = body.team2Id;
        const matched = team2Roster.find((r) => matchRoster(r, pName, pFullName));
        if (matched) matchedPlayerId = matched.id;
      }

      // Track Top Fragger
      if (kills > maxKills) {
        maxKills = kills;
        topFraggerName = pName;
        topFraggerId = matchedPlayerId;
      }

      // Track Match MVP (highest score on winning team)
      const isWinnerSide =
        winnerId &&
        ((winnerId === body.team1Id && pTeam === team1Color) ||
          (winnerId === body.team2Id && pTeam === team2Color));

      if (isWinnerSide && score > maxCombatScoreOnWinner) {
        maxCombatScoreOnWinner = score;
        mvpName = pName;
        mvpId = matchedPlayerId;
      }

      formattedStats.push({
        playerId: matchedPlayerId,
        playerName: pName,
        teamId: assignedTeamId,
        kills,
        deaths,
        assists,
        acs,
        adr,
        kast,
        agent: character,
        combatScore: score,
      });
    }

    // Fallback for MVP if winner side not detected
    if (!mvpName && formattedStats.length > 0) {
      const highestAcs = [...formattedStats].sort((a, b) => b.acs - a.acs)[0];
      mvpName = highestAcs.playerName;
      mvpId = highestAcs.playerId;
    }

    const matchIdStr = String(
      metadata.matchid ||
        metadata.match_id ||
        metadata.id ||
        rawMatchData.id ||
        matchId ||
        "",
    );

    return NextResponse.json({
      success: true,
      map: mapName,
      roundsPlayed,
      team1Score,
      team2Score,
      winnerId,
      mvpPlayerName: mvpName,
      mvpPlayerId: mvpId,
      topFraggerPlayerName: topFraggerName,
      topFraggerPlayerId: topFraggerId,
      stats: formattedStats,
      matchId: matchIdStr,
    });
  } catch (error) {
    console.error("POST /api/riot/fetch-match error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while fetching match data.",
      },
      { status: 500 },
    );
  }
}

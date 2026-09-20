"use client";

import Link from "next/link";
import { TournamentBrand } from "../../components/tournament-brand";
import { useEffect, useMemo, useState } from "react";

type MatchStatus =
  | "Scheduled"
  | "Live"
  | "Completed"
  | "Cancelled";

type PlayerStat = {
  playerId: string;
  playerName: string;
  teamId: string;
  kills: number;
  deaths: number;
  assists: number;
  acs: number;
  adr: number;
  kast: number;
};

type Match = {
  id: string;
  matchNumber: number;
  stage: string;
  team1Id: string;
  team2Id: string;
  scheduledAt: string;
  map: string;
  bestOf: number;
  team1Score: number;
  team2Score: number;
  status: MatchStatus;
  winnerId?: string;
  mvpPlayerId?: string;
  topFraggerPlayerId?: string;
  playerStats: PlayerStat[];
  createdAt: string;
};

type Team = {
  id: string;
  name: string;
  tag: string;
  seed: number;
  logo?: string;
  wins: number;
  losses: number;
  captainRank?: string;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value: string) {
  if (!value) {
    return "TBD";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    dateStyle: "full",
    timeStyle: "short",
  });
}

function getTeam(
  teams: Team[],
  id?: string,
) {
  return teams.find(
    (team) => team.id === id,
  );
}

function getTeamName(
  teams: Team[],
  id?: string,
) {
  return (
    getTeam(teams, id)?.name ??
    "TBD"
  );
}

function getTeamTag(
  teams: Team[],
  id?: string,
) {
  return (
    getTeam(teams, id)?.tag ??
    "TBD"
  );
}

function getPlayerName(
  stats: PlayerStat[],
  id?: string,
) {
  return (
    stats.find(
      (player) =>
        player.playerId ===
        id,
    )?.playerName ??
    "—"
  );
}

function statusClass(
  status: MatchStatus,
) {
  if (status === "Live") {
    return "border-red-400/40 bg-red-500/10 text-red-300 shadow-[0_0_20px_rgba(248,113,113,0.12)]";
  }

  if (status === "Completed") {
    return "border-emerald-400/40 bg-emerald-500/10 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.10)]";
  }

  return "border-[#52e2ff]/25 bg-[#52e2ff]/[0.06] text-[#a9dff0]";
}

export default function PublicMatchDetailPage({
  params,
}: PageProps) {
  const [matchId, setMatchId] =
    useState("");

  const [match, setMatch] =
    useState<Match | null>(
      null,
    );

  const [teams, setTeams] =
    useState<Team[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const resolved =
          await params;

        if (!active) {
          return;
        }

        setMatchId(
          resolved.id,
        );

        const [
          matchResponse,
          teamsResponse,
        ] = await Promise.all([
          fetch(
            `/api/matches/${encodeURIComponent(
              resolved.id,
            )}`,
            {
              cache: "force-cache",
            },
          ),
          fetch("/api/teams", {
            cache: "force-cache",
          }),
        ]);

        const matchData =
          await matchResponse.json();

        const teamsData =
          await teamsResponse.json();

        if (!matchResponse.ok) {
          throw new Error(
            matchData.error ||
              "Failed to load match.",
          );
        }

        if (!teamsResponse.ok) {
          throw new Error(
            teamsData.error ||
              "Failed to load teams.",
          );
        }

        if (!active) {
          return;
        }

        setMatch(
          matchData,
        );

        setTeams(
          Array.isArray(
            teamsData,
          )
            ? teamsData
            : [],
        );
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load match.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [params]);

  const team1 =
    useMemo(
      () =>
        getTeam(
          teams,
          match?.team1Id,
        ),
      [teams, match],
    );

  const team2 =
    useMemo(
      () =>
        getTeam(
          teams,
          match?.team2Id,
        ),
      [teams, match],
    );

  const team1Stats =
    useMemo(
      () =>
        (match?.playerStats ??
          []).filter(
            (stat) =>
              stat.teamId ===
              match?.team1Id,
          ),
      [match],
    );

  const team2Stats =
    useMemo(
      () =>
        (match?.playerStats ??
          []).filter(
            (stat) =>
              stat.teamId ===
              match?.team2Id,
          ),
      [match],
    );

  const sortedStats =
    useMemo(
      () =>
        [
          ...(match?.playerStats ??
            []),
        ].sort(
          (a, b) =>
            b.kills -
            a.kills ||
            a.deaths -
              b.deaths ||
            b.assists -
              a.assists,
        ),
      [match],
    );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#04070f] text-white">
        <div className="text-sm text-[#7188a5]">
          Loading match...
        </div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="min-h-screen bg-[#04070f] px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl rounded-xl border border-[#ff3158]/40 bg-[#ff3158]/10 p-8">
          <h1 className="text-2xl font-black">
            Match not found
          </h1>

          <p className="mt-2 text-sm text-red-300">
            {error ||
              `No match exists for ${matchId}.`}
          </p>

          <Link
            href="/tournament/matches"
            className="mt-6 inline-block rounded border border-[#2b3d58] bg-[#0b1220] px-4 py-2 text-xs font-bold text-[#bcd0e8]"
          >
            ← ALL MATCHES
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#050810] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(255,49,88,0.12),transparent_25%),radial-gradient(circle_at_85%_20%,rgba(39,217,255,0.10),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(139,92,246,0.10),transparent_35%)]" />
      <header className="relative border-b border-[#243247] bg-[#070c17]/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <Link
            href="/tournament/matches"
            className="text-xs font-black uppercase tracking-wider text-[#52e2ff] transition hover:text-white"
          >
            ← All Matches
          </Link>

          <div className="mb-5">
            <TournamentBrand compact />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#52e2ff]">
                MATCH{" "}
                {String(
                  match.matchNumber,
                ).padStart(
                  2,
                  "0",
                )}
              </div>

              <h1 className="mt-2 bg-gradient-to-r from-white via-[#ffdce4] to-[#ff5275] bg-clip-text text-4xl font-black uppercase tracking-tight text-transparent">
                {
                  match.stage
                }
              </h1>

              <div className="mt-2 text-sm font-bold text-[#8195b0]">
                {match.map} · BO
                {
                  match.bestOf
                }
              </div>
            </div>

            <div
              className={`rounded-xl border px-4 py-2 text-[10px] font-black uppercase tracking-wider ${statusClass(
                match.status,
              )}`}
            >
              {
                match.status
              }
            </div>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl px-6 py-8">
        <section className="relative overflow-hidden rounded-2xl border border-[#2b3d58] bg-gradient-to-br from-[#0d1522] via-[#0a1019] to-[#111020] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.25)] sm:p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff3158] to-transparent opacity-80" />

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-6">
            <div className="text-center">
              {team1?.logo ? (
                <img
                  src={
                    team1.logo
                  }
                  alt=""
                  className="mx-auto mb-4 h-24 w-24 rounded-2xl border border-[#52e2ff]/30 bg-[#060b14] object-contain p-2.5 shadow-[0_0_30px_rgba(39,217,255,0.10)] sm:h-28 sm:w-28"
                />
              ) : (
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl border border-[#52e2ff]/30 bg-[#060b14] text-xl font-black text-[#72e9ff] shadow-[0_0_30px_rgba(39,217,255,0.08)] sm:h-28 sm:w-28">
                  {(
                    team1?.tag ??
                    "TBD"
                  ).slice(
                    0,
                    3,
                  )}
                </div>
              )}

              <div className="text-lg font-black uppercase tracking-tight text-white sm:text-xl">
                {
                  team1?.name ??
                  "TBD"
                }
              </div>

              <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-[#637a96]">
                {
                  team1?.tag ??
                  "TBD"
                }
              </div>
            </div>

            <div className="text-center">
              <div className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                {
                  match.team1Score
                }{" "}
                <span className="text-[#ff5275]">
                  -
                </span>{" "}
                {
                  match.team2Score
                }
              </div>

              <div className="mt-3 text-[9px] font-black uppercase tracking-[0.22em] text-[#52e2ff]">
                {match.status ===
                "Completed"
                  ? "FINAL"
                  : "SCORE"}
              </div>
            </div>

            <div className="text-center">
              {team2?.logo ? (
                <img
                  src={
                    team2.logo
                  }
                  alt=""
                  className="mx-auto mb-4 h-28 w-28 rounded-xl border border-[#2d4056] bg-[#080e16] object-contain p-3"
                />
              ) : (
                <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-xl border border-[#2d4056] bg-[#080e16] text-xl font-black text-[#7188a5]">
                  {(
                    team2?.tag ??
                    "TBD"
                  ).slice(
                    0,
                    3,
                  )}
                </div>
              )}

              <div className="text-xl font-black">
                {
                  team2?.name ??
                  "TBD"
                }
              </div>

              <div className="mt-1 text-xs font-bold text-[#647a94]">
                {
                  team2?.tag ??
                  "TBD"
                }
              </div>
            </div>
          </div>

          <div className="mt-7 border-t border-white/[0.07] pt-5 text-center text-xs font-bold text-[#7188a5]">
            {formatDate(
              match.scheduledAt,
            )}
          </div>
        </section>

        {match.status ===
          "Completed" && (
          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[#263750] bg-gradient-to-br from-[#0d1521] to-[#0a1019] p-5 transition hover:border-[#52e2ff]/30">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#52e2ff]">
                WINNER
              </div>

              <div className="mt-2 text-lg font-black text-emerald-300">
                {getTeamName(
                  teams,
                  match.winnerId,
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[#1d2a3a] bg-[#0d141e] p-5">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#607791]">
                MVP
              </div>

              <div className="mt-2 text-lg font-black">
                {getPlayerName(
                  match.playerStats,
                  match.mvpPlayerId,
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[#1d2a3a] bg-[#0d141e] p-5">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#607791]">
                TOP FRAGGER
              </div>

              <div className="mt-2 text-lg font-black">
                {getPlayerName(
                  match.playerStats,
                  match.topFraggerPlayerId,
                )}
              </div>
            </div>
          </section>
        )}

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#263750] bg-gradient-to-br from-[#0d1521] to-[#0a1019]">
          <div className="border-b border-white/[0.07] bg-white/[0.015] p-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#607791]">
              PLAYER STATISTICS
            </div>

            <h2 className="mt-2 text-xl font-black uppercase">
              Match Performance
            </h2>
          </div>

          {sortedStats.length ===
            0 ? (
            <div className="p-10 text-center text-sm text-[#7188a5]">
              Player statistics have not been entered for this match yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-[#111b28] text-[10px] font-black uppercase tracking-wider text-[#52e2ff]">
                  <tr>
                    <th className="px-5 py-3">
                      Player
                    </th>
                    <th className="px-3 py-3">
                      Team
                    </th>
                    <th className="px-3 py-3">
                      K
                    </th>
                    <th className="px-3 py-3">
                      D
                    </th>
                    <th className="px-3 py-3">
                      A
                    </th>
                    <th className="px-3 py-3">
                      ACS
                    </th>
                    <th className="px-3 py-3">
                      ADR
                    </th>
                    <th className="px-3 py-3">
                      KAST
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {sortedStats.map(
                    (
                      stat,
                      index,
                    ) => {
                      const isMvp =
                        stat.playerId ===
                        match.mvpPlayerId;

                      const isTopFragger =
                        stat.playerId ===
                        match.topFraggerPlayerId;

                      return (
                        <tr
                          key={`${stat.playerId}-${index}`}
                          className="border-t border-[#1c2938]"
                        >
                          <td className="px-5 py-4">
                            <div className="font-bold">
                              {
                                stat.playerName
                              }
                            </div>

                            {(isMvp ||
                              isTopFragger) && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {isMvp && (
                                  <span className="rounded border border-yellow-900/50 bg-yellow-950/20 px-2 py-0.5 text-[8px] font-black text-yellow-300">
                                    MVP
                                  </span>
                                )}

                                {isTopFragger && (
                                  <span className="rounded border border-purple-900/50 bg-purple-950/20 px-2 py-0.5 text-[8px] font-black text-purple-300">
                                    TOP FRAG
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="px-3 py-4 text-xs font-bold text-[#7890ad]">
                            {
                              getTeamTag(
                                teams,
                                stat.teamId,
                              )
                            }
                          </td>

                          <td className="px-3 py-4 font-black">
                            {
                              stat.kills
                            }
                          </td>

                          <td className="px-3 py-4">
                            {
                              stat.deaths
                            }
                          </td>

                          <td className="px-3 py-4">
                            {
                              stat.assists
                            }
                          </td>

                          <td className="px-3 py-4 font-bold">
                            {
                              stat.acs
                            }
                          </td>

                          <td className="px-3 py-4">
                            {
                              Number(
                                stat.adr,
                              ).toFixed(
                                1,
                              )
                            }
                          </td>

                          <td className="px-3 py-4">
                            {
                              Number(
                                stat.kast,
                              ).toFixed(
                                1,
                              )}
                            %
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[#1d2a3a] bg-[#0d141e] p-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#607791]">
              {getTeamName(
                teams,
                match.team1Id,
              )}
            </div>

            <div className="mt-4 space-y-2">
              {team1Stats.length ===
                0 ? (
                <div className="text-sm text-[#7188a5]">
                  No player stats recorded.
                </div>
              ) : (
                team1Stats.map(
                  (stat) => (
                    <div
                      key={
                        stat.playerId
                      }
                      className="flex items-center justify-between border-b border-[#1c2938] py-2 last:border-0"
                    >
                      <span className="text-sm font-bold">
                        {
                          stat.playerName
                        }
                      </span>

                      <span className="text-xs text-[#7890ad]">
                        {
                          stat.kills
                        }{" "}
                        /{" "}
                        {
                          stat.deaths
                        }{" "}
                        /{" "}
                        {
                          stat.assists
                        }
                      </span>
                    </div>
                  ),
                )
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[#1d2a3a] bg-[#0d141e] p-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#607791]">
              {getTeamName(
                teams,
                match.team2Id,
              )}
            </div>

            <div className="mt-4 space-y-2">
              {team2Stats.length ===
                0 ? (
                <div className="text-sm text-[#7188a5]">
                  No player stats recorded.
                </div>
              ) : (
                team2Stats.map(
                  (stat) => (
                    <div
                      key={
                        stat.playerId
                      }
                      className="flex items-center justify-between border-b border-[#1c2938] py-2 last:border-0"
                    >
                      <span className="text-sm font-bold">
                        {
                          stat.playerName
                        }
                      </span>

                      <span className="text-xs text-[#7890ad]">
                        {
                          stat.kills
                        }{" "}
                        /{" "}
                        {
                          stat.deaths
                        }{" "}
                        /{" "}
                        {
                          stat.assists
                        }
                      </span>
                    </div>
                  ),
                )
              )}
            </div>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/tournament/matches"
            className="rounded border border-[#2b3d58] bg-[#0b1220] px-5 py-3 text-xs font-bold text-[#bcd0e8]"
          >
            ← ALL MATCHES
          </Link>

          <Link
            href="/tournament/teams"
            className="rounded border border-[#2b3d58] bg-[#0b1220] px-5 py-3 text-xs font-bold text-[#bcd0e8]"
          >
            VIEW TEAMS
          </Link>
        </div>
      </div>
    </main>
  );
}
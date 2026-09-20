"use client";

import Link from "next/link";
import { TournamentBrand } from "../components/tournament-brand";
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

const STATUS_OPTIONS = [
  "All",
  "Scheduled",
  "Live",
  "Completed",
  "Cancelled",
];

function formatDate(value: string) {
  if (!value) {
    return "TBD";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
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

function statusClass(
  status: MatchStatus,
) {
  if (status === "Live") {
    return "border-red-400/40 bg-red-500/10 text-red-300 shadow-[0_0_18px_rgba(248,113,113,0.12)]";
  }

  if (status === "Completed") {
    return "border-emerald-400/40 bg-emerald-500/10 text-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.10)]";
  }

  if (status === "Cancelled") {
    return "border-red-400/30 bg-red-500/10 text-red-300";
  }

  return "border-[#52e2ff]/25 bg-[#52e2ff]/[0.06] text-[#a9dff0]";
}

export default function PublicMatchesPage() {
  const [matches, setMatches] =
    useState<Match[]>([]);

  const [teams, setTeams] =
    useState<Team[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [stage, setStage] =
    useState("All");

  const [status, setStatus] =
    useState("All");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [
          matchesResponse,
          teamsResponse,
        ] = await Promise.all([
          fetch("/api/matches", {
            cache: "no-store",
          }),
          fetch("/api/teams", {
            cache: "no-store",
          }),
        ]);

        const matchesData =
          await matchesResponse.json();

        const teamsData =
          await teamsResponse.json();

        if (!matchesResponse.ok) {
          throw new Error(
            matchesData.error ||
              "Failed to load matches.",
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

        setMatches(
          Array.isArray(matchesData)
            ? matchesData
            : [],
        );

        setTeams(
          Array.isArray(teamsData)
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
            : "Failed to load matches.",
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
  }, []);

  const stages =
    useMemo(() => {
      return [
        "All",
        ...Array.from(
          new Set(
            matches
              .map(
                (match) =>
                  match.stage,
              )
              .filter(Boolean),
          ),
        ),
      ];
    }, [matches]);

  const filteredMatches =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return [...matches]
        .filter((match) => {
          if (
            status !== "All" &&
            match.status !== status
          ) {
            return false;
          }

          if (
            stage !== "All" &&
            match.stage !== stage
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const searchable = [
            match.id,
            String(
              match.matchNumber,
            ),
            match.stage,
            match.map,
            getTeamName(
              teams,
              match.team1Id,
            ),
            getTeamName(
              teams,
              match.team2Id,
            ),
            getTeamTag(
              teams,
              match.team1Id,
            ),
            getTeamTag(
              teams,
              match.team2Id,
            ),
          ]
            .join(" ")
            .toLowerCase();

          return searchable.includes(
            query,
          );
        })
        .sort(
          (a, b) =>
            a.matchNumber -
            b.matchNumber,
        );
    }, [
      matches,
      teams,
      search,
      stage,
      status,
    ]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#050810] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(255,49,88,0.12),transparent_25%),radial-gradient(circle_at_85%_20%,rgba(39,217,255,0.10),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(139,92,246,0.10),transparent_35%)]" />
      <header className="relative border-b border-[#243247] bg-[#080d17]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-7">
          <div>
            <Link
              href="/tournament"
              className="text-xs font-black uppercase tracking-wider text-[#52e2ff] transition hover:text-white"
            >
              ← Tournament Central
            </Link>

            <div className="mt-2">
              <TournamentBrand compact />
            </div>

            <h1 className="mt-4 bg-gradient-to-r from-white via-[#ffdce4] to-[#ff5275] bg-clip-text text-4xl font-black uppercase tracking-tight text-transparent">
              MATCHES
            </h1>

            <p className="mt-2 text-sm text-[#7f91aa]">
              Official tournament fixtures and results
            </p>
          </div>

          <Link
            href="/tournament"
            className="rounded-xl border border-[#52e2ff]/30 bg-[#52e2ff]/[0.06] px-5 py-3 text-[10px] font-black uppercase tracking-wider text-[#9eeeff] transition hover:border-[#ff5275]/40 hover:bg-[#ff5275]/10 hover:text-white"
          >
            TOURNAMENT HOME
          </Link>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl px-6 py-8">
        <section className="mb-6 rounded-2xl border border-[#2a3b55] bg-gradient-to-br from-[#0d1522] via-[#0a101b] to-[#111021] p-5 shadow-[0_0_45px_rgba(39,217,255,0.05)]">
          <div className="grid gap-4 lg:grid-cols-[1fr_200px_200px]">
            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search match, team, map..."
              className="rounded-xl border border-[#2b3b4f] bg-[#060b14] px-4 py-3 text-sm outline-none transition focus:border-[#52e2ff]/60 focus:ring-1 focus:ring-[#52e2ff]/20"
            />

            <select
              value={stage}
              onChange={(event) =>
                setStage(
                  event.target.value,
                )
              }
              className="rounded border border-[#2b3b4f] bg-[#080e16] px-4 py-3 text-sm outline-none focus:border-[#5d7da3]"
            >
              {stages.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item === "All"
                      ? "All stages"
                      : item}
                  </option>
                ),
              )}
            </select>

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value,
                )
              }
              className="rounded border border-[#2b3b4f] bg-[#080e16] px-4 py-3 text-sm outline-none focus:border-[#5d7da3]"
            >
              {STATUS_OPTIONS.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item === "All"
                      ? "All statuses"
                      : item}
                  </option>
                ),
              )}
            </select>
          </div>
        </section>

        {loading && (
          <div className="rounded-xl border border-[#1d2a3a] bg-[#0d141e] p-12 text-center text-sm text-[#7188a5]">
            Loading tournament matches...
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-red-900/60 bg-red-950/20 p-8 text-center">
            <div className="font-black text-red-300">
              Unable to load matches
            </div>

            <div className="mt-2 text-sm text-red-400">
              {error}
            </div>
          </div>
        )}

        {!loading &&
          !error &&
          filteredMatches.length ===
            0 && (
            <div className="rounded-xl border border-[#1d2a3a] bg-[#0d141e] p-12 text-center">
              <div className="text-lg font-black">
                No matches found
              </div>

              <div className="mt-2 text-sm text-[#7188a5]">
                Try changing your filters.
              </div>
            </div>
          )}

        {!loading &&
          !error &&
          filteredMatches.length >
            0 && (
            <div className="grid gap-5">
              {filteredMatches.map(
                (match) => {
                  const team1 =
                    getTeam(
                      teams,
                      match.team1Id,
                    );

                  const team2 =
                    getTeam(
                      teams,
                      match.team2Id,
                    );

                  return (
                    <Link
                      key={
                        match.id
                      }
                      href={`/tournament/matches/${encodeURIComponent(
                        match.id,
                      )}`}
                      className="group relative overflow-hidden rounded-2xl border border-[#263750] bg-gradient-to-br from-[#0d1521] via-[#0a1019] to-[#101020] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-[#52e2ff]/50 hover:shadow-[0_16px_55px_rgba(39,217,255,0.10)]"
                    >
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff3158] to-transparent opacity-70" />

                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="rounded-lg border border-[#52e2ff]/30 bg-[#52e2ff]/[0.07] px-3 py-1 text-[10px] font-black text-[#72e9ff]">
                            M
                            {String(
                              match.matchNumber,
                            ).padStart(
                              2,
                              "0",
                            )}
                          </span>

                          <span className="text-xs font-black uppercase tracking-wider text-[#8195b0]">
                            {
                              match.stage
                            }
                          </span>

                          <span className="text-xs font-bold text-[#ff5275]">
                            •
                          </span>

                          <span className="text-xs font-bold text-[#8195b0]">
                            {
                              match.map
                            }
                          </span>
                        </div>

                        <span
                          className={`rounded border px-3 py-1 text-[10px] font-black uppercase ${statusClass(
                            match.status,
                          )}`}
                        >
                          {
                            match.status
                          }
                        </span>
                      </div>

                      <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-xl border border-white/[0.06] bg-black/10 p-4">
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-3">
                            <div>
                              <div className="font-black uppercase tracking-tight text-white">
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

                            {team1?.logo ? (
                              <img
                                src={
                                  team1.logo
                                }
                                alt=""
                                className="h-14 w-14 rounded-xl border border-[#52e2ff]/25 bg-[#060b14] object-contain p-1.5 shadow-[0_0_20px_rgba(39,217,255,0.08)]"
                              />
                            ) : (
                              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#52e2ff]/25 bg-[#060b14] text-[10px] font-black text-[#72e9ff]">
                                {(
                                  team1?.tag ??
                                  "TBD"
                                ).slice(
                                  0,
                                  3,
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-4xl font-black tracking-tight text-white">
                            {
                              match.team1Score
                            }{" "}
                            <span className="text-[#445970]">
                              -
                            </span>{" "}
                            {
                              match.team2Score
                            }
                          </div>

                          <div className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#52e2ff]">
                            BO
                            {
                              match.bestOf
                            }
                          </div>
                        </div>

                        <div className="text-left">
                          <div className="flex items-center gap-3">
                            {team2?.logo ? (
                              <img
                                src={
                                  team2.logo
                                }
                                alt=""
                                className="h-12 w-12 rounded border border-[#2d4056] bg-[#080e16] object-contain p-1"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded border border-[#2d4056] bg-[#080e16] text-[10px] font-black text-[#7188a5]">
                                {(
                                  team2?.tag ??
                                  "TBD"
                                ).slice(
                                  0,
                                  3,
                                )}
                              </div>
                            )}

                            <div>
                              <div className="font-black">
                                {
                                  team2?.name ??
                                  "TBD"
                                }
                              </div>

                              <div className="mt-1 text-[10px] font-bold text-[#647a94]">
                                {
                                  team2?.tag ??
                                  "TBD"
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-white/[0.07] pt-4 text-[10px] font-bold text-[#617994]">
                        <span>
                          {formatDate(
                            match.scheduledAt,
                          )}
                        </span>

                        <span className="font-black uppercase tracking-wider text-[#52e2ff] transition group-hover:text-[#ff5275]">
                          VIEW MATCH →
                        </span>
                      </div>
                    </Link>
                  );
                },
              )}
            </div>
          )}
      </div>
    </main>
  );
}
"use client";

import Link from "next/link";
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
    return "border-red-900/60 bg-red-950/30 text-red-300";
  }

  if (status === "Completed") {
    return "border-emerald-900/60 bg-emerald-950/20 text-emerald-300";
  }

  if (status === "Cancelled") {
    return "border-red-900/40 bg-red-950/20 text-red-300";
  }

  return "border-[#30445d] bg-[#111b29] text-[#aabbd0]";
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
    <main className="min-h-screen bg-[#080c12] text-white">
      <header className="border-b border-[#1c2938] bg-[#0b1119]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <Link
              href="/tournament"
              className="text-xs font-bold text-[#7890ad] hover:text-white"
            >
              ← Tournament Central
            </Link>

            <h1 className="mt-2 text-3xl font-black">
              MATCHES
            </h1>

            <p className="mt-1 text-sm text-[#687e99]">
              Official tournament fixtures and results
            </p>
          </div>

          <Link
            href="/tournament"
            className="rounded border border-[#38506d] bg-[#111b29] px-4 py-2 text-xs font-bold text-[#bcd0e8]"
          >
            TOURNAMENT HOME
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <section className="mb-6 rounded-xl border border-[#1d2a3a] bg-[#0d141e] p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_200px_200px]">
            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search match, team, map..."
              className="rounded border border-[#2b3b4f] bg-[#080e16] px-4 py-3 text-sm outline-none focus:border-[#5d7da3]"
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
            <div className="grid gap-4">
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
                      className="group rounded-xl border border-[#1d2a3a] bg-[#0d141e] p-5 transition hover:border-[#405975] hover:bg-[#101925]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="rounded border border-[#2b3b4f] bg-[#111b29] px-3 py-1 text-[10px] font-black text-[#7890ad]">
                            M
                            {String(
                              match.matchNumber,
                            ).padStart(
                              2,
                              "0",
                            )}
                          </span>

                          <span className="text-xs font-bold text-[#7188a5]">
                            {
                              match.stage
                            }
                          </span>

                          <span className="text-xs text-[#52677f]">
                            •
                          </span>

                          <span className="text-xs text-[#7188a5]">
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

                      <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-3">
                            <div>
                              <div className="font-black">
                                {
                                  team1?.name ??
                                  "TBD"
                                }
                              </div>

                              <div className="mt-1 text-[10px] font-bold text-[#647a94]">
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
                                className="h-12 w-12 rounded border border-[#2d4056] bg-[#080e16] object-contain p-1"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded border border-[#2d4056] bg-[#080e16] text-[10px] font-black text-[#7188a5]">
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
                          <div className="text-3xl font-black">
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

                          <div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-[#52677f]">
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

                      <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-[#1c2938] pt-4 text-[10px] text-[#617994]">
                        <span>
                          {formatDate(
                            match.scheduledAt,
                          )}
                        </span>

                        <span className="font-bold text-[#7890ad] group-hover:text-white">
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
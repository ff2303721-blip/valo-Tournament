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
  players: {
    id: string;
    name: string;
    role?: string;
  }[];
};

type FixtureFilter =
  | "All"
  | "Group Stage"
  | "Qualifiers"
  | "Grand Final";

function formatDate(value: string) {
  if (!value) {
    return "TBD";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string) {
  if (!value) {
    return "TBD";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
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

function getTeamLogo(
  teams: Team[],
  id?: string,
) {
  return getTeam(teams, id)?.logo;
}

function getStageLabel(
  match: Match,
) {
  if (match.matchNumber === 13) {
    return "QUALIFIER 1";
  }

  if (match.matchNumber === 14) {
    return "ELIMINATION";
  }

  if (match.matchNumber === 15) {
    return "QUALIFIER 2";
  }

  if (match.matchNumber === 16) {
    return "GRAND FINAL";
  }

  return "GROUP STAGE";
}

function getStageColor(
  match: Match,
) {
  if (match.matchNumber === 16) {
    return {
      border:
        "border-[#ffd45c]/40",
      bg:
        "bg-[#ffd45c]/10",
      text:
        "text-[#ffd45c]",
    };
  }

  if (match.matchNumber >= 13) {
    return {
      border:
        "border-[#9d62ff]/40",
      bg:
        "bg-[#9d62ff]/10",
      text:
        "text-[#c29aff]",
    };
  }

  return {
    border:
      "border-[#27d9ff]/30",
    bg:
      "bg-[#27d9ff]/10",
    text:
      "text-[#52e2ff]",
  };
}

function getStatusClass(
  status: MatchStatus,
) {
  if (status === "Live") {
    return "border-[#ff3158]/60 bg-[#ff3158]/10 text-[#ff6b86]";
  }

  if (status === "Completed") {
    return "border-[#32e6a1]/40 bg-[#32e6a1]/10 text-[#53efb1]";
  }

  if (status === "Cancelled") {
    return "border-[#ff5b5b]/40 bg-[#ff5b5b]/10 text-[#ff7b7b]";
  }

  return "border-[#27d9ff]/30 bg-[#27d9ff]/10 text-[#52e2ff]";
}

function sortMatches(
  matches: Match[],
) {
  return [...matches].sort(
    (a, b) => {
      if (
        a.scheduledAt &&
        b.scheduledAt
      ) {
        return (
          new Date(
            a.scheduledAt,
          ).getTime() -
          new Date(
            b.scheduledAt,
          ).getTime()
        );
      }

      return (
        a.matchNumber -
        b.matchNumber
      );
    },
  );
}

export default function FixturesPage() {
  const [teams, setTeams] =
    useState<Team[]>([]);

  const [matches, setMatches] =
    useState<Match[]>([]);

  const [filter, setFilter] =
    useState<FixtureFilter>("All");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [
          teamsResponse,
          matchesResponse,
        ] = await Promise.all([
          fetch("/api/teams", {
            cache: "force-cache",
          }),
          fetch("/api/matches", {
            cache: "force-cache",
          }),
        ]);

        const teamsData =
          await teamsResponse.json();

        const matchesData =
          await matchesResponse.json();

        if (!teamsResponse.ok) {
          throw new Error(
            teamsData.error ||
              "Failed to load teams.",
          );
        }

        if (!matchesResponse.ok) {
          throw new Error(
            matchesData.error ||
              "Failed to load fixtures.",
          );
        }

        if (!active) {
          return;
        }

        setTeams(
          Array.isArray(
            teamsData,
          )
            ? teamsData
            : [],
        );

        setMatches(
          Array.isArray(
            matchesData,
          )
            ? matchesData
            : [],
        );
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load fixtures.",
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

  const filteredMatches =
    useMemo(() => {
      let result = matches;

      if (
        filter ===
        "Group Stage"
      ) {
        result = matches.filter(
          (match) =>
            match.matchNumber <=
            12,
        );
      }

      if (
        filter ===
        "Qualifiers"
      ) {
        result = matches.filter(
          (match) =>
            match.matchNumber >=
              13 &&
            match.matchNumber <=
              15,
        );
      }

      if (
        filter ===
        "Grand Final"
      ) {
        result = matches.filter(
          (match) =>
            match.matchNumber ===
            16,
        );
      }

      return sortMatches(
        result,
      );
    }, [matches, filter]);

  const groupMatches =
    matches.filter(
      (match) =>
        match.matchNumber <=
        12,
    );

  const qualifierMatches =
    matches.filter(
      (match) =>
        match.matchNumber >=
          13 &&
        match.matchNumber <=
          15,
    );

  const finalMatches =
    matches.filter(
      (match) =>
        match.matchNumber ===
        16,
    );

  const completedCount =
    matches.filter(
      (match) =>
        match.status ===
        "Completed",
    ).length;

  const liveCount =
    matches.filter(
      (match) =>
        match.status === "Live",
    ).length;

  const scheduledCount =
    matches.filter(
      (match) =>
        match.status ===
        "Scheduled",
    ).length;

  return (
    <main className="min-h-screen overflow-hidden bg-[#05070d]/68 text-white">
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div className="absolute left-[-10%] top-[-15%] h-[500px] w-[500px] rounded-full bg-[#ff174f]/15 blur-[140px]" />

        <div className="absolute right-[-10%] top-[5%] h-[450px] w-[450px] rounded-full bg-[#7c3cff]/15 blur-[140px]" />

        <div className="absolute bottom-[-15%] left-[30%] h-[450px] w-[450px] rounded-full bg-[#00d9ff]/10 blur-[140px]" />
      </div>

      <header className="relative border-b border-[#263149] bg-[#080b13]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-6 py-6">
          <div>
            <Link
              href="/tournament"
              className="inline-flex items-center justify-center rounded-xl border border-[#52e2ff]/40 bg-[#07131c]/90 px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#9eeeff] shadow-[0_0_22px_rgba(39,217,255,0.08)] transition hover:border-[#ff5275]/50 hover:bg-[#ff3158]/10 hover:text-white"
            >
              ← Tournament Home
            </Link>

            <div className="mt-2">
              <TournamentBrand compact />
            </div>

            <h1 className="mt-3 text-2xl font-black uppercase text-white md:text-3xl">
              FIXTURES
            </h1>

            <p className="mt-1 text-sm text-[#8290aa]">
              Official tournament schedule
            </p>
          </div>

          <nav className="flex flex-wrap gap-2">
            <Link
              href="/tournament/matches"
              className="rounded-lg border border-[#30405d] bg-[#101727] px-4 py-2.5 text-[10px] font-black tracking-wider text-[#b8c5da] hover:border-[#27d9ff]/60 hover:text-[#52e2ff]"
            >
              MATCHES
            </Link>

            <Link
              href="/tournament/teams"
              className="rounded-lg border border-[#30405d] bg-[#101727] px-4 py-2.5 text-[10px] font-black tracking-wider text-[#b8c5da] hover:border-[#27d9ff]/60 hover:text-[#52e2ff]"
            >
              TEAMS
            </Link>

            <Link
              href="/tournament/fixtures"
              className="rounded-lg border border-[#27d9ff]/60 bg-[#27d9ff]/10 px-4 py-2.5 text-[10px] font-black tracking-wider text-[#52e2ff]"
            >
              FIXTURES
            </Link>

            <Link
              href="/tournament/bracket"
              className="rounded-lg border border-[#30405d] bg-[#101727] px-4 py-2.5 text-[10px] font-black tracking-wider text-[#b8c5da] hover:border-[#9d62ff]/60 hover:text-[#c29aff]"
            >
              BRACKET
            </Link>

            <Link
              href="/tournament/players"
              className="rounded-lg border border-[#30405d] bg-[#101727] px-4 py-2.5 text-[10px] font-black tracking-wider text-[#b8c5da] hover:border-[#32e6a1]/60 hover:text-[#53efb1]"
            >
              PLAYERS
            </Link>
          </nav>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-[#ff3158]/50 bg-[#ff3158]/10 p-5">
            <div className="font-black text-[#ff6b86]">
              Unable to load fixtures
            </div>

            <div className="mt-1 text-sm text-[#ff9aae]">
              {error}
            </div>
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-[#263149] bg-[#0b101b] p-16 text-center text-sm text-[#8290aa]">
            Loading fixtures...
          </div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-[#27d9ff]/30 bg-gradient-to-br from-[#0d1720] to-[#090e18] p-5">
                <div className="text-[10px] font-black tracking-[0.2em] text-[#52e2ff]">
                  GROUP MATCHES
                </div>

                <div className="mt-2 text-4xl font-black">
                  12
                </div>

                <div className="mt-1 text-xs text-[#687994]">
                  Round-robin schedule
                </div>
              </div>

              <div className="rounded-xl border border-[#32e6a1]/30 bg-gradient-to-br from-[#0d1916] to-[#090e18] p-5">
                <div className="text-[10px] font-black tracking-[0.2em] text-[#53efb1]">
                  COMPLETED
                </div>

                <div className="mt-2 text-4xl font-black">
                  {completedCount}
                </div>
              </div>

              <div className="rounded-xl border border-[#ff3158]/40 bg-gradient-to-br from-[#190d13] to-[#0d0b12] p-5">
                <div className="text-[10px] font-black tracking-[0.2em] text-[#ff6b86]">
                  LIVE
                </div>

                <div className="mt-2 text-4xl font-black text-[#ff718a]">
                  {liveCount}
                </div>
              </div>

              <div className="rounded-xl border border-[#9d62ff]/40 bg-gradient-to-br from-[#140e1d] to-[#0b0b13] p-5">
                <div className="text-[10px] font-black tracking-[0.2em] text-[#b98cff]">
                  SCHEDULED
                </div>

                <div className="mt-2 text-4xl font-black">
                  {scheduledCount}
                </div>
              </div>
            </section>

            <section className="mt-6 overflow-hidden rounded-xl border border-[#263149] bg-[#0b101b]">
              <div className="border-b border-[#263149] p-6">
                <div className="text-[10px] font-black tracking-[0.2em] text-[#ff5275]">
                  TOURNAMENT SCHEDULE
                </div>

                <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-2xl font-black">
                    Fixtures
                  </h2>

                  <div className="flex flex-wrap gap-2">
                    {[
                      "All",
                      "Group Stage",
                      "Qualifiers",
                      "Grand Final",
                    ].map(
                      (item) => {
                        const active =
                          filter ===
                          item;

                        return (
                          <button
                            key={
                              item
                            }
                            type="button"
                            onClick={() =>
                              setFilter(
                                item as FixtureFilter,
                              )
                            }
                            className={`rounded-lg border px-4 py-2 text-[9px] font-black tracking-wider transition ${
                              active
                                ? item ===
                                  "Grand Final"
                                  ? "border-[#ffd45c] bg-[#ffd45c]/10 text-[#ffd45c]"
                                  : item ===
                                      "Qualifiers"
                                    ? "border-[#9d62ff] bg-[#9d62ff]/10 text-[#c29aff]"
                                    : "border-[#27d9ff] bg-[#27d9ff]/10 text-[#52e2ff]"
                                : "border-[#30405d] bg-[#101727] text-[#8190aa] hover:border-[#27d9ff]/50 hover:text-[#52e2ff]"
                            }`}
                          >
                            {item.toUpperCase()}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 p-4 sm:grid-cols-2">
                {filteredMatches.length ===
                0 ? (
                  <div className="rounded-xl border border-[#263149] bg-[#080e18] p-12 text-center">
                    <div className="text-sm font-black text-[#aab8cc]">
                      No fixtures available
                    </div>

                    <div className="mt-2 text-xs text-[#687994]">
                      Matches will appear here once they are created.
                    </div>
                  </div>
                ) : (
                  filteredMatches.map(
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

                      const stageColor =
                        getStageColor(
                          match,
                        );

                      const team1Won =
                        match.status ===
                          "Completed" &&
                        match.team1Score >
                          match.team2Score;

                      const team2Won =
                        match.status ===
                          "Completed" &&
                        match.team2Score >
                          match.team1Score;

                      return (
                        <div
                          key={
                            match.id
                          }
                          className="group relative overflow-hidden rounded-xl border border-[#263149] bg-gradient-to-r from-[#0b101b] to-[#0a0f18]"
                        >
                          <div
                            className={`absolute left-0 top-0 h-full w-1 ${
                              match.matchNumber ===
                              16
                                ? "bg-[#ffd45c]"
                                : match.matchNumber >=
                                    13
                                  ? "bg-[#9d62ff]"
                                  : "bg-[#27d9ff]"
                            }`}
                          />

                          <div className="grid gap-3 p-4 md:grid-cols-[125px_1fr_auto] md:items-center">
                            <div>
                              <div
                                className={`inline-flex rounded border px-2 py-1 text-[8px] font-black tracking-wider ${stageColor.border} ${stageColor.bg} ${stageColor.text}`}
                              >
                                {getStageLabel(
                                  match,
                                )}
                              </div>

                              <div className="mt-2 text-[9px] font-black tracking-[0.2em] text-[#64748d]">
                                MATCH{" "}
                                {String(
                                  match.matchNumber,
                                ).padStart(
                                  2,
                                  "0",
                                )}
                              </div>

                              <div className="mt-1 text-[11px] font-bold text-[#8b99ad]">
                                {formatDate(
                                  match.scheduledAt,
                                )}
                              </div>

                              <div className="mt-1 text-[10px] text-[#5e6d84]">
                                {formatTime(
                                  match.scheduledAt,
                                )}
                              </div>
                            </div>

                            <div>
                              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                                <div className="flex min-w-0 items-center justify-end gap-2">
                                  <div className="text-right">
                                    <div
                                      className={`text-sm font-black ${
                                        team1Won
                                          ? "text-[#53efb1]"
                                          : ""
                                      }`}
                                    >
                                      {getTeamName(
                                        teams,
                                        match.team1Id,
                                      )}
                                    </div>

                                    <div className="mt-1 text-[9px] font-bold text-[#60718b]">
                                      {getTeamTag(
                                        teams,
                                        match.team1Id,
                                      )}
                                    </div>
                                  </div>

                                  {team1?.logo ? (
                                    <img
                                      src={
                                        getTeamLogo(
                                          teams,
                                          match.team1Id,
                                        )
                                      }
                                      alt=""
                                      className="h-10 w-10 rounded-lg border border-[#29384e] object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#29384e] bg-[#111a29] text-xs font-black text-[#27d9ff]">
                                      {getTeamTag(
                                        teams,
                                        match.team1Id,
                                      )
                                        .slice(
                                          0,
                                          2,
                                        )
                                        .toUpperCase()}
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-[52px] text-center">
                                  {match.status ===
                                  "Completed" ? (
                                    <div className="text-xl font-black text-[#ffd45c]">
                                      {
                                        match.team1Score
                                      }

                                      <span className="mx-2 text-[#46536a]">
                                        -
                                      </span>

                                      {
                                        match.team2Score
                                      }
                                    </div>
                                  ) : (
                                    <div className="text-sm font-black text-[#27d9ff]">
                                      VS
                                    </div>
                                  )}

                                  <div className="mt-1 text-[8px] font-black uppercase tracking-wider text-[#56657c]">
                                    BO
                                    {match.bestOf}
                                  </div>
                                </div>

                                <div className="flex min-w-0 items-center gap-2">
                                  {team2?.logo ? (
                                    <img
                                      src={
                                        getTeamLogo(
                                          teams,
                                          match.team2Id,
                                        )
                                      }
                                      alt=""
                                      className="h-10 w-10 rounded-lg border border-[#29384e] object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#29384e] bg-[#111a29] text-xs font-black text-[#9d62ff]">
                                      {getTeamTag(
                                        teams,
                                        match.team2Id,
                                      )
                                        .slice(
                                          0,
                                          2,
                                        )
                                        .toUpperCase()}
                                    </div>
                                  )}

                                  <div>
                                    <div
                                      className={`text-sm font-black ${
                                        team2Won
                                          ? "text-[#53efb1]"
                                          : ""
                                      }`}
                                    >
                                      {getTeamName(
                                        teams,
                                        match.team2Id,
                                      )}
                                    </div>

                                    <div className="mt-1 text-[9px] font-bold text-[#60718b]">
                                      {getTeamTag(
                                        teams,
                                        match.team2Id,
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-2 flex flex-wrap justify-center gap-1.5 text-[8px] font-bold text-[#64738d]">
                                <span className="rounded border border-[#202e42] bg-[#0a1019] px-2 py-1">
                                  MAP:{" "}
                                  {match.map ||
                                    "TBD"}
                                </span>

                                <span className="rounded border border-[#202e42] bg-[#0a1019] px-2 py-1">
                                  BO
                                  {match.bestOf}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-end">
                              <span
                                className={`rounded border px-3 py-2 text-[8px] font-black uppercase tracking-wider ${getStatusClass(
                                  match.status,
                                )}`}
                              >
                                {
                                  match.status
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    },
                  )
                )}
              </div>
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-[#27d9ff]/25 bg-[#0b101b] p-5">
                <div className="text-[9px] font-black tracking-[0.2em] text-[#52e2ff]">
                  GROUP STAGE
                </div>

                <div className="mt-2 text-2xl font-black">
                  {groupMatches.length}
                </div>

                <div className="mt-1 text-xs text-[#687994]">
                  Round-robin fixtures
                </div>
              </div>

              <div className="rounded-xl border border-[#9d62ff]/30 bg-[#0d0b16] p-5">
                <div className="text-[9px] font-black tracking-[0.2em] text-[#b98cff]">
                  QUALIFIERS
                </div>

                <div className="mt-2 text-2xl font-black">
                  {qualifierMatches.length}
                </div>

                <div className="mt-1 text-xs text-[#746989]">
                  Q1, Elimination and Q2
                </div>
              </div>

              <div className="rounded-xl border border-[#ffd45c]/30 bg-[#12100a] p-5">
                <div className="text-[9px] font-black tracking-[0.2em] text-[#ffd45c]">
                  GRAND FINAL
                </div>

                <div className="mt-2 text-2xl font-black">
                  {finalMatches.length}
                </div>

                <div className="mt-1 text-xs text-[#81775d]">
                  Championship match
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
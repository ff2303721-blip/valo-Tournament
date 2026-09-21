"use client";

import Link from "next/link";
import Image from "next/image";
import { TournamentNav } from "../components/tournament-nav";
import { StatusBadge } from "../components/ui/status-badge";
import { useEffect, useMemo, useState } from "react";
import { matches as defaultMatches } from "@/app/data/matches";
import { teams as defaultTeams } from "@/app/data/teams";
import type { Match, Team } from "@/lib/types";

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
  return getTeam(teams, id)?.logo || "";
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
      border: "border-[#f59e0b]/40",
      bg: "bg-[#f59e0b]/10",
      text: "text-[#fbbf24]",
    };
  }

  if (match.matchNumber >= 13) {
    return {
      border: "border-[#7c3aed]/40",
      bg: "bg-[#7c3aed]/10",
      text: "text-[#9d63ff]",
    };
  }

  return {
    border: "border-[#06b6d4]/30",
    bg: "bg-[#06b6d4]/10",
    text: "text-[#22d3ee]",
  };
}

function getAccentBar(match: Match) {
  if (match.matchNumber === 16) return "bg-[#f59e0b]";
  if (match.matchNumber >= 13) return "bg-[#7c3aed]";
  return "bg-[#06b6d4]";
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
    let mounted = true;

    async function load() {
      try {
        const [teamsResponse, matchesResponse] = await Promise.all([
          fetch("/api/teams", {
            cache: "no-store",
          }),
          fetch("/api/matches", {
            cache: "no-store",
          }),
        ]);

        const teamsData = teamsResponse.ok ? await teamsResponse.json() : null;
        const matchesData = matchesResponse.ok ? await matchesResponse.json() : null;

        if (!mounted) {
          setLoading(false);
          return;
        }

        const teamList = Array.isArray(teamsData) && teamsData.length > 0
          ? teamsData
          : defaultTeams;

        const matchList = Array.isArray(matchesData) && matchesData.length > 0
          ? matchesData
          : defaultMatches;

        setTeams(teamList);
        setMatches(matchList);
      } catch (err) {
        if (!mounted) {
          setLoading(false);
          return;
        }

        setTeams(defaultTeams);
        setMatches(defaultMatches);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load fixtures.",
        );
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
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
    <div className="min-h-screen overflow-hidden bg-[#030308] text-white">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[-10%] top-[-15%] h-[520px] w-[520px] rounded-full bg-[#ff2d55]/10 blur-[150px]" />
        <div className="absolute right-[-10%] top-[5%] h-[460px] w-[460px] rounded-full bg-[#7c3aed]/12 blur-[150px]" />
        <div className="absolute bottom-[-15%] left-[30%] h-[460px] w-[460px] rounded-full bg-[#06b6d4]/8 blur-[150px]" />
      </div>

      <TournamentNav />

      <main className="relative z-10 text-white">
        {/* Page header */}
        <header className="border-b border-[#1e1e3a] bg-[#0c0c18]/95 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-6 py-8">
            <div className="text-[10px] font-black tracking-[0.3em] text-[#ff2d55]">
              TOURNAMENT SCHEDULE
            </div>
            <h1 className="mt-2 text-3xl font-black uppercase text-[#f1f5f9] md:text-4xl">
              FIXTURES
            </h1>
            <p className="mt-1 text-sm text-[#475569]">
              Official tournament schedule &amp; match listings
            </p>
          </div>
        </header>

        <div className="relative mx-auto max-w-7xl px-6 py-8">
          {error && (
            <div className="mb-6 rounded-xl border border-[#ff2d55]/50 bg-[#ff2d55]/10 p-5">
              <div className="font-black text-[#ff4d6a]">
                Unable to load fixtures
              </div>
              <div className="mt-1 text-sm text-[#ff4d6a]/70">
                {error}
              </div>
            </div>
          )}

          {loading ? (
            <div className="rounded-xl border border-[#1e1e3a] bg-[#0c0c18] p-16 text-center text-sm text-[#475569]">
              Loading fixtures...
            </div>
          ) : (
            <>
              {/* Stats cards */}
              <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-[#06b6d4]/30 bg-[#0c0c18] p-5">
                  <div className="text-[10px] font-black tracking-[0.2em] text-[#22d3ee]">
                    TOTAL FIXTURES
                  </div>
                  <div className="mt-2 text-4xl font-black text-[#f1f5f9]">
                    {matches.length}
                  </div>
                </div>

                <div className="rounded-xl border border-[#10b981]/30 bg-[#0c0c18] p-5">
                  <div className="text-[10px] font-black tracking-[0.2em] text-[#34d399]">
                    COMPLETED
                  </div>
                  <div className="mt-2 text-4xl font-black text-[#f1f5f9]">
                    {completedCount}
                  </div>
                </div>

                <div className="rounded-xl border border-[#ff2d55]/40 bg-[#0c0c18] p-5">
                  <div className="text-[10px] font-black tracking-[0.2em] text-[#ff4d6a]">
                    LIVE
                  </div>
                  <div className="mt-2 text-4xl font-black text-[#ff4d6a]">
                    {liveCount}
                  </div>
                </div>

                <div className="rounded-xl border border-[#7c3aed]/40 bg-[#0c0c18] p-5">
                  <div className="text-[10px] font-black tracking-[0.2em] text-[#9d63ff]">
                    SCHEDULED
                  </div>
                  <div className="mt-2 text-4xl font-black text-[#f1f5f9]">
                    {scheduledCount}
                  </div>
                </div>
              </section>

              {/* Fixtures list */}
              <section className="mt-6 overflow-hidden rounded-xl border border-[#1e1e3a] bg-[#0c0c18]">
                <div className="border-b border-[#1e1e3a] p-6">
                  <div className="text-[10px] font-black tracking-[0.2em] text-[#ff2d55]">
                    TOURNAMENT SCHEDULE
                  </div>

                  <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-2xl font-black text-[#f1f5f9]">
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
                              key={item}
                              type="button"
                              onClick={() =>
                                setFilter(
                                  item as FixtureFilter,
                                )
                              }
                              className={`rounded-lg border px-4 py-2 text-[9px] font-black tracking-wider transition ${
                                active
                                  ? "border-[#ff2d55]/60 bg-[#ff2d55]/10 text-[#ff4d6a]"
                                  : "border-[#1e1e3a] bg-[#131326] text-[#64748b] hover:border-[#2e2e5a] hover:text-[#f1f5f9]"
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

                <div className="grid gap-4 p-6">
                  {filteredMatches.length ===
                  0 ? (
                    <div className="rounded-xl border border-[#1e1e3a] bg-[#131326] p-12 text-center">
                      <div className="text-sm font-black text-[#f1f5f9]">
                        No fixtures available
                      </div>
                      <div className="mt-2 text-xs text-[#475569]">
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
                          <Link
                            key={match.id}
                            href={`/tournament/matches/${encodeURIComponent(
                              match.id,
                            )}`}
                            className="group relative overflow-hidden rounded-xl border border-[#1e1e3a] bg-[#0c0c18] transition hover:border-[#2e2e5a] hover:shadow-[0_0_30px_rgba(124,58,237,0.08)]"
                          >
                            {/* Stage accent bar */}
                            <div
                              className={`absolute left-0 top-0 h-full w-1 ${getAccentBar(match)}`}
                            />

                            <div className="grid gap-5 p-5 md:grid-cols-[180px_1fr_auto] md:items-center">
                              {/* Match meta */}
                              <div>
                                <div
                                  className={`inline-flex rounded border px-2 py-1 text-[8px] font-black tracking-wider ${stageColor.border} ${stageColor.bg} ${stageColor.text}`}
                                >
                                  {getStageLabel(match)}
                                </div>

                                <div className="mt-3 text-[10px] font-black tracking-[0.2em] text-[#475569]">
                                  MATCH{" "}
                                  {String(
                                    match.matchNumber,
                                  ).padStart(
                                    2,
                                    "0",
                                  )}
                                </div>

                                <div className="mt-1 text-xs font-bold text-[#64748b]">
                                  {formatDate(
                                    match.scheduledAt,
                                  )}
                                </div>

                                <div className="mt-1 text-[10px] text-[#334155]">
                                  {formatTime(
                                    match.scheduledAt,
                                  )}
                                </div>
                              </div>

                              {/* Teams + score */}
                              <div>
                                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                                  {/* Team 1 */}
                                  <div className="flex items-center justify-end gap-3">
                                    <div className="text-right">
                                      <div
                                        className={`text-sm font-black ${
                                          team1Won
                                            ? "text-[#34d399]"
                                            : "text-[#f1f5f9]"
                                        }`}
                                      >
                                        {getTeamName(
                                          teams,
                                          match.team1Id,
                                        )}
                                      </div>

                                      <div className="mt-1 text-[9px] font-bold text-[#475569]">
                                        {getTeamTag(
                                          teams,
                                          match.team1Id,
                                        )}
                                      </div>
                                    </div>

                                    {team1?.logo ? (
                                      <Image
                                        src={getTeamLogo(
                                          teams,
                                          match.team1Id,
                                        )}
                                        alt=""
                                        width={40}
                                        height={40}
                                        unoptimized
                                        className="h-10 w-10 rounded-lg border border-[#1e1e3a] object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#1e1e3a] bg-[#0c0c18] text-xs font-black text-[#22d3ee]">
                                        {getTeamTag(
                                          teams,
                                          match.team1Id,
                                        )
                                          .slice(0, 2)
                                          .toUpperCase()}
                                      </div>
                                    )}
                                  </div>

                                  {/* Score / VS */}
                                  <div className="min-w-[90px] text-center">
                                    {match.status ===
                                    "Completed" ? (
                                      <div className="text-xl font-black text-[#f59e0b]">
                                        {match.team1Score}
                                        <span className="mx-2 text-[#334155]">
                                          -
                                        </span>
                                        {match.team2Score}
                                      </div>
                                    ) : (
                                      <div className="text-sm font-black text-[#22d3ee]">
                                        VS
                                      </div>
                                    )}

                                    <div className="mt-1 text-[8px] font-black uppercase tracking-wider text-[#475569]">
                                      BO
                                      {match.bestOf}
                                    </div>
                                  </div>

                                  {/* Team 2 */}
                                  <div className="flex items-center gap-3">
                                    {team2?.logo ? (
                                      <Image
                                        src={getTeamLogo(
                                          teams,
                                          match.team2Id,
                                        )}
                                        alt=""
                                        width={40}
                                        height={40}
                                        unoptimized
                                        className="h-10 w-10 rounded-lg border border-[#1e1e3a] object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#1e1e3a] bg-[#0c0c18] text-xs font-black text-[#9d63ff]">
                                        {getTeamTag(
                                          teams,
                                          match.team2Id,
                                        )
                                          .slice(0, 2)
                                          .toUpperCase()}
                                      </div>
                                    )}

                                    <div>
                                      <div
                                        className={`text-sm font-black ${
                                          team2Won
                                            ? "text-[#34d399]"
                                            : "text-[#f1f5f9]"
                                        }`}
                                      >
                                        {getTeamName(
                                          teams,
                                          match.team2Id,
                                        )}
                                      </div>

                                      <div className="mt-1 text-[9px] font-bold text-[#475569]">
                                        {getTeamTag(
                                          teams,
                                          match.team2Id,
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Map & BO info chips */}
                                <div className="mt-4 flex flex-wrap justify-center gap-2 text-[9px] font-bold text-[#475569]">
                                  <span className="rounded border border-[#1e1e3a] bg-[#131326] px-2 py-1">
                                    MAP:{" "}
                                    {match.map ||
                                      "TBD"}
                                  </span>

                                  <span className="rounded border border-[#1e1e3a] bg-[#131326] px-2 py-1">
                                    BO
                                    {match.bestOf}
                                  </span>
                                </div>
                              </div>

                              {/* Status badge */}
                              <div className="flex items-center justify-end">
                                <StatusBadge status={match.status} />
                              </div>
                            </div>
                          </Link>
                        );
                      },
                    )
                  )}
                </div>
              </section>

              {/* Stage breakdown summary */}
              <section className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-[#06b6d4]/25 bg-[#0c0c18] p-5">
                  <div className="text-[9px] font-black tracking-[0.2em] text-[#22d3ee]">
                    GROUP STAGE
                  </div>

                  <div className="mt-2 text-2xl font-black text-[#f1f5f9]">
                    {groupMatches.length}
                  </div>

                  <div className="mt-1 text-xs text-[#475569]">
                    Round-robin fixtures
                  </div>
                </div>

                <div className="rounded-xl border border-[#7c3aed]/30 bg-[#0c0c18] p-5">
                  <div className="text-[9px] font-black tracking-[0.2em] text-[#9d63ff]">
                    QUALIFIERS
                  </div>

                  <div className="mt-2 text-2xl font-black text-[#f1f5f9]">
                    {qualifierMatches.length}
                  </div>

                  <div className="mt-1 text-xs text-[#475569]">
                    Q1, Elimination and Q2
                  </div>
                </div>

                <div className="rounded-xl border border-[#f59e0b]/30 bg-[#0c0c18] p-5">
                  <div className="text-[9px] font-black tracking-[0.2em] text-[#fbbf24]">
                    GRAND FINAL
                  </div>

                  <div className="mt-2 text-2xl font-black text-[#f1f5f9]">
                    {finalMatches.length}
                  </div>

                  <div className="mt-1 text-xs text-[#475569]">
                    Championship match
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

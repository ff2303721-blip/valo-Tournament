"use client";

import Link from "next/link";
import { TournamentBrand } from "./components/tournament-brand";
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

type TournamentSettings = {
  tournamentName: string;
  tagline: string;
  organizerName: string;
  prizePool: string;
  startDate: string | null;
  endDate: string | null;
  tournamentStatus: "Upcoming" | "Live" | "Completed";
  announcement: string;
  logoUrl: string;
  bannerUrl: string;
};

type Standing = {
  team: Team;
  played: number;
  wins: number;
  losses: number;
  points: number;
  roundDifference: number;
};

type StandingsView =
  | "overall"
  | "group"
  | "qualifiers"
  | "final";

function formatTournamentDate(value?: string | null) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not set";
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

function getTeamTag(
  teams: Team[],
  id?: string,
) {
  return (
    getTeam(teams, id)?.tag ??
    "TBD"
  );
}

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

function statusClass(
  status: MatchStatus,
) {
  if (status === "Live") {
    return "border-[#ff3158]/70 bg-[#ff3158]/15 text-[#ff6b86]";
  }

  if (status === "Completed") {
    return "border-[#32e6a1]/50 bg-[#32e6a1]/10 text-[#53efb1]";
  }

  if (status === "Cancelled") {
    return "border-[#ff5b5b]/50 bg-[#ff5b5b]/10 text-[#ff7b7b]";
  }

  return "border-[#27d9ff]/40 bg-[#27d9ff]/10 text-[#52e2ff]";
}

function buildStandings(
  teams: Team[],
  matches: Match[],
): Standing[] {
  const map = new Map<
    string,
    Standing
  >();

  for (const team of teams) {
    map.set(team.id, {
      team,
      played: 0,
      wins: 0,
      losses: 0,
      points: 0,
      roundDifference: 0,
    });
  }

  for (const match of matches) {
    if (
      match.stage !==
        "Group Stage" ||
      match.status !==
        "Completed" ||
      !match.team1Id ||
      !match.team2Id
    ) {
      continue;
    }

    const team1 =
      map.get(match.team1Id);

    const team2 =
      map.get(match.team2Id);

    if (!team1 || !team2) {
      continue;
    }

    team1.played += 1;
    team2.played += 1;

    team1.roundDifference +=
      match.team1Score -
      match.team2Score;

    team2.roundDifference +=
      match.team2Score -
      match.team1Score;

    if (
      match.team1Score >
      match.team2Score
    ) {
      team1.wins += 1;
      team1.points += 3;
      team2.losses += 1;
    }

    if (
      match.team2Score >
      match.team1Score
    ) {
      team2.wins += 1;
      team2.points += 3;
      team1.losses += 1;
    }
  }

  return [...map.values()].sort(
    (a, b) =>
      b.points -
        a.points ||
      b.roundDifference -
        a.roundDifference ||
      b.wins -
        a.wins ||
      a.team.seed -
        b.team.seed,
  );
}

function phaseMatches(
  matches: Match[],
) {
  return matches
    .filter(
      (match) =>
        match.matchNumber >= 13 &&
        match.matchNumber <= 16,
    )
    .sort(
      (a, b) =>
        a.matchNumber -
        b.matchNumber,
    );
}

function getPhaseLabel(
  matchNumber: number,
) {
  if (matchNumber === 13) {
    return "Q1";
  }

  if (matchNumber === 14) {
    return "ELIMINATION";
  }

  if (matchNumber === 15) {
    return "Q2";
  }

  if (matchNumber === 16) {
    return "GRAND FINAL";
  }

  return `M${matchNumber}`;
}

export default function TournamentDashboard() {
  const [teams, setTeams] =
    useState<Team[]>([]);

  const [matches, setMatches] =
    useState<Match[]>([]);

  const [settings, setSettings] =
    useState<TournamentSettings | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [standingsView, setStandingsView] =
    useState<StandingsView>(
      "overall",
    );

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [
          teamsResponse,
          matchesResponse,
          settingsResponse,
        ] = await Promise.all([
          fetch("/api/teams", {
            cache: "no-store",
          }),
          fetch("/api/matches", {
            cache: "no-store",
          }),
          fetch("/api/settings", {
            cache: "no-store",
          }),
        ]);

        const teamsData =
          await teamsResponse.json();

        const matchesData =
          await matchesResponse.json();

        const settingsData =
          await settingsResponse.json();

        if (!teamsResponse.ok) {
          throw new Error(
            teamsData.error ||
              "Failed to load teams.",
          );
        }

        if (!matchesResponse.ok) {
          throw new Error(
            matchesData.error ||
              "Failed to load matches.",
          );
        }

        if (!settingsResponse.ok) {
          throw new Error(
            settingsData.error ||
              "Failed to load tournament settings.",
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

        setSettings({
          tournamentName:
            settingsData.tournamentName ?? "",
          tagline:
            settingsData.tagline ?? "",
          organizerName:
            settingsData.organizerName ?? "",
          prizePool:
            settingsData.prizePool ?? "",
          startDate:
            settingsData.startDate ?? null,
          endDate:
            settingsData.endDate ?? null,
          tournamentStatus:
            settingsData.tournamentStatus ??
            "Upcoming",
          announcement:
            settingsData.announcement ?? "",
          logoUrl:
            settingsData.logoUrl ?? "",
          bannerUrl:
            settingsData.bannerUrl ?? "",
        });
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load tournament data.",
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

  const standings =
    useMemo(
      () =>
        buildStandings(
          teams,
          matches,
        ),
      [teams, matches],
    );

  const completedMatches =
    matches.filter(
      (match) =>
        match.status ===
        "Completed",
    );

  const liveMatches =
    matches.filter(
      (match) =>
        match.status === "Live",
    );

  const scheduledMatches =
    matches.filter(
      (match) =>
        match.status ===
        "Scheduled",
    );

  const groupMatches =
    matches
      .filter(
        (match) =>
          match.stage ===
          "Group Stage",
      )
      .sort(
        (a, b) =>
          a.matchNumber -
          b.matchNumber,
      );

  const qualifierMatches =
    phaseMatches(matches).filter(
      (match) =>
        match.matchNumber >=
          13 &&
        match.matchNumber <=
          15,
    );

  const grandFinal =
    matches.find(
      (match) =>
        match.matchNumber ===
        16,
    );

  const nextMatch =
    [...scheduledMatches]
      .sort(
        (a, b) =>
          new Date(
            a.scheduledAt ||
              "9999-12-31",
          ).getTime() -
          new Date(
            b.scheduledAt ||
              "9999-12-31",
          ).getTime(),
      )[0];

  const latestResults =
    [...completedMatches]
      .sort(
        (a, b) =>
          b.matchNumber -
          a.matchNumber,
      )
      .slice(0, 4);

  const activeLiveMatch =
    liveMatches[0];

  const groupCompleted =
    completedMatches.filter(
      (match) =>
        match.stage ===
        "Group Stage",
    ).length;

  const groupTotal = 12;

  const progress =
    Math.min(
      100,
      Math.round(
        (groupCompleted /
          groupTotal) *
          100,
      ),
    );

  const qualifierTeams =
    standings.slice(0, 4);

  return (
    <main className="min-h-screen overflow-hidden bg-[#05070d] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div className="absolute left-[-10%] top-[-15%] h-[500px] w-[500px] rounded-full bg-[#ff174f]/15 blur-[140px]" />

        <div className="absolute right-[-10%] top-[5%] h-[450px] w-[450px] rounded-full bg-[#7c3cff]/15 blur-[140px]" />

        <div className="absolute bottom-[-15%] left-[30%] h-[450px] w-[450px] rounded-full bg-[#00d9ff]/10 blur-[140px]" />
      </div>

      <header className="relative border-b border-[#263149] bg-[#080b13]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-6 py-6">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.4em] text-[#ff3158]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff3158]" />
              VALORANT ESPORTS
            </div>

            <div className="mt-2">
              <TournamentBrand />
            </div>

            <p className="mt-2 text-sm text-[#8290aa]">
              Official tournament hub
            </p>
          </div>

          <nav className="flex flex-wrap gap-2">
            <Link
              href="/tournament/matches"
              className="rounded-lg border border-[#30405d] bg-[#101727] px-4 py-2.5 text-[10px] font-black tracking-wider text-[#b8c5da] transition hover:border-[#27d9ff]/60 hover:text-[#52e2ff]"
            >
              MATCHES
            </Link>

            <Link
              href="/tournament/teams"
              className="rounded-lg border border-[#30405d] bg-[#101727] px-4 py-2.5 text-[10px] font-black tracking-wider text-[#b8c5da] transition hover:border-[#27d9ff]/60 hover:text-[#52e2ff]"
            >
              TEAMS
            </Link>

            <Link
              href="/tournament/fixtures"
              className="rounded-lg border border-[#30405d] bg-[#101727] px-4 py-2.5 text-[10px] font-black tracking-wider text-[#b8c5da] transition hover:border-[#27d9ff]/60 hover:text-[#52e2ff]"
            >
              FIXTURES
            </Link>

            <Link
              href="/tournament/bracket"
              className="rounded-lg border border-[#30405d] bg-[#101727] px-4 py-2.5 text-[10px] font-black tracking-wider text-[#b8c5da] transition hover:border-[#9d62ff]/60 hover:text-[#c29aff]"
            >
              BRACKET
            </Link>

            <Link
              href="/tournament/players"
              className="rounded-lg border border-[#30405d] bg-[#101727] px-4 py-2.5 text-[10px] font-black tracking-wider text-[#b8c5da] transition hover:border-[#32e6a1]/60 hover:text-[#53efb1]"
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
              Unable to load tournament data
            </div>

            <div className="mt-1 text-sm text-[#ff9aae]">
              {error}
            </div>
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-[#263149] bg-[#0b101b] p-16 text-center text-sm text-[#8290aa]">
            Loading tournament...
          </div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-[#263149] bg-gradient-to-br from-[#111827] to-[#090e18] p-5">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#52e2ff]">
                  REGISTERED TEAMS
                </div>

                <div className="mt-2 text-4xl font-black">
                  {teams.length}
                </div>
              </div>

              <div className="rounded-xl border border-[#263149] bg-gradient-to-br from-[#111827] to-[#090e18] p-5">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#53efb1]">
                  COMPLETED
                </div>

                <div className="mt-2 text-4xl font-black">
                  {
                    completedMatches.length
                  }
                </div>
              </div>

              <div className="rounded-xl border border-[#ff3158]/40 bg-gradient-to-br from-[#17101a] to-[#0c0b13] p-5">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff6b86]">
                  LIVE NOW
                </div>

                <div className="mt-2 text-4xl font-black text-[#ff718a]">
                  {
                    liveMatches.length
                  }
                </div>
              </div>

              <div className="rounded-xl border border-[#9d62ff]/40 bg-gradient-to-br from-[#151020] to-[#0b0b13] p-5">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b98cff]">
                  UPCOMING
                </div>

                <div className="mt-2 text-4xl font-black">
                  {
                    scheduledMatches.length
                  }
                </div>
              </div>
            </section>

            <section className="relative mt-6 overflow-hidden rounded-xl border border-[#263149] bg-[#0b101b] p-6">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#52e2ff]">
                    TOURNAMENT INFO
                  </div>

                  <h2 className="mt-1 text-2xl font-black">
                    {settings?.tournamentName ||
                      "Tournament Information"}
                  </h2>

                  {settings?.tagline && (
                    <p className="mt-1 text-sm text-[#71809a]">
                      {settings.tagline}
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-[#27d9ff]/30 bg-[#27d9ff]/10 px-4 py-2">
                  <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#52e2ff]">
                    STATUS
                  </div>

                  <div className="mt-1 text-sm font-black text-white">
                    {settings?.tournamentStatus ||
                      "Upcoming"}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-[#263149] bg-[#080e18] p-4">
                  <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#61718c]">
                    START
                  </div>
                  <div className="mt-2 text-sm font-black text-white">
                    {formatTournamentDate(
                      settings?.startDate,
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-[#263149] bg-[#080e18] p-4">
                  <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#61718c]">
                    END
                  </div>
                  <div className="mt-2 text-sm font-black text-white">
                    {formatTournamentDate(
                      settings?.endDate,
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-[#263149] bg-[#080e18] p-4">
                  <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#61718c]">
                    ORGANIZER
                  </div>
                  <div className="mt-2 text-sm font-black text-white">
                    {settings?.organizerName ||
                      "Not set"}
                  </div>
                </div>

                <div className="rounded-lg border border-[#263149] bg-[#080e18] p-4">
                  <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#61718c]">
                    PRIZE POOL
                  </div>
                  <div className="mt-2 text-sm font-black text-[#ffd45c]">
                    {settings?.prizePool ||
                      "Not set"}
                  </div>
                </div>
              </div>

              {settings?.announcement && (
                <div className="mt-4 rounded-lg border border-[#ffd45c]/20 bg-[#ffd45c]/5 p-4">
                  <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#ffd45c]">
                    ANNOUNCEMENT
                  </div>

                  <p className="mt-2 text-sm leading-6 text-[#c4cede]">
                    {settings.announcement}
                  </p>
                </div>
              )}
            </section>

            <section className="relative mt-6 overflow-hidden rounded-xl border border-[#263149] bg-[#0b101b] p-6">
              <div className="relative flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff5275]">
                    TOURNAMENT
                  </div>

                  <h2 className="mt-1 text-xl font-black">
                    Tournament Progress
                  </h2>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-black text-[#52e2ff]">
                    {groupCompleted}
                    <span className="text-[#3e4c64]">
                      /
                    </span>
                    {groupTotal}
                  </div>

                  <div className="text-[9px] font-black uppercase tracking-wider text-[#64738d]">
                    Group matches
                  </div>
                </div>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#161e2d]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#ff3158] via-[#9d62ff] to-[#27d9ff] transition-all"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>
            </section>

            <section className="mt-6 overflow-hidden rounded-xl border border-[#263149] bg-[#0b101b]">
              <div className="border-b border-[#263149] p-6">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd45c]">
                  STANDINGS
                </div>

                <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-2xl font-black">
                    Tournament Standings
                  </h2>

                  <div className="flex flex-wrap gap-2">
                    {[
                      {
                        id: "overall",
                        label: "OVERALL",
                      },
                      {
                        id: "group",
                        label: "GROUP STAGE",
                      },
                      {
                        id: "qualifiers",
                        label: "QUALIFIERS",
                      },
                      {
                        id: "final",
                        label: "GRAND FINAL",
                      },
                    ].map(
                      (tab) => {
                        const active =
                          standingsView ===
                          tab.id;

                        return (
                          <button
                            key={
                              tab.id
                            }
                            type="button"
                            onClick={() =>
                              setStandingsView(
                                tab.id as StandingsView,
                              )
                            }
                            className={`rounded-lg border px-4 py-2 text-[9px] font-black tracking-wider transition ${
                              active
                                ? "border-[#ff3158] bg-[#ff3158]/15 text-[#ff6b86] shadow-[0_0_18px_rgba(255,49,88,0.12)]"
                                : "border-[#30405d] bg-[#101727] text-[#8190aa] hover:border-[#27d9ff]/50 hover:text-[#52e2ff]"
                            }`}
                          >
                            {
                              tab.label
                            }
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>

              {standingsView ===
                "overall" ||
              standingsView ===
                "group" ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px]">
                    <thead className="bg-[#111827] text-[10px] uppercase tracking-wider text-[#72819a]">
                      <tr>
                        <th className="px-5 py-3 text-left">
                          #
                        </th>

                        <th className="px-3 py-3 text-left">
                          TEAM
                        </th>

                        <th className="px-3 py-3">
                          P
                        </th>

                        <th className="px-3 py-3">
                          W
                        </th>

                        <th className="px-3 py-3">
                          L
                        </th>

                        <th className="px-3 py-3">
                          RD
                        </th>

                        <th className="px-5 py-3">
                          PTS
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {standings.map(
                        (
                          standing,
                          index,
                        ) => (
                          <tr
                            key={
                              standing
                                .team
                                .id
                            }
                            className="border-t border-[#1b2638] transition hover:bg-[#101827]"
                          >
                            <td className="px-5 py-4">
                              <span
                                className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-black ${
                                  index ===
                                  0
                                    ? "bg-[#ffd45c]/15 text-[#ffd45c]"
                                    : index ===
                                        1
                                      ? "bg-[#c8d3df]/10 text-[#c8d3df]"
                                      : index ===
                                          2
                                        ? "bg-[#d78a5a]/10 text-[#e3a074]"
                                        : "bg-[#202b3d] text-[#708099]"
                                }`}
                              >
                                {index +
                                  1}
                              </span>
                            </td>

                            <td className="px-3 py-4">
                              <Link
                                href={`/tournament/teams/${encodeURIComponent(
                                  standing
                                    .team
                                    .id,
                                )}`}
                                className="font-black hover:text-[#52e2ff]"
                              >
                                {
                                  standing
                                    .team
                                    .name
                                }
                              </Link>

                              <div className="mt-1 text-[10px] font-bold text-[#61718c]">
                                {
                                  standing
                                    .team
                                    .tag
                                }
                              </div>
                            </td>

                            <td className="px-3 py-4 text-center">
                              {
                                standing.played
                              }
                            </td>

                            <td className="px-3 py-4 text-center font-black text-[#53efb1]">
                              {
                                standing.wins
                              }
                            </td>

                            <td className="px-3 py-4 text-center text-[#ff718a]">
                              {
                                standing.losses
                              }
                            </td>

                            <td className="px-3 py-4 text-center text-[#9dceff]">
                              {standing.roundDifference >
                              0
                                ? `+${standing.roundDifference}`
                                : standing.roundDifference}
                            </td>

                            <td className="px-5 py-4 text-center text-lg font-black text-[#ffd45c]">
                              {
                                standing.points
                              }
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {standingsView ===
                "qualifiers" && (
                <div className="grid gap-4 p-6 md:grid-cols-2">
                  <div className="rounded-xl border border-[#9d62ff]/40 bg-[#110d1d] p-5">
                    <div className="text-[10px] font-black tracking-[0.2em] text-[#b98cff]">
                      QUALIFIER PATH
                    </div>

                    <h3 className="mt-2 text-xl font-black">
                      Phase 2
                    </h3>

                    <div className="mt-5 space-y-3">
                      {qualifierTeams.map(
                        (
                          item,
                          index,
                        ) => (
                          <div
                            key={
                              item
                                .team
                                .id
                            }
                            className="flex items-center justify-between rounded-lg border border-[#27334a] bg-[#0b101b] p-4"
                          >
                            <div>
                              <div className="text-xs font-black text-[#fff]">
                                {
                                  item
                                    .team
                                    .name
                                }
                              </div>

                              <div className="mt-1 text-[9px] text-[#697994]">
                                GROUP POSITION #
                                {index +
                                  1}
                              </div>
                            </div>

                            <div
                              className={`text-[9px] font-black ${
                                index <
                                2
                                  ? "text-[#53efb1]"
                                  : "text-[#ffb86b]"
                              }`}
                            >
                              {index <
                              2
                                ? "Q1"
                                : "ELIMINATION"}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {qualifierMatches.length ===
                    0 ? (
                      <div className="rounded-xl border border-[#263149] bg-[#080e18] p-8 text-center text-sm text-[#71809a]">
                        Qualifier matches will appear after the Group Stage.
                      </div>
                    ) : (
                      qualifierMatches.map(
                        (match) => (
                          <Link
                            key={
                              match.id
                            }
                            href={`/tournament/matches/${encodeURIComponent(
                              match.id,
                            )}`}
                            className="block rounded-xl border border-[#9d62ff]/30 bg-[#0d0b16] p-5 transition hover:border-[#9d62ff]/70"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-[#b98cff]">
                                {getPhaseLabel(
                                  match.matchNumber,
                                )}
                              </span>

                              <span
                                className={`rounded border px-2 py-1 text-[8px] font-black ${statusClass(
                                  match.status,
                                )}`}
                              >
                                {
                                  match.status
                                }
                              </span>
                            </div>

                            <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                              <div className="text-right font-black">
                                {getTeamTag(
                                  teams,
                                  match.team1Id,
                                )}
                              </div>

                              <div className="text-[#9d62ff]">
                                {match.status ===
                                "Completed"
                                  ? `${match.team1Score}-${match.team2Score}`
                                  : "VS"}
                              </div>

                              <div className="font-black">
                                {getTeamTag(
                                  teams,
                                  match.team2Id,
                                )}
                              </div>
                            </div>
                          </Link>
                        ),
                      )
                    )}
                  </div>
                </div>
              )}

              {standingsView ===
                "final" && (
                <div className="p-6">
                  {!grandFinal ? (
                    <div className="rounded-xl border border-[#ffd45c]/20 bg-[#12100a] p-10 text-center">
                      <div className="text-[10px] font-black tracking-[0.2em] text-[#ffd45c]">
                        GRAND FINAL
                      </div>

                      <div className="mt-3 text-sm text-[#7d7661]">
                        The Grand Final will appear after the qualifier stage.
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={`/tournament/matches/${encodeURIComponent(
                        grandFinal.id,
                      )}`}
                      className="block rounded-xl border border-[#ffd45c]/40 bg-gradient-to-br from-[#171309] to-[#0b0d13] p-8 text-center transition hover:border-[#ffd45c]"
                    >
                      <div className="text-[10px] font-black tracking-[0.3em] text-[#ffd45c]">
                        GRAND FINAL
                      </div>

                      <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-6">
                        <div className="text-xl font-black">
                          {getTeamTag(
                            teams,
                            grandFinal.team1Id,
                          )}
                        </div>

                        <div className="text-sm font-black text-[#ffd45c]">
                          {grandFinal.status ===
                          "Completed"
                            ? `${grandFinal.team1Score} - ${grandFinal.team2Score}`
                            : "VS"}
                        </div>

                        <div className="text-xl font-black">
                          {getTeamTag(
                            teams,
                            grandFinal.team2Id,
                          )}
                        </div>
                      </div>

                      <div className="mt-5">
                        <span
                          className={`rounded border px-3 py-1 text-[9px] font-black ${statusClass(
                            grandFinal.status,
                          )}`}
                        >
                          {
                            grandFinal.status
                          }
                        </span>
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </section>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <section className="overflow-hidden rounded-xl border border-[#263149] bg-[#0b101b]">
                <div className="flex items-center justify-between border-b border-[#263149] p-6">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd45c]">
                      LATEST RESULTS
                    </div>

                    <h2 className="mt-1 text-xl font-black">
                      Completed Matches
                    </h2>
                  </div>

                  <Link
                    href="/tournament/matches"
                    className="text-[10px] font-black text-[#52e2ff]"
                  >
                    ALL →
                  </Link>
                </div>

                <div className="divide-y divide-[#1c2938]">
                  {latestResults.length ===
                  0 ? (
                    <div className="p-8 text-center text-sm text-[#7188a5]">
                      No completed matches yet.
                    </div>
                  ) : (
                    latestResults.map(
                      (match) => (
                        <Link
                          key={
                            match.id
                          }
                          href={`/tournament/matches/${encodeURIComponent(
                            match.id,
                          )}`}
                          className="block p-5 transition hover:bg-[#101827]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#61718c]">
                              M
                              {String(
                                match.matchNumber,
                              ).padStart(
                                2,
                                "0",
                              )}
                            </span>

                            <span className="text-[8px] font-black text-[#53efb1]">
                              FINAL
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                            <div className="text-right font-black">
                              {getTeamTag(
                                teams,
                                match.team1Id,
                              )}
                            </div>

                            <div className="rounded-lg bg-[#151f30] px-3 py-1 font-black text-[#ffd45c]">
                              {
                                match.team1Score
                              }
                              -
                              {
                                match.team2Score
                              }
                            </div>

                            <div className="font-black">
                              {getTeamTag(
                                teams,
                                match.team2Id,
                              )}
                            </div>
                          </div>
                        </Link>
                      ),
                    )
                  )}
                </div>
              </section>

              <section className="relative overflow-hidden rounded-xl border border-[#27d9ff]/30 bg-[#0b101b] p-6">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#52e2ff]">
                  {activeLiveMatch
                    ? "LIVE MATCH"
                    : "NEXT MATCH"}
                </div>

                {(
                  activeLiveMatch ||
                  nextMatch
                ) ? (
                  <Link
                    href={`/tournament/matches/${encodeURIComponent(
                      (
                        activeLiveMatch ||
                        nextMatch
                      ).id,
                    )}`}
                    className="mt-4 block rounded-xl border border-[#263b52] bg-[#080e18] p-5 transition hover:border-[#27d9ff]/60"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#75859f]">
                        {
                          (
                            activeLiveMatch ||
                            nextMatch
                          ).stage
                        }
                      </span>

                      <span
                        className={`rounded border px-2 py-1 text-[8px] font-black ${statusClass(
                          (
                            activeLiveMatch ||
                            nextMatch
                          ).status,
                        )}`}
                      >
                        {
                          (
                            activeLiveMatch ||
                            nextMatch
                          ).status
                        }
                      </span>
                    </div>

                    <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
                      <div className="font-black">
                        {getTeamTag(
                          teams,
                          (
                            activeLiveMatch ||
                            nextMatch
                          ).team1Id,
                        )}
                      </div>

                      <div className="font-black text-[#27d9ff]">
                        VS
                      </div>

                      <div className="font-black">
                        {getTeamTag(
                          teams,
                          (
                            activeLiveMatch ||
                            nextMatch
                          ).team2Id,
                        )}
                      </div>
                    </div>

                    <div className="mt-5 text-center text-xs text-[#65758e]">
                      {formatDate(
                        (
                          activeLiveMatch ||
                          nextMatch
                        ).scheduledAt,
                      )}
                    </div>
                  </Link>
                ) : (
                  <div className="mt-4 rounded-xl border border-[#202d40] bg-[#080e18] p-6 text-center text-sm text-[#71809a]">
                    No upcoming matches.
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
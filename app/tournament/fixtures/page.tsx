"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { matches as defaultMatches, Match } from "../../data/matches";
import { teams as defaultTeams, Team } from "../../data/teams";

const MATCHES_STORAGE_KEY = "tournament-matches";
const TEAMS_STORAGE_KEY = "tournament-teams";

const GROUP_FIXTURES = [
  { id: "M01", map: "Lotus" },
  { id: "M02", map: "Sunset" },
  { id: "M03", map: "Haven" },
  { id: "M04", map: "Split" },
  { id: "M05", map: "Ascent" },
  { id: "M06", map: "Bind" },
  { id: "M07", map: "Breeze" },
  { id: "M08", map: "Bind" },
  { id: "M09", map: "Lotus" },
  { id: "M10", map: "Sunset" },
  { id: "M11", map: "Haven" },
  { id: "M12", map: "Ascent" },
];

function getStoredMatches(): Match[] {
  if (typeof window === "undefined") {
    return defaultMatches;
  }

  try {
    const stored = localStorage.getItem(MATCHES_STORAGE_KEY);

    if (!stored) {
      return defaultMatches;
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : defaultMatches;
  } catch {
    return defaultMatches;
  }
}

function getStoredTeams(): Team[] {
  if (typeof window === "undefined") {
    return defaultTeams;
  }

  try {
    const stored = localStorage.getItem(TEAMS_STORAGE_KEY);

    if (!stored) {
      return defaultTeams;
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : defaultTeams;
  } catch {
    return defaultTeams;
  }
}

function getTeam(
  teams: Team[],
  teamId?: string,
): Team | undefined {
  if (!teamId) {
    return undefined;
  }

  return teams.find((team) => team.id === teamId);
}

function getGroupMatch(
  matches: Match[],
  fixtureId: string,
): Match | undefined {
  return matches.find(
    (match) =>
      match.matchNumber ===
      Number(fixtureId.replace("M", "")),
  );
}

function teamInitials(team?: Team) {
  if (!team) {
    return "?";
  }

  return team.tag.slice(0, 3).toUpperCase();
}

function FixtureRow({
  fixture,
  match,
  teams,
}: {
  fixture: {
    id: string;
    map: string;
  };
  match?: Match;
  teams: Team[];
}) {
  const team1 = getTeam(teams, match?.team1Id);
  const team2 = getTeam(teams, match?.team2Id);

  const hasMatch = Boolean(match);

  return (
    <div className="grid min-h-[72px] grid-cols-[58px_1fr_80px] items-center border-b border-white/10 last:border-b-0 md:grid-cols-[58px_1fr_100px]">
      <div className="flex items-center justify-center">
        <div className="bg-red-500 px-2 py-2 text-[9px] font-black text-white">
          {fixture.id}
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-3 px-3 md:px-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-[9px] font-black text-white/35">
          {teamInitials(team1)}
        </div>

        <div className="min-w-0 flex-1">
          <div
            className={`truncate text-[10px] font-black uppercase ${
              team1 ? "text-white" : "text-white/30"
            }`}
          >
            {team1?.name ?? "TBD"}
          </div>
        </div>

        <div className="px-2 text-[9px] font-black uppercase tracking-[0.15em] text-white/20">
          VS
        </div>

        <div className="min-w-0 flex-1 text-right">
          <div
            className={`truncate text-[10px] font-black uppercase ${
              team2 ? "text-white" : "text-white/30"
            }`}
          >
            {team2?.name ?? "TBD"}
          </div>
        </div>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-[9px] font-black text-white/35">
          {teamInitials(team2)}
        </div>
      </div>

      <div className="flex flex-col items-end justify-center gap-1 pr-4">
        <div className="text-[9px] font-black uppercase text-white/30">
          {fixture.map}
        </div>

        <div
          className={`text-[8px] font-black uppercase tracking-[0.12em] ${
            hasMatch
              ? match?.status === "Completed"
                ? "text-emerald-300"
                : match?.status === "Live"
                  ? "text-red-300"
                  : "text-cyan-300"
              : "text-white/20"
          }`}
        >
          {match?.status ?? "TBD"}
        </div>
      </div>
    </div>
  );
}

export default function TournamentFixturesPage() {
  const [teams, setTeams] = useState<Team[]>(defaultTeams);
  const [matchList, setMatchList] =
    useState<Match[]>(defaultMatches);

  useEffect(() => {
    const refresh = () => {
      setTeams(getStoredTeams());
      setMatchList(getStoredMatches());
    };

    refresh();

    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);

    const interval = window.setInterval(refresh, 1000);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      window.clearInterval(interval);
    };
  }, []);

  const groupMatches = useMemo(
    () =>
      matchList.filter(
        (match) =>
          match.stage.toLowerCase() === "group stage",
      ),
    [matchList],
  );

  const completedCount = groupMatches.filter(
    (match) => match.status === "Completed",
  ).length;

  const liveCount = groupMatches.filter(
    (match) => match.status === "Live",
  ).length;

  const scheduledCount = groupMatches.filter(
    (match) => match.status === "Scheduled",
  ).length;

  const remainingCount =
    GROUP_FIXTURES.length - completedCount;

  return (
    <main className="min-h-screen bg-[#070b11] text-white">
      <div className="mx-auto max-w-[1500px] px-5 py-8 md:px-8 lg:px-10">
        <header className="border border-white/10 bg-[#0a1018]">
          <div className="px-8 py-8 md:px-10">
            <Link
              href="/tournament"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35 transition hover:text-white"
            >
              ← Tournament Central
            </Link>

            <div className="mt-9 flex items-center gap-3">
              <span className="h-px w-8 bg-cyan-300" />

              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">
                Tournament Fixtures
              </span>
            </div>

            <div className="mt-3 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-5xl font-black uppercase tracking-tight md:text-6xl">
                  Fixtures
                </h1>

                <p className="mt-4 text-sm text-white/40">
                  Double round-robin league followed by an IPL-style
                  playoff system.
                </p>
              </div>

              <nav className="flex flex-wrap gap-3">
                <Link
                  href="/tournament"
                  className="border border-white/10 px-5 py-3 text-[9px] font-black uppercase tracking-[0.15em] text-white/45 transition hover:text-white"
                >
                  Tournament
                </Link>

                <Link
                  href="/tournament/bracket"
                  className="border border-cyan-400/20 bg-cyan-400/[0.03] px-5 py-3 text-[9px] font-black uppercase tracking-[0.15em] text-cyan-300"
                >
                  Playoff Bracket
                </Link>

                <Link
                  href="/tournament/matches"
                  className="border border-white/10 px-5 py-3 text-[9px] font-black uppercase tracking-[0.15em] text-white/45 transition hover:text-white"
                >
                  Match Center
                </Link>
              </nav>
            </div>
          </div>

          <div className="grid border-t border-white/10 md:grid-cols-4">
            <div className="border-b border-white/10 px-6 py-5 md:border-b-0 md:border-r">
              <div className="text-[8px] font-black uppercase tracking-[0.2em] text-white/25">
                Teams
              </div>

              <div className="mt-2 text-xl font-black">
                {teams.length}
              </div>
            </div>

            <div className="border-b border-white/10 px-6 py-5 md:border-b-0 md:border-r">
              <div className="text-[8px] font-black uppercase tracking-[0.2em] text-white/25">
                Group Matches
              </div>

              <div className="mt-2 text-xl font-black">
                {GROUP_FIXTURES.length}
              </div>
            </div>

            <div className="border-b border-white/10 px-6 py-5 md:border-b-0 md:border-r">
              <div className="text-[8px] font-black uppercase tracking-[0.2em] text-white/25">
                Completed
              </div>

              <div className="mt-2 text-xl font-black text-cyan-300">
                {completedCount}
              </div>
            </div>

            <div className="px-6 py-5">
              <div className="text-[8px] font-black uppercase tracking-[0.2em] text-white/25">
                Remaining
              </div>

              <div className="mt-2 text-xl font-black">
                {Math.max(remainingCount, 0)}
              </div>
            </div>
          </div>
        </header>

        <section className="mt-8 overflow-hidden border border-white/10 bg-[#0a1018]">
          <div className="flex flex-col border-b border-white/10 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 px-5 py-5">
              <div className="bg-red-500 px-4 py-3 text-xs font-black uppercase">
                Phase 1
              </div>

              <div>
                <div className="text-sm font-black uppercase tracking-wide">
                  Double Round Robin
                </div>

                <div className="mt-1 text-[8px] font-black uppercase tracking-[0.18em] text-white/25">
                  {GROUP_FIXTURES.length} Total Matches
                </div>
              </div>
            </div>

            <div className="flex gap-5 px-5 py-5 text-[8px] font-black uppercase tracking-[0.15em]">
              <span className="text-white/25">
                Scheduled {scheduledCount}
              </span>

              <span className="text-red-300">
                Live {liveCount}
              </span>

              <span className="text-cyan-300">
                Done {completedCount}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2">
            <div className="border-b border-white/10 md:border-b-0 md:border-r">
              <div className="border-b border-white/10 px-5 py-5">
                <div className="text-sm font-black uppercase text-cyan-300">
                  Leg 1 Fixtures
                </div>

                <div className="mt-1 text-[8px] font-black uppercase tracking-[0.16em] text-white/25">
                  Original Matchups
                </div>
              </div>

              {GROUP_FIXTURES.slice(0, 6).map(
                (fixture) => (
                  <FixtureRow
                    key={fixture.id}
                    fixture={fixture}
                    match={getGroupMatch(
                      groupMatches,
                      fixture.id,
                    )}
                    teams={teams}
                  />
                ),
              )}
            </div>

            <div>
              <div className="border-b border-white/10 px-5 py-5">
                <div className="text-sm font-black uppercase text-cyan-300">
                  Leg 2 Fixtures
                </div>

                <div className="mt-1 text-[8px] font-black uppercase tracking-[0.16em] text-white/25">
                  Reversed Advantage
                </div>
              </div>

              {GROUP_FIXTURES.slice(6, 12).map(
                (fixture) => (
                  <FixtureRow
                    key={fixture.id}
                    fixture={fixture}
                    match={getGroupMatch(
                      groupMatches,
                      fixture.id,
                    )}
                    teams={teams}
                  />
                ),
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
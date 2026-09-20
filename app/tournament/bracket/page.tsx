"use client";

import Link from "next/link";
import { TournamentBrand } from "../components/tournament-brand";
import { useEffect, useMemo, useState } from "react";
import { matches as defaultMatches, Match } from "../../data/matches";
import { teams as defaultTeams, Team } from "../../data/teams";

const MATCHES_STORAGE_KEY = "tournament-matches";
const TEAMS_STORAGE_KEY = "tournament-teams";

/*
 * Your Group Stage currently uses 12 fixture slots.
 * Phase 2 rankings should not be decided until those fixtures
 * have actually been completed.
 */
const REQUIRED_GROUP_MATCHES = 12;

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

function normalizeStage(stage: string) {
  return stage
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findStageMatch(
  matches: Match[],
  names: string[],
): Match | undefined {
  const normalizedNames = names.map(normalizeStage);

  return matches.find((match) =>
    normalizedNames.includes(normalizeStage(match.stage)),
  );
}

function getWinnerId(match?: Match): string | undefined {
  if (!match) {
    return undefined;
  }

  if (match.winnerId) {
    return match.winnerId;
  }

  if (match.status !== "Completed") {
    return undefined;
  }

  if (match.team1Score === match.team2Score) {
    return undefined;
  }

  return match.team1Score > match.team2Score
    ? match.team1Id
    : match.team2Id;
}

function getLoserId(match?: Match): string | undefined {
  if (!match || match.status !== "Completed") {
    return undefined;
  }

  const winnerId = getWinnerId(match);

  if (!winnerId) {
    return undefined;
  }

  if (match.team1Id === winnerId) {
    return match.team2Id;
  }

  if (match.team2Id === winnerId) {
    return match.team1Id;
  }

  return undefined;
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

function calculateStandings(
  teams: Team[],
  matches: Match[],
): Team[] {
  const groupMatches = matches.filter(
    (match) =>
      normalizeStage(match.stage) === "group stage",
  );

  /*
   * IMPORTANT:
   *
   * Do not use seed order as standings.
   *
   * Until the complete Group Stage has been played,
   * Phase 2 positions remain unknown.
   */
  const completedGroupMatches = groupMatches.filter(
    (match) => match.status === "Completed",
  );

  if (
    completedGroupMatches.length < REQUIRED_GROUP_MATCHES
  ) {
    return [];
  }

  const table = teams.map((team) => ({
    team,
    wins: 0,
    losses: 0,
    roundDiff: 0,
  }));

  completedGroupMatches.forEach((match) => {
    const team1 = table.find(
      (entry) => entry.team.id === match.team1Id,
    );

    const team2 = table.find(
      (entry) => entry.team.id === match.team2Id,
    );

    if (!team1 || !team2) {
      return;
    }

    if (match.team1Score > match.team2Score) {
      team1.wins += 1;
      team2.losses += 1;
    } else if (match.team2Score > match.team1Score) {
      team2.wins += 1;
      team1.losses += 1;
    }

    team1.roundDiff +=
      match.team1Score - match.team2Score;

    team2.roundDiff +=
      match.team2Score - match.team1Score;
  });

  return table
    .sort((a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }

      if (b.roundDiff !== a.roundDiff) {
        return b.roundDiff - a.roundDiff;
      }

      return a.team.seed - b.team.seed;
    })
    .map((entry) => ({
      ...entry.team,
      wins: entry.wins,
      losses: entry.losses,
    }));
}

function TeamSlot({
  team,
  score,
  label,
}: {
  team?: Team;
  score?: number;
  label: string;
}) {
  return (
    <div className="flex min-h-[76px] items-center justify-between border-b border-white/[0.08] bg-white/[0.01] px-5 py-4 last:border-b-0">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#52e2ff]/25 bg-[#060b14] shadow-[0_0_18px_rgba(39,217,255,0.07)]">
          {team?.logo ? (
            <img
              src={team.logo}
              alt={`${team.name} logo`}
              className="h-full w-full object-cover"
            />
          ) : team ? (
            <span className="text-[10px] font-black text-white/60">
              {team.tag.slice(0, 3).toUpperCase()}
            </span>
          ) : (
            <span className="text-xs font-black text-white/25">
              ?
            </span>
          )}
        </div>

        <div className="min-w-0">
          <div
            className={`truncate text-sm font-black uppercase ${
              team ? "text-white" : "text-white/35"
            }`}
          >
            {team?.name ?? "TBD"}
          </div>

          <div className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-cyan-300/60">
            {team ? `Seed #${team.seed}` : label}
          </div>
        </div>
      </div>

      <div
        className={`text-xl font-black ${
          typeof score === "number"
            ? "text-white"
            : "text-white/15"
        }`}
      >
        {typeof score === "number" ? score : "-"}
      </div>
    </div>
  );
}

function PlayoffCard({
  title,
  subtitle,
  description,
  accent,
  match,
  team1,
  team2,
  team1Label,
  team2Label,
}: {
  title: string;
  subtitle: string;
  description: string;
  accent: "cyan" | "red" | "yellow" | "green";
  match?: Match;
  team1?: Team;
  team2?: Team;
  team1Label: string;
  team2Label: string;
}) {
  const accentClasses = {
    cyan: {
      border: "border-cyan-400/25",
      title: "text-cyan-300",
      glow: "bg-cyan-400/[0.025]",
    },
    red: {
      border: "border-red-400/25",
      title: "text-red-300",
      glow: "bg-red-400/[0.025]",
    },
    yellow: {
      border: "border-yellow-400/25",
      title: "text-yellow-300",
      glow: "bg-yellow-400/[0.025]",
    },
    green: {
      border: "border-emerald-400/25",
      title: "text-emerald-300",
      glow: "bg-emerald-400/[0.025]",
    },
  };

  const styles = accentClasses[accent];

  const content = (
    <div
      className={`overflow-hidden rounded-2xl border ${styles.border} ${styles.glow}`}
    >
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div
            className={`text-xs font-black uppercase tracking-[0.16em] ${styles.title}`}
          >
            {title}
          </div>

          <div className="text-[9px] font-black uppercase tracking-[0.15em] text-white/25">
            {match?.status ?? "Waiting"}
          </div>
        </div>

        <div className="mt-2 text-[9px] font-black uppercase tracking-[0.12em] text-white/30">
          {subtitle}
        </div>

        <p className="mt-3 text-[10px] leading-5 text-white/35">
          {description}
        </p>
      </div>

      <TeamSlot
        team={team1}
        score={match?.team1Score}
        label={team1Label}
      />

      <TeamSlot
        team={team2}
        score={match?.team2Score}
        label={team2Label}
      />

      {match && (
        <div className="border-t border-white/10 px-5 py-3 text-[9px] font-black uppercase tracking-[0.15em] text-white/25">
          BO{match.bestOf} • {match.map || "Map TBD"}
        </div>
      )}
    </div>
  );

  if (match) {
    return (
      <Link
        href={`/tournament/matches/${match.id}`}
        className="block transition hover:-translate-y-0.5"
      >
        {content}
      </Link>
    );
  }

  return content;
}

export default function TournamentBracketPage() {
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

  const groupStageMatches = useMemo(
    () =>
      matchList.filter(
        (match) =>
          normalizeStage(match.stage) === "group stage",
      ),
    [matchList],
  );

  const completedGroupMatches = useMemo(
    () =>
      groupStageMatches.filter(
        (match) => match.status === "Completed",
      ),
    [groupStageMatches],
  );

  const groupStageComplete =
    completedGroupMatches.length >= REQUIRED_GROUP_MATCHES;

  /*
   * Rankings are ONLY available after the complete Group Stage.
   */
  const standings = useMemo(
    () =>
      groupStageComplete
        ? calculateStandings(teams, matchList)
        : [],
    [teams, matchList, groupStageComplete],
  );

  const qualifier1 = useMemo(
    () =>
      findStageMatch(matchList, [
        "Qualifier 1",
        "Qualifier1",
        "Q1",
      ]),
    [matchList],
  );

  const eliminator = useMemo(
    () =>
      findStageMatch(matchList, [
        "Eliminator",
      ]),
    [matchList],
  );

  const qualifier2 = useMemo(
    () =>
      findStageMatch(matchList, [
        "Qualifier 2",
        "Qualifier2",
        "Q2",
      ]),
    [matchList],
  );

  const grandFinal = useMemo(
    () =>
      findStageMatch(matchList, [
        "Grand Final",
        "Grand Final 1",
      ]),
    [matchList],
  );

  /*
   * Rank positions.
   *
   * These remain undefined until the Group Stage is complete.
   */
  const rank1 = standings[0];
  const rank2 = standings[1];
  const rank3 = standings[2];
  const rank4 = standings[3];

  /*
   * QUALIFIER 1
   *
   * Rank #1 vs Rank #2
   */
  const qualifier1Team1 =
    getTeam(teams, qualifier1?.team1Id) ??
    rank1;

  const qualifier1Team2 =
    getTeam(teams, qualifier1?.team2Id) ??
    rank2;

  /*
   * ELIMINATOR
   *
   * Rank #3 vs Rank #4
   */
  const eliminatorTeam1 =
    getTeam(teams, eliminator?.team1Id) ??
    rank3;

  const eliminatorTeam2 =
    getTeam(teams, eliminator?.team2Id) ??
    rank4;

  /*
   * QUALIFIER 1 RESULT
   */
  const q1WinnerId = getWinnerId(qualifier1);
  const q1LoserId = getLoserId(qualifier1);

  const q1Winner = getTeam(
    teams,
    q1WinnerId,
  );

  const q1Loser = getTeam(
    teams,
    q1LoserId,
  );

  /*
   * ELIMINATOR RESULT
   */
  const eliminatorWinnerId =
    getWinnerId(eliminator);

  const eliminatorLoserId =
    getLoserId(eliminator);

  const eliminatorWinner =
    getTeam(teams, eliminatorWinnerId);

  const eliminatorLoser =
    getTeam(teams, eliminatorLoserId);

  /*
   * QUALIFIER 2
   *
   * Loser Q1 vs Winner Eliminator
   */
  const qualifier2Team1 =
    getTeam(teams, qualifier2?.team1Id) ??
    q1Loser;

  const qualifier2Team2 =
    getTeam(teams, qualifier2?.team2Id) ??
    eliminatorWinner;

  /*
   * QUALIFIER 2 RESULT
   */
  const q2WinnerId =
    getWinnerId(qualifier2);

  const q2Winner =
    getTeam(teams, q2WinnerId);

  /*
   * GRAND FINAL
   *
   * Winner Q1 vs Winner Q2
   */
  const grandFinalTeam1 =
    getTeam(teams, grandFinal?.team1Id) ??
    q1Winner;

  const grandFinalTeam2 =
    getTeam(teams, grandFinal?.team2Id) ??
    q2Winner;

  /*
   * CHAMPION
   *
   * Only appears after the actual Grand Final
   * has been completed.
   */
  const champion =
    grandFinal?.status === "Completed"
      ? getTeam(
          teams,
          getWinnerId(grandFinal),
        )
      : undefined;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050810] text-white">
      <div className="mx-auto max-w-[1500px] px-5 py-8 md:px-8 lg:px-10">
        <header className="mb-8 border-b border-[#263750] pb-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_14px_rgba(248,113,113,0.8)]" />

                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-300">
                  Phase 2
                </span>
              </div>

              <h1 className="text-3xl font-black uppercase tracking-tight md:text-5xl">
                Playoffs & Grand Final
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">
                IPL-style playoff system. Rankings are determined by
                completed Group Stage results.
              </p>
            </div>

            <nav className="flex flex-wrap gap-2">
              <Link
                href="/tournament"
                className="rounded-xl border border-[#2b3d58] bg-[#0b1220] px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#a9b8cc] transition hover:border-[#52e2ff]/50 hover:text-[#52e2ff]"
              >
                Tournament Home
              </Link>

              <Link
                href="/tournament/fixtures"
                className="rounded-lg border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/50 transition hover:border-white/20 hover:text-white"
              >
                Fixtures
              </Link>

              <Link
                href="/tournament/matches"
                className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300"
              >
                View Matches
              </Link>
            </nav>
          </div>
        </header>

        <section className="mb-8 overflow-hidden rounded-2xl border border-[#2b3d58] bg-gradient-to-br from-[#0d1522] via-[#0a1019] to-[#111020] shadow-[0_15px_50px_rgba(0,0,0,0.25)]">
          <div className="flex flex-col border-b border-white/10 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-7">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-[#ff3158] to-[#ff5275] px-4 py-3 text-xs font-black uppercase tracking-wide text-white shadow-[0_0_20px_rgba(255,49,88,0.16)]">
                Phase 2
              </div>

              <div>
                <div className="text-lg font-black uppercase tracking-wide">
                  Playoffs & Grand Final
                </div>

                <div className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/25">
                  IPL System
                </div>
              </div>
            </div>

            <div className="mt-4 text-[9px] font-black uppercase tracking-[0.22em] text-white/20 md:mt-0">
              Rank → Qualify → Conquer
            </div>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-2 md:p-8 lg:grid-cols-4">
            <div className="rounded-xl border border-cyan-400/25 bg-gradient-to-br from-cyan-400/[0.07] to-purple-500/[0.04] p-5">
              <div className="text-sm font-black uppercase text-cyan-300">
                Qualifier 1
              </div>

              <div className="mt-2 text-[9px] font-black uppercase tracking-[0.15em] text-white/30">
                Rank #1 vs Rank #2
              </div>

              <p className="mt-5 text-[10px] leading-5 text-white/35">
                Winner advances directly to the Grand Final.
              </p>
            </div>

            <div className="rounded-xl border border-red-400/25 bg-red-400/[0.07] p-5">
              <div className="text-sm font-black uppercase text-red-300">
                Eliminator
              </div>

              <div className="mt-2 text-[9px] font-black uppercase tracking-[0.15em] text-white/30">
                Rank #3 vs Rank #4
              </div>

              <p className="mt-5 text-[10px] leading-5 text-white/35">
                Loser is eliminated and finishes 4th.
              </p>
            </div>

            <div className="rounded-xl border border-yellow-400/25 bg-yellow-400/[0.07] p-5">
              <div className="text-sm font-black uppercase text-yellow-300">
                Qualifier 2
              </div>

              <div className="mt-2 text-[9px] font-black uppercase tracking-[0.15em] text-white/30">
                Loser Q1 vs Winner Eliminator
              </div>

              <p className="mt-5 text-[10px] leading-5 text-white/35">
                Winner advances to the Grand Final.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] p-5">
              <div className="text-sm font-black uppercase text-emerald-300">
                Grand Final
              </div>

              <div className="mt-2 text-[9px] font-black uppercase tracking-[0.15em] text-white/30">
                Winner Q1 vs Winner Q2
              </div>

              <p className="mt-5 text-[10px] leading-5 text-white/35">
                Best of 3 decides the tournament champion.
              </p>
            </div>
          </div>

          <div className="flex justify-center pb-8">
            <a
              href="#playoff-bracket"
              className="border border-cyan-400/20 bg-cyan-400/[0.025] px-7 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300 transition hover:bg-cyan-400/[0.08]"
            >
              Open Playoff Bracket →
            </a>
          </div>
        </section>

        <section
          id="playoff-bracket"
          className="rounded-3xl border border-[#2b3d58] bg-gradient-to-br from-[#0d1522] via-[#0a1019] to-[#111020] shadow-[0_15px_50px_rgba(0,0,0,0.22)] p-5 md:p-8"
        >
          <div className="mb-8 flex flex-col gap-3 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">
                Playoff Stage
              </div>

              <h2 className="mt-2 text-2xl font-black uppercase">
                Road to the Final
              </h2>
            </div>

            <div className="rounded-lg border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-white/30">
              4 Team Bracket
            </div>
          </div>

          {!groupStageComplete && (
            <div className="mb-6 rounded-xl border border-yellow-400/15 bg-yellow-400/[0.025] px-5 py-4">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-yellow-300/70">
                Phase 2 Not Started
              </div>

              <div className="mt-2 text-xs font-black uppercase text-white/60">
                Complete the Group Stage to determine playoff rankings.
              </div>

              <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">
                Group Stage: {completedGroupMatches.length} /{" "}
                {REQUIRED_GROUP_MATCHES} completed
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-4">
            <PlayoffCard
              title="Qualifier 1"
              subtitle="Rank #1 vs Rank #2"
              description="Winner advances directly to the Grand Final."
              accent="cyan"
              match={qualifier1}
              team1={qualifier1Team1}
              team2={qualifier1Team2}
              team1Label="Rank #1 not determined"
              team2Label="Rank #2 not determined"
            />

            <PlayoffCard
              title="Eliminator"
              subtitle="Rank #3 vs Rank #4"
              description="Loser is eliminated and finishes 4th."
              accent="red"
              match={eliminator}
              team1={eliminatorTeam1}
              team2={eliminatorTeam2}
              team1Label="Rank #3 not determined"
              team2Label="Rank #4 not determined"
            />

            <PlayoffCard
              title="Qualifier 2"
              subtitle="Loser Q1 vs Winner Eliminator"
              description="Winner advances to the Grand Final."
              accent="yellow"
              match={qualifier2}
              team1={qualifier2Team1}
              team2={qualifier2Team2}
              team1Label="Loser Qualifier 1"
              team2Label="Winner Eliminator"
            />

            <PlayoffCard
              title="Grand Final"
              subtitle="Winner Q1 vs Winner Q2"
              description="Winner becomes the tournament champion."
              accent="green"
              match={grandFinal}
              team1={grandFinalTeam1}
              team2={grandFinalTeam2}
              team1Label="Winner Qualifier 1"
              team2Label="Winner Qualifier 2"
            />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/[0.02] px-4 py-4">
              <div className="text-[9px] font-black uppercase tracking-[0.15em] text-cyan-300/60">
                Qualifier 1 Winner
              </div>

              <div className="mt-2 text-sm font-black uppercase">
                {q1Winner?.name ?? "TBD"}
              </div>
            </div>

            <div className="rounded-xl border border-red-400/10 bg-red-400/[0.02] px-4 py-4">
              <div className="text-[9px] font-black uppercase tracking-[0.15em] text-red-300/60">
                Eliminator Loser
              </div>

              <div className="mt-2 text-sm font-black uppercase">
                {eliminatorLoser?.name ?? "TBD"}
              </div>
            </div>

            <div className="rounded-xl border border-yellow-400/10 bg-yellow-400/[0.02] px-4 py-4">
              <div className="text-[9px] font-black uppercase tracking-[0.15em] text-yellow-300/60">
                Qualifier 2 Winner
              </div>

              <div className="mt-2 text-sm font-black uppercase">
                {q2Winner?.name ?? "TBD"}
              </div>
            </div>

            <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.02] px-4 py-4">
              <div className="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-300/60">
                Champion
              </div>

              <div className="mt-2 text-sm font-black uppercase">
                {champion?.name ?? "TBD"}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-[#2b3d58] bg-gradient-to-br from-[#0d1522] to-[#0a1019] p-5 md:p-6">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">
            Qualification Flow
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-[#263750] bg-[#0b1220] p-4">
              <div className="text-xs font-black uppercase text-cyan-300">
                01
              </div>

              <div className="mt-2 text-xs font-black uppercase">
                Qualifier 1
              </div>

              <p className="mt-2 text-[10px] leading-5 text-white/35">
                #1 vs #2. Winner gets a direct Grand Final berth.
              </p>
            </div>

            <div className="rounded-xl border border-[#263750] bg-[#0b1220] p-4">
              <div className="text-xs font-black uppercase text-red-300">
                02
              </div>

              <div className="mt-2 text-xs font-black uppercase">
                Eliminator
              </div>

              <p className="mt-2 text-[10px] leading-5 text-white/35">
                #3 vs #4. Loser is eliminated from the tournament.
              </p>
            </div>

            <div className="rounded-xl border border-[#263750] bg-[#0b1220] p-4">
              <div className="text-xs font-black uppercase text-yellow-300">
                03
              </div>

              <div className="mt-2 text-xs font-black uppercase">
                Qualifier 2
              </div>

              <p className="mt-2 text-[10px] leading-5 text-white/35">
                Loser Q1 faces the Eliminator winner.
              </p>
            </div>

            <div className="rounded-xl border border-[#263750] bg-[#0b1220] p-4">
              <div className="text-xs font-black uppercase text-emerald-300">
                04
              </div>

              <div className="mt-2 text-xs font-black uppercase">
                Grand Final
              </div>

              <p className="mt-2 text-[10px] leading-5 text-white/35">
                Winner Q1 faces Winner Q2 for the championship.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">
              Registered Teams
            </div>

            <h2 className="mt-2 text-xl font-black uppercase">
              Tournament Teams
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {teams
              .slice()
              .sort((a, b) => a.seed - b.seed)
              .map((team) => (
                <Link
                  key={team.id}
                  href={`/tournament/teams/${team.id}`}
                  className="group rounded-2xl border border-white/10 bg-[#0a1018] p-4 transition hover:border-cyan-400/20 hover:bg-white/[0.025]"
                >
                  <div className="flex items-center gap-4">
                    {team.logo ? (
                      <img
                        src={team.logo}
                        alt={`${team.name} logo`}
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs font-black text-white/45">
                        {team.tag.slice(0, 3).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="text-[9px] font-black uppercase tracking-[0.15em] text-white/25">
                        Registered Team
                      </div>

                      <div className="mt-1 truncate text-sm font-black uppercase group-hover:text-cyan-300">
                        {team.name}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </section>
      </div>
    </main>
  );
}
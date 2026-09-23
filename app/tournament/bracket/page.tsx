"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { TournamentNav } from "../components/tournament-nav";
import { fetchTeams, fetchMatches } from "@/lib/api";
import type { Match, Team } from "@/lib/types";

/*
 * Your Group Stage currently uses 12 fixture slots.
 * Phase 2 rankings should not be decided until those fixtures
 * have actually been completed.
 */
const REQUIRED_GROUP_MATCHES = 12;

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
    <div className="flex min-h-[76px] items-center justify-between border-b border-[#1e1e3a] px-5 py-4 last:border-b-0">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#1e1e3a] bg-[#030308]">
          {team?.logo ? (
            <Image
              src={team.logo}
              alt={`${team.name} logo`}
              width={40}
              height={40}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : team ? (
            <span className="text-[12px] font-black text-[#94a3b8]">
              {team.tag.slice(0, 3).toUpperCase()}
            </span>
          ) : (
            <span className="text-sm font-black text-[#334155]">
              ?
            </span>
          )}
        </div>

        <div className="min-w-0">
          <div
            className={`truncate text-sm font-black uppercase ${
              team ? "text-[#f1f5f9]" : "text-[#334155]"
            }`}
          >
            {team?.name ?? "TBD"}
          </div>

          <div className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#f1f5f9]/60">
            {team ? `Seed #${team.seed}` : label}
          </div>
        </div>
      </div>

      <div
        className={`text-xl font-black ${
          typeof score === "number"
            ? "text-[#f1f5f9]"
            : "text-[#334155]"
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
      border: "border-[#94a3b8]/30",
      title: "text-[#f1f5f9]",
      glow: "bg-[#94a3b8]/[0.03]",
    },
    red: {
      border: "border-[#ff2d55]/30",
      title: "text-[#ff4d6a]",
      glow: "bg-[#ff2d55]/[0.03]",
    },
    yellow: {
      border: "border-[#f59e0b]/30",
      title: "text-[#fbbf24]",
      glow: "bg-[#f59e0b]/[0.03]",
    },
    green: {
      border: "border-[#10b981]/30",
      title: "text-[#34d399]",
      glow: "bg-[#10b981]/[0.03]",
    },
  };

  const styles = accentClasses[accent];

  const content = (
    <div
      className={`overflow-hidden rounded-xl border ${styles.border} ${styles.glow} bg-[#0c0c18]`}
    >
      <div className="border-b border-[#1e1e3a] px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div
            className={`text-sm font-black uppercase tracking-[0.16em] ${styles.title}`}
          >
            {title}
          </div>

          <div className="text-[11px] font-black uppercase tracking-[0.15em] text-[#334155]">
            {match?.status ?? "Waiting"}
          </div>
        </div>

        <div className="mt-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#334155]">
          {subtitle}
        </div>

        <p className="mt-3 text-[12px] leading-5 text-[#64748b]">
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
        <div className="border-t border-[#1e1e3a] px-5 py-3 text-[11px] font-black uppercase tracking-[0.15em] text-[#334155]">
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
  const [teams, setTeams] = useState<Team[]>([]);
  const [matchList, setMatchList] =
    useState<Match[]>([]);

  useEffect(() => {
    let active = true;

    async function initialFetch() {
      try {
        const [fetchedTeams, fetchedMatches] = await Promise.all([
          fetchTeams(),
          fetchMatches(),
        ]);
        if (!active) return;
        setTeams(fetchedTeams);
        setMatchList(fetchedMatches);
      } catch {
        if (!active) return;
        setTeams([]);
        setMatchList([]);
      }
    }

    initialFetch();

    const onUpdate = () => {
      fetchTeams().then((t) => {
        if (active) setTeams(t);
      });
      fetchMatches().then((m) => {
        if (active) setMatchList(m);
      });
    };

    window.addEventListener("tournament-matches-updated", onUpdate);
    window.addEventListener("focus", onUpdate);

    return () => {
      active = false;
      window.removeEventListener("tournament-matches-updated", onUpdate);
      window.removeEventListener("focus", onUpdate);
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
    <div className="min-h-screen text-[#f1f5f9]">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-[#94a3b8]/[0.06] blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-[#ff2d55]/[0.05] blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-[#94a3b8]/[0.04] blur-[100px]" />
      </div>

      <TournamentNav />

      <main className="relative text-[#f1f5f9]">
        <div className="mx-auto max-w-[1680px] px-5 py-8 md:px-8 lg:px-10">

          {/* HEADER */}
          <header className="mb-8 border-b border-[#1e1e3a] pb-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[#ff2d55] shadow-[0_0_14px_rgba(255,45,85,0.8)]" />
                  <span className="text-[12px] font-black uppercase tracking-[0.3em] text-[#ff4d6a]">
                    Phase 2
                  </span>
                </div>

                <h1 className="text-3xl font-black uppercase tracking-tight md:text-5xl">
                  Playoffs &amp; Grand Final
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748b]">
                  IPL-style playoff system. Rankings are determined by
                  completed Group Stage results.
                </p>
              </div>
            </div>
          </header>

          {/* OVERVIEW PANEL */}
          <section className="mb-8 rounded-xl border border-[#1e1e3a] bg-[#0c0c18]">
            <div className="flex flex-col border-b border-[#1e1e3a] px-5 py-5 md:flex-row md:items-center md:justify-between md:px-7">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-[#ff2d55] px-4 py-3 text-sm font-black uppercase tracking-wide text-white">
                  Phase 2
                </div>

                <div>
                  <div className="text-lg font-black uppercase tracking-wide text-[#f1f5f9]">
                    Playoffs &amp; Grand Final
                  </div>

                  <div className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#334155]">
                    IPL System
                  </div>
                </div>
              </div>

              <div className="mt-4 text-[11px] font-black uppercase tracking-[0.22em] text-[#334155] md:mt-0">
                Rank → Qualify → Conquer
              </div>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2 md:p-8 lg:grid-cols-4">
              <div className="rounded-xl border border-[#94a3b8]/30 bg-[#94a3b8]/[0.03] p-5">
                <div className="text-sm font-black uppercase text-[#f1f5f9]">
                  Qualifier 1
                </div>

                <div className="mt-2 text-[11px] font-black uppercase tracking-[0.15em] text-[#334155]">
                  Rank #1 vs Rank #2
                </div>

                <p className="mt-5 text-[12px] leading-5 text-[#64748b]">
                  Winner advances directly to the Grand Final.
                </p>
              </div>

              <div className="rounded-xl border border-[#ff2d55]/30 bg-[#ff2d55]/[0.03] p-5">
                <div className="text-sm font-black uppercase text-[#ff4d6a]">
                  Eliminator
                </div>

                <div className="mt-2 text-[11px] font-black uppercase tracking-[0.15em] text-[#334155]">
                  Rank #3 vs Rank #4
                </div>

                <p className="mt-5 text-[12px] leading-5 text-[#64748b]">
                  Loser is eliminated and finishes 4th.
                </p>
              </div>

              <div className="rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/[0.03] p-5">
                <div className="text-sm font-black uppercase text-[#fbbf24]">
                  Qualifier 2
                </div>

                <div className="mt-2 text-[11px] font-black uppercase tracking-[0.15em] text-[#334155]">
                  Loser Q1 vs Winner Eliminator
                </div>

                <p className="mt-5 text-[12px] leading-5 text-[#64748b]">
                  Winner advances to the Grand Final.
                </p>
              </div>

              <div className="rounded-xl border border-[#10b981]/30 bg-[#10b981]/[0.03] p-5">
                <div className="text-sm font-black uppercase text-[#34d399]">
                  Grand Final
                </div>

                <div className="mt-2 text-[11px] font-black uppercase tracking-[0.15em] text-[#334155]">
                  Winner Q1 vs Winner Q2
                </div>

                <p className="mt-5 text-[12px] leading-5 text-[#64748b]">
                  Best of 3 decides the tournament champion.
                </p>
              </div>
            </div>

            <div className="flex justify-center pb-8">
              <a
                href="#playoff-bracket"
                className="rounded-lg border border-[#94a3b8]/30 bg-[#94a3b8]/[0.05] px-7 py-3 text-[12px] font-black uppercase tracking-[0.16em] text-[#f1f5f9] transition hover:bg-[#94a3b8]/[0.10]"
              >
                Open Playoff Bracket →
              </a>
            </div>
          </section>

          {/* BRACKET */}
          <section
            id="playoff-bracket"
            className="rounded-xl border border-[#1e1e3a] bg-[#0c0c18] p-5 md:p-8"
          >
            <div className="mb-8 flex flex-col gap-3 border-b border-[#1e1e3a] pb-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-[12px] font-black uppercase tracking-[0.22em] text-[#334155]">
                  Playoff Stage
                </div>

                <h2 className="mt-2 text-2xl font-black uppercase text-[#f1f5f9]">
                  Road to the Final
                </h2>
              </div>

              <div className="rounded-lg border border-[#1e1e3a] bg-[#030308] px-4 py-2 text-[12px] font-black uppercase tracking-[0.15em] text-[#64748b]">
                4 Team Bracket
              </div>
            </div>

            {!groupStageComplete && (
              <div className="mb-6 rounded-xl border border-[#f59e0b]/20 bg-[#f59e0b]/5 px-5 py-4">
                <div className="text-[12px] font-black uppercase tracking-[0.18em] text-[#fbbf24]/70">
                  Phase 2 Not Started
                </div>

                <div className="mt-2 text-sm font-black uppercase text-[#f1f5f9]/60">
                  Complete the Group Stage to determine playoff rankings.
                </div>

                <div className="mt-2 text-[12px] font-bold uppercase tracking-[0.12em] text-[#64748b]">
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

            {/* RESULT PILLS */}
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-[#94a3b8]/20 bg-[#94a3b8]/[0.03] px-4 py-4">
                <div className="text-[11px] font-black uppercase tracking-[0.15em] text-[#f1f5f9]/60">
                  Qualifier 1 Winner
                </div>

                <div className="mt-2 text-sm font-black uppercase text-[#f1f5f9]">
                  {q1Winner?.name ?? "TBD"}
                </div>
              </div>

              <div className="rounded-xl border border-[#ff2d55]/20 bg-[#ff2d55]/[0.03] px-4 py-4">
                <div className="text-[11px] font-black uppercase tracking-[0.15em] text-[#ff4d6a]/60">
                  Eliminator Loser
                </div>

                <div className="mt-2 text-sm font-black uppercase text-[#f1f5f9]">
                  {eliminatorLoser?.name ?? "TBD"}
                </div>
              </div>

              <div className="rounded-xl border border-[#f59e0b]/20 bg-[#f59e0b]/[0.03] px-4 py-4">
                <div className="text-[11px] font-black uppercase tracking-[0.15em] text-[#fbbf24]/60">
                  Qualifier 2 Winner
                </div>

                <div className="mt-2 text-sm font-black uppercase text-[#f1f5f9]">
                  {q2Winner?.name ?? "TBD"}
                </div>
              </div>

              {/* Champion box: gold border + gold text */}
              <div className="rounded-xl border border-[#f59e0b]/60 bg-[#f59e0b]/[0.06] px-4 py-4">
                <div className="text-[11px] font-black uppercase tracking-[0.15em] text-[#fbbf24]/80">
                  Champion
                </div>

                <div className="mt-2 text-sm font-black uppercase text-[#fbbf24]">
                  {champion?.name ?? "TBD"}
                </div>
              </div>
            </div>
          </section>

          {/* QUALIFICATION FLOW */}
          <section className="mt-8 rounded-xl border border-[#1e1e3a] bg-[#0c0c18] p-5 md:p-6">
            <div className="text-[12px] font-black uppercase tracking-[0.22em] text-[#334155]">
              Qualification Flow
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-[#1e1e3a] bg-[#030308] p-4">
                <div className="text-sm font-black uppercase text-[#f1f5f9]">
                  01
                </div>

                <div className="mt-2 text-sm font-black uppercase text-[#f1f5f9]">
                  Qualifier 1
                </div>

                <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
                  #1 vs #2. Winner gets a direct Grand Final berth.
                </p>
              </div>

              <div className="rounded-xl border border-[#1e1e3a] bg-[#030308] p-4">
                <div className="text-sm font-black uppercase text-[#ff4d6a]">
                  02
                </div>

                <div className="mt-2 text-sm font-black uppercase text-[#f1f5f9]">
                  Eliminator
                </div>

                <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
                  #3 vs #4. Loser is eliminated from the tournament.
                </p>
              </div>

              <div className="rounded-xl border border-[#1e1e3a] bg-[#030308] p-4">
                <div className="text-sm font-black uppercase text-[#fbbf24]">
                  03
                </div>

                <div className="mt-2 text-sm font-black uppercase text-[#f1f5f9]">
                  Qualifier 2
                </div>

                <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
                  Loser Q1 faces the Eliminator winner.
                </p>
              </div>

              <div className="rounded-xl border border-[#1e1e3a] bg-[#030308] p-4">
                <div className="text-sm font-black uppercase text-[#34d399]">
                  04
                </div>

                <div className="mt-2 text-sm font-black uppercase text-[#f1f5f9]">
                  Grand Final
                </div>

                <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
                  Winner Q1 faces Winner Q2 for the championship.
                </p>
              </div>
            </div>
          </section>

          {/* REGISTERED TEAMS */}
          <section className="mt-8">
            <div className="mb-4">
              <div className="text-[12px] font-black uppercase tracking-[0.22em] text-[#334155]">
                Registered Teams
              </div>

              <h2 className="mt-2 text-xl font-black uppercase text-[#f1f5f9]">
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
                    className="group rounded-xl border border-[#1e1e3a] bg-[#0c0c18] p-4 transition hover:border-[#94a3b8]/30 hover:bg-[#131326]"
                  >
                    <div className="flex items-center gap-4">
                      {team.logo ? (
                        <Image
                          src={team.logo}
                          alt={`${team.name} logo`}
                          width={48}
                          height={48}
                          unoptimized
                          className="h-12 w-12 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#1e1e3a] bg-[#030308] text-sm font-black text-[#94a3b8]">
                          {team.tag.slice(0, 3).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="text-[11px] font-black uppercase tracking-[0.15em] text-[#334155]">
                          Registered Team
                        </div>

                        <div className="mt-1 truncate text-sm font-black uppercase text-[#f1f5f9] group-hover:text-[#f1f5f9]">
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
    </div>
  );
}

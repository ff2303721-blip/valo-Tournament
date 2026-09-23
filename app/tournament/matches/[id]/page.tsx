"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { TournamentNav } from "../../components/tournament-nav";
import { matches as defaultMatches } from "@/app/data/matches";
import { teams as defaultTeams } from "@/app/data/teams";

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
    return "Schedule TBD";
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

function getTeam(teams: Team[], id?: string) {
  return teams.find((team) => team.id === id);
}

function getPlayerName(stats: PlayerStat[], id?: string) {
  return stats.find((player) => player.playerId === id)?.playerName ?? "—";
}

function statusBadge(status: MatchStatus) {
  switch (status) {
    case "Live":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff2d55]/40 bg-[#ff2d55]/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#ff4d6a]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff2d55] animate-pulse" />
          LIVE NOW
        </span>
      );
    case "Completed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#10b981]/40 bg-[#10b981]/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#34d399]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
          FINAL RESULT
        </span>
      );
    case "Cancelled":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#64748b]/40 bg-[#64748b]/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#94a3b8]">
          CANCELLED
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f59e0b]/40 bg-[#f59e0b]/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#fbbf24]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#fbbf24]" />
          UPCOMING
        </span>
      );
  }
}

export default function PublicMatchDetailPage({ params }: PageProps) {
  const [matchId, setMatchId] = useState("");
  const [match, setMatch] = useState<Match | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const resolvedParams = await params;
        const id = resolvedParams.id;

        if (!mounted) return;
        setMatchId(id);

        const [matchResponse, teamsResponse] = await Promise.all([
          fetch(`/api/matches/${encodeURIComponent(id)}`, {
            cache: "no-store",
          }),
          fetch("/api/teams?lite=1", { cache: "no-store" }),
        ]);

        const matchData = matchResponse.ok ? await matchResponse.json() : null;
        const teamsData = teamsResponse.ok ? await teamsResponse.json() : null;

        if (!mounted) return;

        const loadedTeams = Array.isArray(teamsData)
          ? teamsData
          : Array.isArray(teamsData?.teams)
          ? teamsData.teams
          : defaultTeams;

        const foundMatch =
          matchData && !matchData.error
            ? matchData
            : defaultMatches.find((m) => m.id === id);

        setTeams(loadedTeams);
        setMatch(foundMatch ? (foundMatch as Match) : null);
      } catch (err) {
        if (!mounted) return;
        console.warn("Unable to load match details:", err);
        setError("Unable to load match information.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [params]);

  const team1 = useMemo(
    () => getTeam(teams, match?.team1Id),
    [teams, match?.team1Id],
  );

  const team2 = useMemo(
    () => getTeam(teams, match?.team2Id),
    [teams, match?.team2Id],
  );

  const isCompleted = match?.status === "Completed";
  const isTeam1Winner = isCompleted && match?.winnerId === match?.team1Id;
  const isTeam2Winner = isCompleted && match?.winnerId === match?.team2Id;

  const mvpName = useMemo(
    () => getPlayerName(match?.playerStats ?? [], match?.mvpPlayerId),
    [match?.playerStats, match?.mvpPlayerId],
  );

  const topFraggerName = useMemo(
    () => getPlayerName(match?.playerStats ?? [], match?.topFraggerPlayerId),
    [match?.playerStats, match?.topFraggerPlayerId],
  );

  const team1Stats = useMemo(
    () =>
      (match?.playerStats ?? []).filter(
        (stat) => stat.teamId === match?.team1Id,
      ),
    [match],
  );

  const team2Stats = useMemo(
    () =>
      (match?.playerStats ?? []).filter(
        (stat) => stat.teamId === match?.team2Id,
      ),
    [match],
  );

  return (
    <div className="relative min-h-screen text-[#f1f5f9] pb-24">
      {/* ── Ambient Neon Glow Orbs ────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#94a3b8]/12 blur-[180px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-[#ff2d55]/10 blur-[160px]" />
        <div className="absolute bottom-10 left-1/3 h-[500px] w-[500px] rounded-full bg-[#94a3b8]/8 blur-[160px]" />
      </div>

      <TournamentNav />

      <main className="relative z-10 mx-auto max-w-[1440px] px-4 pt-6 sm:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#1e1e3a] pb-4">
          <Link
            href="/tournament/matches"
            className="inline-flex items-center gap-1.5 text-sm font-black uppercase tracking-widest text-[#94a3b8] transition hover:text-[#f1f5f9]"
          >
            <span>← ALL MATCHES</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/tournament/bracket"
              className="rounded-xl border border-[#1e1e3a] bg-[#0c0c18]/90 px-3.5 py-2 text-[12px] font-black uppercase tracking-widest text-[#94a3b8] transition hover:border-[#94a3b8]/50 hover:text-white"
            >
              BRACKET ↗
            </Link>
            <Link
              href="/tournament"
              className="rounded-xl border border-[#1e1e3a] bg-[#0c0c18]/90 px-3.5 py-2 text-[12px] font-black uppercase tracking-widest text-[#94a3b8] transition hover:border-[#94a3b8]/50 hover:text-[#f1f5f9]"
            >
              STANDINGS ↗
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-64 rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85" />
            <div className="h-48 rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85" />
          </div>
        ) : !match ? (
          <div className="rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-12 text-center backdrop-blur-xl">
            <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#ff4d6a]">
              Not Found
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase text-white">
              Match Not Found
            </h1>
            <p className="mt-3 text-sm text-[#64748b]">
              {error || `No match found for identifier ${matchId}.`}
            </p>
            <Link
              href="/tournament/matches"
              className="mt-6 inline-flex rounded-xl border border-[#1e1e3a] bg-[#0c0c18] px-6 py-3 text-sm font-black uppercase tracking-wider text-[#f1f5f9] transition hover:border-[#94a3b8]"
            >
              ← Back to All Matches
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Match Hero Scoreboard */}
            <section className="relative overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-6 backdrop-blur-xl shadow-[0_0_50px_rgba(148,163,184,0.08)] sm:p-8">
              {/* Header tags */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e1e3a] pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 items-center justify-center rounded-lg border border-[#1e1e3a] bg-[#080812] px-2.5 text-sm font-black tracking-wider text-[#f1f5f9]">
                    M{String(match.matchNumber).padStart(2, "0")}
                  </span>
                  <span className="rounded-lg border border-[#94a3b8]/40 bg-[#94a3b8]/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#f1f5f9]">
                    {match.stage}
                  </span>
                  <span className="rounded-lg border border-[#1e1e3a] bg-[#080812] px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#94a3b8]">
                    {match.map || "TBD"} • BO{match.bestOf}
                  </span>
                </div>

                {statusBadge(match.status)}
              </div>

              {/* Broadcast Versus Arena */}
              <div className="mt-8 grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
                {/* Team 1 Card */}
                <div className="flex flex-col items-center rounded-2xl border border-[#1e1e3a]/60 bg-[#080812]/70 p-6 text-center">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18] shadow-[0_0_20px_rgba(148,163,184,0.15)]">
                    {team1?.logo ? (
                      <Image
                        src={team1.logo}
                        alt=""
                        width={96}
                        height={96}
                        unoptimized
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <span className="text-2xl font-black text-[#94a3b8]">
                        {(team1?.tag ?? "TBD").slice(0, 3)}
                      </span>
                    )}
                  </div>

                  <h2
                    className={`mt-4 text-2xl font-black uppercase tracking-tight ${
                      isTeam1Winner ? "text-[#34d399]" : "text-[#f1f5f9]"
                    }`}
                  >
                    {team1?.name ?? "TBD"}
                  </h2>

                  <p className="mt-1 text-sm font-bold uppercase tracking-wider text-[#64748b]">
                    {team1?.tag ? `[${team1.tag}]` : "Team 1"}
                    {isTeam1Winner && " • WINNER"}
                  </p>
                </div>

                {/* Center Score Indicator */}
                <div className="text-center px-4">
                  {isCompleted ? (
                    <div>
                      <div className="flex items-center justify-center gap-3">
                        <span
                          className={`text-5xl font-black tracking-tight sm:text-6xl ${
                            isTeam1Winner ? "text-[#34d399]" : "text-[#94a3b8]"
                          }`}
                        >
                          {match.team1Score}
                        </span>
                        <span className="text-2xl font-black text-[#475569]">:</span>
                        <span
                          className={`text-5xl font-black tracking-tight sm:text-6xl ${
                            isTeam2Winner ? "text-[#34d399]" : "text-[#94a3b8]"
                          }`}
                        >
                          {match.team2Score}
                        </span>
                      </div>
                      <p className="mt-2 text-[12px] font-black uppercase tracking-[0.25em] text-[#64748b]">
                        FINAL SCORE
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-[#1e1e3a] bg-[#080812] px-6 py-4 text-sm font-black tracking-[0.3em] text-[#64748b]">
                      VS
                    </div>
                  )}
                </div>

                {/* Team 2 Card */}
                <div className="flex flex-col items-center rounded-2xl border border-[#1e1e3a]/60 bg-[#080812]/70 p-6 text-center">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18] shadow-[0_0_20px_rgba(148,163,184,0.15)]">
                    {team2?.logo ? (
                      <Image
                        src={team2.logo}
                        alt=""
                        width={96}
                        height={96}
                        unoptimized
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <span className="text-2xl font-black text-[#94a3b8]">
                        {(team2?.tag ?? "TBD").slice(0, 3)}
                      </span>
                    )}
                  </div>

                  <h2
                    className={`mt-4 text-2xl font-black uppercase tracking-tight ${
                      isTeam2Winner ? "text-[#34d399]" : "text-[#f1f5f9]"
                    }`}
                  >
                    {team2?.name ?? "TBD"}
                  </h2>

                  <p className="mt-1 text-sm font-bold uppercase tracking-wider text-[#64748b]">
                    {team2?.tag ? `[${team2.tag}]` : "Team 2"}
                    {isTeam2Winner && " • WINNER"}
                  </p>
                </div>
              </div>

              {/* Schedule and Map info strip */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#1e1e3a] pt-4 text-sm font-semibold text-[#64748b]">
                <span>{formatDate(match.scheduledAt)}</span>
                <span className="text-right text-[#94a3b8]">
                  Map: <strong className="text-white">{match.map || "TBD"}</strong> • Format: <strong className="text-white">BO{match.bestOf}</strong>
                </span>
              </div>
            </section>

            {/* Awards / Match Accolades (MVP & Top Fragger) */}
            {(mvpName !== "—" || topFraggerName !== "—") && (
              <section className="grid gap-4 sm:grid-cols-2">
                {mvpName !== "—" && (
                  <div className="flex items-center gap-4 rounded-2xl border border-[#f59e0b]/40 bg-[#0c0c18]/85 p-5 backdrop-blur-xl shadow-[0_0_25px_rgba(245,158,11,0.08)]">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#f59e0b]/50 bg-[#f59e0b]/15 text-xl font-black text-[#f59e0b]">
                      ★
                    </div>
                    <div>
                      <p className="text-[12px] font-black uppercase tracking-widest text-[#f59e0b]">
                        MATCH MVP
                      </p>
                      <h3 className="text-lg font-black uppercase text-[#f1f5f9]">
                        {mvpName}
                      </h3>
                    </div>
                  </div>
                )}

                {topFraggerName !== "—" && (
                  <div className="flex items-center gap-4 rounded-2xl border border-[#ff2d55]/40 bg-[#0c0c18]/85 p-5 backdrop-blur-xl shadow-[0_0_25px_rgba(255,45,85,0.08)]">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#ff2d55]/50 bg-[#ff2d55]/15 text-xl font-black text-[#ff2d55]">
                      ⊕
                    </div>
                    <div>
                      <p className="text-[12px] font-black uppercase tracking-widest text-[#ff4d6a]">
                        TOP FRAGGER
                      </p>
                      <h3 className="text-lg font-black uppercase text-[#f1f5f9]">
                        {topFraggerName}
                      </h3>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Scoreboard Table Section */}
            <section className="space-y-6">
              <div className="border-b border-[#1e1e3a] pb-3">
                <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#94a3b8]">
                  PERFORMANCE TELEMETRY
                </p>
                <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-[#f1f5f9]">
                  Player Scoreboard
                </h2>
              </div>

              {match.playerStats.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#1e1e3a] p-10 text-center text-sm text-[#64748b]">
                  No player statistics recorded for this match yet.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Team 1 Scoreboard */}
                  {team1Stats.length > 0 && (
                    <div className="overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 backdrop-blur-xl">
                      <div className="border-b border-[#1e1e3a] bg-[#080812] px-5 py-3 text-sm font-black uppercase tracking-wider text-[#94a3b8]">
                        {team1?.name ?? "Team 1"} — Roster Performance
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-[650px] w-full text-left">
                          <thead>
                            <tr className="border-b border-[#1e1e3a] text-[12px] font-black uppercase tracking-widest text-[#64748b]">
                              <th className="px-5 py-3">Player</th>
                              <th className="px-4 py-3 text-right">ACS</th>
                              <th className="px-4 py-3 text-right">K</th>
                              <th className="px-4 py-3 text-right">D</th>
                              <th className="px-4 py-3 text-right">A</th>
                              <th className="px-4 py-3 text-right">K/D</th>
                              <th className="px-4 py-3 text-right">ADR</th>
                              <th className="px-5 py-3 text-right">KAST%</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1e1e3a] text-sm">
                            {team1Stats.map((stat, idx) => {
                              const kd = (stat.kills / Math.max(1, stat.deaths)).toFixed(2);
                              return (
                                <tr key={idx} className="hover:bg-[#080812]/50">
                                  <td className="px-5 py-3.5 font-bold uppercase text-white">
                                    {stat.playerName}
                                  </td>
                                  <td className="px-4 py-3.5 text-right font-black text-[#f1f5f9]">
                                    {stat.acs}
                                  </td>
                                  <td className="px-4 py-3.5 text-right font-black text-white">
                                    {stat.kills}
                                  </td>
                                  <td className="px-4 py-3.5 text-right font-semibold text-[#ff4d6a]">
                                    {stat.deaths}
                                  </td>
                                  <td className="px-4 py-3.5 text-right font-semibold text-[#94a3b8]">
                                    {stat.assists}
                                  </td>
                                  <td className="px-4 py-3.5 text-right font-bold text-white">
                                    {kd}
                                  </td>
                                  <td className="px-4 py-3.5 text-right text-[#94a3b8]">
                                    {stat.adr}
                                  </td>
                                  <td className="px-5 py-3.5 text-right text-[#94a3b8]">
                                    {stat.kast}%
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Team 2 Scoreboard */}
                  {team2Stats.length > 0 && (
                    <div className="overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 backdrop-blur-xl">
                      <div className="border-b border-[#1e1e3a] bg-[#080812] px-5 py-3 text-sm font-black uppercase tracking-wider text-[#f1f5f9]">
                        {team2?.name ?? "Team 2"} — Roster Performance
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-[650px] w-full text-left">
                          <thead>
                            <tr className="border-b border-[#1e1e3a] text-[12px] font-black uppercase tracking-widest text-[#64748b]">
                              <th className="px-5 py-3">Player</th>
                              <th className="px-4 py-3 text-right">ACS</th>
                              <th className="px-4 py-3 text-right">K</th>
                              <th className="px-4 py-3 text-right">D</th>
                              <th className="px-4 py-3 text-right">A</th>
                              <th className="px-4 py-3 text-right">K/D</th>
                              <th className="px-4 py-3 text-right">ADR</th>
                              <th className="px-5 py-3 text-right">KAST%</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1e1e3a] text-sm">
                            {team2Stats.map((stat, idx) => {
                              const kd = (stat.kills / Math.max(1, stat.deaths)).toFixed(2);
                              return (
                                <tr key={idx} className="hover:bg-[#080812]/50">
                                  <td className="px-5 py-3.5 font-bold uppercase text-white">
                                    {stat.playerName}
                                  </td>
                                  <td className="px-4 py-3.5 text-right font-black text-[#f1f5f9]">
                                    {stat.acs}
                                  </td>
                                  <td className="px-4 py-3.5 text-right font-black text-white">
                                    {stat.kills}
                                  </td>
                                  <td className="px-4 py-3.5 text-right font-semibold text-[#ff4d6a]">
                                    {stat.deaths}
                                  </td>
                                  <td className="px-4 py-3.5 text-right font-semibold text-[#94a3b8]">
                                    {stat.assists}
                                  </td>
                                  <td className="px-4 py-3.5 text-right font-bold text-white">
                                    {kd}
                                  </td>
                                  <td className="px-4 py-3.5 text-right text-[#94a3b8]">
                                    {stat.adr}
                                  </td>
                                  <td className="px-5 py-3.5 text-right text-[#94a3b8]">
                                    {stat.kast}%
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
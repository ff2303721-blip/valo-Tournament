"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { TournamentNav } from "../components/tournament-nav";
import type { Match, Team } from "@/lib/types";
import { buildStandings, isGroupStageComplete } from "@/lib/standings";

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "TM"
  );
}

function TeamStatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="border-r border-[#1e1e3a] p-3.5 text-center last:border-r-0">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#475569]">
        {label}
      </p>
      <p className={`mt-1 text-lg font-black ${accent ?? "text-[#f1f5f9]"}`}>
        {value}
      </p>
    </div>
  );
}

export default function PublicTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        const [teamsRes, matchesRes] = await Promise.all([
          fetch("/api/teams?lite=1", { cache: "no-store" }),
          fetch("/api/matches", { cache: "no-store" }),
        ]);
        if (!teamsRes.ok) throw new Error("Unable to load registered teams.");
        const teamsData = await teamsRes.json();
        const matchesData = matchesRes.ok ? await matchesRes.json() : [];
        if (!active) return;
        if (Array.isArray(teamsData)) setTeams(teamsData);
        if (Array.isArray(matchesData)) setMatches(matchesData);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load teams");
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchData();
    return () => {
      active = false;
    };
  }, []);

  const standings = useMemo(() => buildStandings(teams, matches), [teams, matches]);
  const groupStageComplete = useMemo(() => isGroupStageComplete(matches), [matches]);

  const sortedTeams = standings.map((s) => s.team);

  return (
    <div className="min-h-screen text-[#f1f5f9]">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#94a3b8]/7 blur-[160px]" />
        <div className="absolute -right-40 top-20 h-[400px] w-[400px] rounded-full bg-[#94a3b8]/6 blur-[140px]" />
      </div>

      <TournamentNav />

      <main className="relative mx-auto max-w-[1680px] px-5 py-8 sm:px-8">
        {/* Page header */}
        <header className="mb-8 border-b border-[#1e1e3a] pb-6">
          <div className="text-[11px] font-black uppercase tracking-[0.3em] text-[#94a3b8]">
            Registered Rosters
          </div>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-tight">Teams</h1>
          <p className="mt-2 text-sm text-[#64748b]">
            Official registered tournament rosters and franchise lineups.
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-[#ff2d55]/30 bg-[#ff2d55]/8 px-4 py-3">
              <p className="text-sm font-bold text-[#ff4d6a]">{error}</p>
            </div>
          )}
        </header>

        {loading ? (
          <div className="rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/80 py-24 text-center backdrop-blur-xl">
            <p className="text-sm font-black uppercase tracking-widest text-[#64748b]">
              Loading registered teams…
            </p>
          </div>
        ) : sortedTeams.length === 0 ? (
          <div className="rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/80 py-24 text-center backdrop-blur-xl">
            <p className="text-sm font-black uppercase tracking-widest text-[#64748b]">
              No teams registered
            </p>
          </div>
        ) : (
          <>
            {/* Current Seeding Leaderboard */}
            <section className="mb-8 overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/90 backdrop-blur-xl">
              <div className="border-b border-[#1e1e3a] p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#f59e0b]">
                  Telemetry
                </p>
                <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-white">
                  Current Seeding
                </h2>
                {!groupStageComplete && (
                  <p className="mt-1.5 text-[12px] font-bold text-[#64748b]">
                    Live standings — playoff seeding locks in once all 12 Group Stage matches conclude.
                  </p>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <thead>
                    <tr className="border-b border-[#1e1e3a] bg-[#080812] text-[12px] font-black uppercase tracking-widest text-[#94a3b8]">
                      <th className="px-6 py-3 w-16">#</th>
                      <th className="px-6 py-3">Franchise</th>
                      <th className="px-4 py-3 text-center">Played</th>
                      <th className="px-4 py-3 text-center">Won</th>
                      <th className="px-4 py-3 text-center">Lost</th>
                      <th className="px-4 py-3 text-center">Round Diff</th>
                      <th className="px-6 py-3 text-center">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e1e3a] text-sm font-semibold">
                    {standings.map((s, i) => {
                      const isUpperBracket = groupStageComplete && i < 2;
                      const isLowerBracket = groupStageComplete && i >= 2 && i < 4;
                      const rankStyle = isUpperBracket
                        ? "border-l-4 border-l-[#34d399]"
                        : isLowerBracket
                        ? "border-l-4 border-l-[#fbbf24]"
                        : "border-l-4 border-l-transparent";

                      return (
                        <tr key={s.team.id} className={`transition hover:bg-[#080812]/70 ${rankStyle}`}>
                          <td className="px-6 py-3.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e1e3a] text-sm font-black text-white">
                              {i + 1}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <Link href={`/tournament/teams/${encodeURIComponent(s.team.id)}`} className="group flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#1e1e3a] bg-[#080812] group-hover:border-[#ff2d55]/60">
                                {s.team.logo ? (
                                  <Image src={s.team.logo} alt={s.team.name} width={36} height={36} unoptimized className="h-full w-full object-contain p-0.5" />
                                ) : (
                                  <span className="text-[11px] font-black text-[#94a3b8]">{s.team.tag.slice(0, 3)}</span>
                                )}
                              </div>
                              <div>
                                <p className="font-black uppercase text-white group-hover:text-[#ff4d6a] transition-colors">{s.team.name}</p>
                                <p className="text-[11px] font-bold uppercase text-[#64748b]">
                                  [{s.team.tag}]
                                  {isUpperBracket && <span className="ml-2 text-[#34d399]">● Advances to Q1</span>}
                                  {isLowerBracket && <span className="ml-2 text-[#fbbf24]">● Eliminator</span>}
                                </p>
                              </div>
                            </Link>
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-[#94a3b8]">{s.played}</td>
                          <td className="px-4 py-3.5 text-center font-black text-[#34d399]">{s.wins}</td>
                          <td className="px-4 py-3.5 text-center font-semibold text-[#ff4d6a]">{s.losses}</td>
                          <td className={`px-4 py-3.5 text-center font-bold ${s.roundDifference > 0 ? "text-[#34d399]" : s.roundDifference < 0 ? "text-[#ff4d6a]" : "text-[#94a3b8]"}`}>
                            {s.roundDifference > 0 ? `+${s.roundDifference}` : s.roundDifference}
                          </td>
                          <td className="px-6 py-3.5 text-center text-base font-black text-white">{s.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

          <div className="space-y-6">
            {sortedTeams.map((team, index) => {
              const captainClean = (team.captainRank || "").trim().toLowerCase();

              return (
                <Link
                  key={team.id}
                  href={`/tournament/teams/${team.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 backdrop-blur-xl transition hover:border-[#94a3b8]/50 hover:shadow-[0_0_30px_rgba(148,163,184,0.15)]"
                >
                <div className="flex flex-col lg:flex-row">
                  {/* Left: identity + stats */}
                  <div className="flex shrink-0 flex-col lg:w-80 lg:border-r lg:border-[#1e1e3a]">
                    <div className="flex items-center gap-4 border-b border-[#1e1e3a] p-5">
                      {/* Rank badge */}
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1e1e3a] text-base font-black text-white">
                        {index + 1}
                      </span>
                      {/* Logo / Avatar */}
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#1e1e3a] bg-[#030308]"
                        style={{ boxShadow: "inset 0 0 12px rgba(148,163,184,0.08)" }}
                      >
                        {team.logo ? (
                          <Image
                            src={team.logo}
                            alt={team.name}
                            width={56}
                            height={56}
                            unoptimized
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <span className="text-base font-black text-[#94a3b8]">
                            {initials(team.name)}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded border border-[#94a3b8]/40 bg-[#94a3b8]/10 px-2 py-0.5 text-[11px] font-black uppercase tracking-widest text-[#f1f5f9]">
                            SEED #{team.seed}
                          </span>
                          <span className="rounded border border-[#1e1e3a] bg-[#030308] px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#64748b]">
                            [{team.tag}]
                          </span>
                        </div>
                        <h2 className="mt-1.5 truncate text-lg font-black uppercase tracking-tight text-[#f1f5f9] group-hover:text-white">
                          {team.name}
                        </h2>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 border-b border-[#1e1e3a] bg-[#080812]/50 lg:border-b-0">
                      <TeamStatBox
                        label="Wins"
                        value={team.wins}
                        accent="text-[#34d399]"
                      />
                      <TeamStatBox
                        label="Losses"
                        value={team.losses}
                        accent="text-[#ff4d6a]"
                      />
                      <TeamStatBox
                        label="Players"
                        value={team.players.length}
                        accent="text-[#94a3b8]"
                      />
                    </div>
                  </div>

                  {/* Right: roster */}
                  <div className="flex-1">
                    {/* Roster Container */}
                    <div className="p-5">
                      {/* Captain Banner */}
                      {team.captainRank && (
                        <div className="mb-3.5 flex items-center justify-between rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-3 py-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-[#f59e0b]">★</span>
                            <span className="text-[11px] font-black uppercase tracking-wider text-[#f59e0b]">
                              CAPTAIN
                            </span>
                          </div>
                          <span className="text-sm font-black uppercase tracking-tight text-[#fbbf24]">
                            {team.captainRank}
                          </span>
                        </div>
                      )}

                      {/* Roster Grid */}
                      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-4">
                        {team.players.slice(0, 6).map((player, i) => {
                          const isCaptain =
                            (
                              captainClean &&
                              player.name &&
                              (captainClean.includes(player.name.toLowerCase()) ||
                                player.name.toLowerCase().includes(captainClean))
                            ) || (player.role ? /captain|igl/i.test(player.role) : false);

                          return (
                            <div
                              key={player.id || i}
                              className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-sm transition ${
                                isCaptain
                                  ? "border-[#f59e0b]/50 bg-[#f59e0b]/10 text-[#fbbf24] shadow-[0_0_12px_rgba(245,158,11,0.12)]"
                                  : "border-[#1e1e3a] bg-[#030308]/90 text-[#94a3b8] group-hover:border-[#2e2e5a]"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-black ${
                                    isCaptain
                                      ? "bg-[#f59e0b]/20 text-[#f59e0b]"
                                      : "bg-[#0c0c18] text-[#475569]"
                                  }`}
                                >
                                  {i + 1}
                                </span>
                                <span
                                  className={`truncate text-[13px] font-bold uppercase tracking-tight ${
                                    isCaptain ? "text-[#fbbf24]" : "text-[#f1f5f9]"
                                  }`}
                                >
                                  {player.name}
                                </span>
                              </div>

                              {isCaptain && (
                                <span className="ml-1 shrink-0 rounded bg-[#f59e0b]/25 px-1 py-0.5 text-[10px] font-black uppercase text-[#fbbf24]">
                                  ★ CPT
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                  {/* Integrated Card Footer */}
                  <div className="flex items-center justify-between border-t border-[#1e1e3a] bg-[#080812]/90 px-5 py-2.5 text-sm font-black tracking-widest text-[#94a3b8] transition-colors group-hover:bg-[#94a3b8]/15 group-hover:text-[#f1f5f9]">
                    <span className="text-[12px] uppercase">Roster Telemetry</span>
                    <span className="flex items-center gap-1 text-[13px]">
                      VIEW ROSTER{" "}
                      <span className="transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          </>
        )}
      </main>
    </div>
  );
}
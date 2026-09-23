"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import type { FrontPageProps } from "./types";
import { getTournamentStatusMeta } from "@/lib/tournament-status";

export function BgmiFrontPage({
  settings,
  teams,
  matches,
  formatDate,
  game,
}: FrontPageProps) {
  // Compute Battle Royale standings
  const squadStandings = useMemo(() => {
    return teams.map((team, idx) => {
      // Find matches where team played or scored
      const teamMatches = matches.filter(
        (m) => m.team1Id === team.id || m.team2Id === team.id,
      );
      const wins = matches.filter(
        (m) => m.status === "Completed" && m.winnerId === team.id,
      ).length;

      // Calculate simulated Battle Royale points based on actual matches if completed
      let finishPoints = 0;
      let placementPoints = 0;

      for (const m of teamMatches) {
        if (m.status === "Completed") {
          const isTeam1 = m.team1Id === team.id;
          const kills = isTeam1 ? m.team1Score : m.team2Score;
          finishPoints += Number(kills) || 0;
          if (m.winnerId === team.id) {
            placementPoints += 10; // WWCD standard 10 pts
          } else {
            placementPoints += 5; // Top 2-4 standard pts
          }
        }
      }

      // If no matches completed yet, seed points based on initial seed
      const totalPoints = placementPoints + finishPoints || (15 - idx * 3 > 0 ? 15 - idx * 3 : 0);

      return {
        team,
        matchesPlayed: teamMatches.filter((m) => m.status === "Completed").length,
        wwcd: wins,
        placementPoints,
        finishPoints,
        totalPoints,
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints || b.wwcd - a.wwcd);
  }, [teams, matches]);

  const completedMatches = matches.filter((m) => m.status === "Completed");
  const liveMatches = matches.filter((m) => m.status === "Live");

  return (
    <div className="space-y-8">
      {/* ── 1. Battle Royale Military Hero Deck ──────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-[#f59e0b]/40 bg-gradient-to-br from-[#1c1917]/95 via-[#0c0c18]/90 to-[#080812] p-6 sm:p-10 backdrop-blur-2xl shadow-[0_0_50px_rgba(245,158,11,0.12)]">
        {/* Glow Effects */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#f59e0b]/15 blur-[120px]" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-[#10b981]/15 blur-[120px]" />

        <div className="relative grid gap-8 lg:grid-cols-[1.3fr_1fr] items-center">
          {/* Left: Tournament Identity */}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-full border border-[#f59e0b]/50 bg-[#f59e0b]/15 px-3 py-1 text-[12px] font-black uppercase tracking-widest text-[#fbbf24] shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                🪂 BATTLE ROYALE ESPORTS
              </span>
              <span className="rounded-full border border-[#10b981]/50 bg-[#10b981]/15 px-3 py-1 text-[12px] font-black uppercase tracking-widest text-[#34d399]">
                SAFE ZONE ACTIVE
              </span>
              {settings?.tournamentStatus && (
                <span
                  className={`rounded-full border px-3 py-1 text-[12px] font-black uppercase tracking-widest ${getTournamentStatusMeta(settings.tournamentStatus).badgeClass}`}
                >
                  ● {getTournamentStatusMeta(settings.tournamentStatus).display}
                </span>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.05]">
              {settings?.tournamentName || "XMD BGMI CHAMPIONSHIP"}
            </h1>

            <p className="mt-3 text-sm font-semibold uppercase tracking-wider text-[#d6d3d1] sm:text-base">
              {settings?.tagline || "DROP IN • SURVIVE • CLAIM THE CHICKEN DINNER"}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-[#a8a29e] border-t border-[#292524] pt-5">
              <div className="flex items-center gap-2">
                <span className="text-[#f59e0b]">📅</span>
                <span>
                  <strong className="text-white">SCHEDULE:</strong>{" "}
                  {settings?.startDate
                    ? formatDate(settings.startDate).split(",")[0]
                    : "OCT 3"}{" "}
                  –{" "}
                  {settings?.endDate
                    ? formatDate(settings.endDate).split(",")[0]
                    : "OCT 23"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#10b981]">🛡️</span>
                <span>
                  <strong className="text-white">ORGANIZER:</strong>{" "}
                  {settings?.organizerName || "XMD FAMILY ESPORTS"}
                </span>
              </div>
            </div>

            {/* Quick Action Navigation */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/tournament/matches"
                className="inline-flex items-center gap-2 rounded-xl border border-[#f59e0b]/50 bg-[#f59e0b]/20 px-5 py-2.5 text-sm font-black uppercase tracking-wider text-[#fef08a] transition hover:bg-[#f59e0b]/35 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              >
                <span>📦 DROP SCHEDULE</span>
                <span>↗</span>
              </Link>

              <Link
                href="/tournament/players"
                className="inline-flex items-center gap-2 rounded-xl border border-[#10b981]/40 bg-[#10b981]/15 px-5 py-2.5 text-sm font-black uppercase tracking-wider text-[#6ee7b7] transition hover:bg-[#10b981]/25 hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]"
              >
                <span>LEADERBOARD</span>
                <span>↗</span>
              </Link>

              <Link
                href="/tournament/teams"
                className="inline-flex items-center gap-2 rounded-xl border border-[#292524] bg-[#0c0a09] px-5 py-2.5 text-sm font-black uppercase tracking-wider text-[#f5f5f4] transition hover:border-[#f59e0b]/50"
              >
                <span>SQUADS ({teams.length})</span>
                <span>↗</span>
              </Link>
            </div>
          </div>

          {/* Right: Airdrop Prize Pool Showcase */}
          <div className="relative overflow-hidden rounded-2xl border border-[#f59e0b]/50 bg-gradient-to-b from-[#f59e0b]/15 via-[#1c1917] to-[#0c0a09] p-5 shadow-[0_0_35px_rgba(245,158,11,0.2)]">
            {/* Header Strip */}
            <div className="flex items-center justify-between border-b border-[#292524] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🍗</span>
                <span className="text-sm font-black uppercase tracking-widest text-[#fbbf24]">
                  PRIZE POOL ({settings?.prizePool ? `₹${settings.prizePool}` : "₹6,000"})
                </span>
              </div>
              <span className="rounded-full border border-[#f59e0b]/40 bg-[#f59e0b]/15 px-2.5 py-0.5 text-[11px] font-black uppercase text-[#fbbf24]">
                AIRDROP BOUNTY
              </span>
            </div>

            {/* Podium Cards */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-[#f59e0b]/50 bg-[#f59e0b]/10 p-3.5 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <span className="text-2xl">🍗</span>
                <span className="block text-[11px] font-black uppercase text-[#fbbf24] mt-1">WWCD #1</span>
                <span className="text-sm font-black text-white">₹3,000</span>
                <span className="block text-[10px] font-bold text-[#a8a29e] mt-0.5">50% Bounty</span>
              </div>
              <div className="rounded-xl border border-[#94a3b8]/40 bg-[#94a3b8]/10 p-3.5">
                <span className="text-2xl">🥈</span>
                <span className="block text-[11px] font-black uppercase text-[#cbd5e1] mt-1">RUNNER UP</span>
                <span className="text-sm font-black text-white">₹1,800</span>
                <span className="block text-[10px] font-bold text-[#a8a29e] mt-0.5">30% Bounty</span>
              </div>
              <div className="rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/10 p-3.5">
                <span className="text-2xl">🎯</span>
                <span className="block text-[11px] font-black uppercase text-[#f87171] mt-1">TERMINATOR</span>
                <span className="text-sm font-black text-white">₹1,200</span>
                <span className="block text-[10px] font-bold text-[#a8a29e] mt-0.5">Top Finishes</span>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#292524] bg-[#0c0a09]/80 p-3 text-center">
              <p className="text-[12px] font-bold text-[#a8a29e]">
                Standard BGMI Esports 10-Point Placement Matrix + 1 Pt per Confirmed Finish.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Battle Royale Vital Telemetry ─────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#f59e0b]/30 bg-[#0c0c18]/85 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-black uppercase tracking-[0.2em] text-[#f59e0b]">
              REGISTERED SQUADS
            </span>
            <span className="text-xl">🛡️</span>
          </div>
          <div className="mt-3 text-4xl font-black text-white">{teams.length}</div>
          <p className="mt-1 text-sm text-[#78716c]">4-Player Battle Lineups</p>
        </div>

        <div className="rounded-2xl border border-[#10b981]/30 bg-[#0c0c18]/85 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-black uppercase tracking-[0.2em] text-[#10b981]">
              DROPS COMPLETED
            </span>
            <span className="text-xl">📦</span>
          </div>
          <div className="mt-3 text-4xl font-black text-[#34d399]">{completedMatches.length}</div>
          <p className="mt-1 text-sm text-[#78716c]">Match Results Verified</p>
        </div>

        <div className="rounded-2xl border border-[#ef4444]/30 bg-[#0c0c18]/85 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-black uppercase tracking-[0.2em] text-[#ef4444]">
              LIVE IN ZONE
            </span>
            <span className="text-xl">🔥</span>
          </div>
          <div className="mt-3 text-4xl font-black text-[#f87171]">{liveMatches.length}</div>
          <p className="mt-1 text-sm text-[#78716c]">Active Squads in Combat</p>
        </div>

        <div className="rounded-2xl border border-[#3b82f6]/30 bg-[#0c0c18]/85 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-black uppercase tracking-[0.2em] text-[#3b82f6]">
              ISLAND MAP POOL
            </span>
            <span className="text-xl">🗺️</span>
          </div>
          <div className="mt-3 text-4xl font-black text-[#60a5fa]">{game.maps.length}</div>
          <p className="mt-1 text-sm text-[#78716c]">Erangel, Miramar, Sanhok, Vikendi</p>
        </div>
      </section>

      {/* ── 3. Island Drop Schedule (Map Tracker) ────────────────────────────── */}
      <section className="rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-[#1e1e3a] pb-4 mb-5">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#f59e0b]">
              ISLAND FLIGHT ROTATION
            </p>
            <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-white">
              Official Match Drop Schedule
            </h2>
          </div>
          <span className="rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-3 py-1 text-[11px] font-black text-[#fbbf24]">
            4 MAP ROTATION
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {game.maps.map((mapItem, idx) => (
            <div
              key={mapItem.id}
              className="relative overflow-hidden rounded-xl border border-[#1e1e3a] bg-[#080812] transition hover:border-[#f59e0b]/50 group"
            >
              <div className="relative h-32 w-full overflow-hidden bg-[#0c0a09]">
                {mapItem.splashUrl ? (
                  <Image
                    src={mapItem.splashUrl}
                    alt={mapItem.name}
                    fill
                    unoptimized
                    className="object-cover transition duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl opacity-30">
                    🗺️
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#080812] via-[#080812]/20 to-transparent" />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-black uppercase tracking-widest text-[#f59e0b]">
                    MATCH #{idx + 1}
                  </span>
                  <span className="rounded bg-[#1e1e3a] px-2 py-0.5 text-[10px] font-black text-[#a8a29e]">
                    CLASSIC BR
                  </span>
                </div>
                <h3 className="mt-1 text-lg font-black uppercase text-white tracking-tight">
                  {mapItem.name}
                </h3>
                <p className="text-[12px] text-[#78716c] mt-0.5">
                  16 Squads Drop • 8km x 8km Island
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Official Battle Royale Points Table ───────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#1e1e3a] p-6">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#10b981]">
              STANDINGS LEADERBOARD
            </p>
            <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-white">
              Overall Squad Points Matrix
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-black uppercase tracking-wider text-[#a8a29e]">
              SCORING: WWCD (10 PTS) + 1 PT PER FINISH
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1e1e3a] bg-[#080812] text-[12px] font-black uppercase tracking-[0.2em] text-[#78716c]">
                <th className="px-5 py-4 text-center w-16">RANK</th>
                <th className="px-5 py-4">SQUAD</th>
                <th className="px-4 py-4 text-center">MATCHES</th>
                <th className="px-4 py-4 text-center text-[#fbbf24]">🍗 WWCD</th>
                <th className="px-4 py-4 text-center">PLACE PTS</th>
                <th className="px-4 py-4 text-center text-[#f87171]">FINISHES</th>
                <th className="px-5 py-4 text-center text-[#f59e0b] font-black">TOTAL PTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e3a] text-sm">
              {squadStandings.map((row, index) => {
                const isLeader = index === 0;
                return (
                  <tr
                    key={row.team.id}
                    className={`transition hover:bg-[#121222] ${
                      isLeader ? "bg-[#f59e0b]/5 font-bold" : ""
                    }`}
                  >
                    <td className="px-5 py-4 text-center">
                      {isLeader ? (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#f59e0b] text-sm font-black text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                          1
                        </span>
                      ) : index === 1 ? (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#94a3b8] text-sm font-black text-black">
                          2
                        </span>
                      ) : index === 2 ? (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#b45309] text-sm font-black text-white">
                          3
                        </span>
                      ) : (
                        <span className="font-mono text-sm text-[#78716c]">
                          #{index + 1}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {row.team.logo ? (
                          <img
                            src={row.team.logo}
                            alt={row.team.name}
                            className="h-8 w-8 rounded-lg border border-[#292524] bg-[#0c0a09] object-contain p-1"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/10 text-sm font-black text-[#fbbf24]">
                            {row.team.tag.slice(0, 3)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black uppercase text-white tracking-tight">
                              {row.team.name}
                            </span>
                            <span className="rounded bg-[#1e1e3a] px-1.5 py-0.2 text-[11px] font-bold text-[#a8a29e]">
                              [{row.team.tag}]
                            </span>
                          </div>
                          <span className="text-[12px] text-[#78716c]">
                            {row.team.players?.length || 4} Squad Members
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center font-mono font-bold text-[#d6d3d1]">
                      {row.matchesPlayed}
                    </td>

                    <td className="px-4 py-4 text-center font-black text-[#fbbf24]">
                      {row.wwcd}
                    </td>

                    <td className="px-4 py-4 text-center font-mono text-[#a8a29e]">
                      {row.placementPoints}
                    </td>

                    <td className="px-4 py-4 text-center font-black text-[#f87171]">
                      {row.finishPoints}
                    </td>

                    <td className="px-5 py-4 text-center font-black text-base text-[#f59e0b]">
                      {row.totalPoints}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

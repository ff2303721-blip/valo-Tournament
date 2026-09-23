"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { FrontPageProps } from "./types";
import { getTournamentStatusMeta } from "@/lib/tournament-status";

export function RocketLeagueFrontPage({
  settings,
  teams,
  matches,
  standings,
  formatDate,
  game,
}: FrontPageProps) {
  const completedMatches = matches.filter((m) => m.status === "Completed");

  return (
    <div className="space-y-8">
      {/* ── 1. RLCS Arena Hero Deck ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-[#0ea5e9]/40 bg-gradient-to-br from-[#0c4a6e]/90 via-[#0c0c18]/90 to-[#431407]/90 p-6 sm:p-10 backdrop-blur-2xl shadow-[0_0_50px_rgba(14,165,233,0.15)]">
        {/* Glow Effects - Blue vs Orange */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[#0ea5e9]/20 blur-[130px]" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-[#f97316]/20 blur-[130px]" />

        <div className="relative grid gap-8 lg:grid-cols-[1.3fr_1fr] items-center">
          {/* Left: Tournament Identity */}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-full border border-[#0ea5e9]/50 bg-[#0ea5e9]/15 px-3 py-1 text-[12px] font-black uppercase tracking-widest text-[#94a3b8] shadow-[0_0_15px_rgba(14,165,233,0.25)]">
                ⚽ RLCS ARENA SERIES
              </span>
              <span className="rounded-full border border-[#f97316]/50 bg-[#f97316]/15 px-3 py-1 text-[12px] font-black uppercase tracking-widest text-[#fb923c]">
                5-MIN REGULATION + GOLDEN GOAL
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
              {settings?.tournamentName || "ROCKET LEAGUE CHAMPIONSHIP"}
            </h1>

            <p className="mt-3 text-sm font-semibold uppercase tracking-wider text-[#cbd5e1] sm:text-base">
              {settings?.tagline || "AERIALS • SAVES • HIGH-OCTANE VEHICULAR SOCCER"}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-[#94a3b8] border-t border-[#1e293b] pt-5">
              <div className="flex items-center gap-2">
                <span className="text-[#0ea5e9]">📅</span>
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
                <span className="text-[#f97316]">🛡️</span>
                <span>
                  <strong className="text-white">ORGANIZER:</strong>{" "}
                  {settings?.organizerName || "RLCS COMMUNITY LEAGUE"}
                </span>
              </div>
            </div>

            {/* Quick Action Navigation */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/tournament/matches"
                className="inline-flex items-center gap-2 rounded-xl border border-[#0ea5e9]/50 bg-[#0ea5e9]/20 px-5 py-2.5 text-sm font-black uppercase tracking-wider text-[#bae6fd] transition hover:bg-[#0ea5e9]/35 hover:shadow-[0_0_20px_rgba(14,165,233,0.3)]"
              >
                <span>ARENA FIXTURES</span>
                <span>↗</span>
              </Link>

              <Link
                href="/tournament/matches"
                className="inline-flex items-center gap-2 rounded-xl border border-[#f97316]/50 bg-[#f97316]/20 px-5 py-2.5 text-sm font-black uppercase tracking-wider text-[#fed7aa] transition hover:bg-[#f97316]/35 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]"
              >
                <span>PLAYOFF BRACKET</span>
                <span>↗</span>
              </Link>

              <Link
                href="/tournament/players"
                className="inline-flex items-center gap-2 rounded-xl border border-[#1e293b] bg-[#0c0a09] px-5 py-2.5 text-sm font-black uppercase tracking-wider text-[#f1f5f9] transition hover:border-[#0ea5e9]/50"
              >
                <span>STRIKER TELEMETRY</span>
                <span>↗</span>
              </Link>
            </div>
          </div>

          {/* Right: RLCS Prize Pool Showcase */}
          <div className="relative overflow-hidden rounded-2xl border border-[#0ea5e9]/50 bg-gradient-to-b from-[#0c4a6e]/40 via-[#080812] to-[#431407]/40 p-5 shadow-[0_0_35px_rgba(14,165,233,0.2)]">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚽</span>
                <span className="text-sm font-black uppercase tracking-widest text-[#94a3b8]">
                  ARENA PRIZE POOL ({settings?.prizePool ? `₹${settings.prizePool}` : "₹6,000"})
                </span>
              </div>
              <span className="rounded-full border border-[#f97316]/40 bg-[#f97316]/15 px-2.5 py-0.5 text-[11px] font-black uppercase text-[#fb923c]">
                RLCS BOUNTY
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-[#f59e0b]/50 bg-[#f59e0b]/10 p-3.5 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <span className="text-2xl">🏆</span>
                <span className="block text-[11px] font-black uppercase text-[#fbbf24] mt-1">CHAMPIONS</span>
                <span className="text-sm font-black text-white">₹3,000</span>
                <span className="block text-[10px] font-bold text-[#94a3b8] mt-0.5">Blue/Orange Cup</span>
              </div>
              <div className="rounded-xl border border-[#94a3b8]/40 bg-[#94a3b8]/10 p-3.5">
                <span className="text-2xl">🥈</span>
                <span className="block text-[11px] font-black uppercase text-[#cbd5e1] mt-1">FINALIST</span>
                <span className="text-sm font-black text-white">₹1,800</span>
                <span className="block text-[10px] font-bold text-[#94a3b8] mt-0.5">Runners Up</span>
              </div>
              <div className="rounded-xl border border-[#0ea5e9]/50 bg-[#0ea5e9]/10 p-3.5">
                <span className="text-2xl">⚡</span>
                <span className="block text-[11px] font-black uppercase text-[#94a3b8] mt-1">STRIKER MVP</span>
                <span className="text-sm font-black text-white">₹1,200</span>
                <span className="block text-[10px] font-bold text-[#94a3b8] mt-0.5">Most Goals</span>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#1e293b] bg-[#080812]/80 p-3 text-center">
              <p className="text-[12px] font-bold text-[#94a3b8]">
                3v3 High-Octane Matches • Standard 5-Minute Timed Series • Sudden Death OT
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Official Stadium Rotations ────────────────────────────────────── */}
      <section className="rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-[#1e1e3a] pb-4 mb-5">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#0ea5e9]">
              STADIUM PITCH ROTATION
            </p>
            <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-white">
              Official Competitive Arenas ({game.maps.length} Stadiums)
            </h2>
          </div>
          <span className="rounded-full border border-[#0ea5e9]/30 bg-[#0ea5e9]/10 px-3 py-1 text-[11px] font-black text-[#94a3b8]">
            REGULATION PITCHES
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {game.maps.map((arena) => (
            <div
              key={arena.id}
              className="rounded-xl border border-[#1e1e3a] bg-[#080812] p-4 text-center transition hover:border-[#0ea5e9]/60 group"
            >
              <span className="text-2xl">🏟️</span>
              <h4 className="mt-2 text-sm font-black uppercase text-white tracking-wider">
                {arena.name}
              </h4>
              <span className="mt-1 inline-block rounded bg-[#1e1e3a] px-2 py-0.5 text-[10px] font-bold text-[#64748b] group-hover:text-[#94a3b8]">
                STANDARD SOCAR
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Standings Leaderboard ─────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-[#1e1e3a] p-6">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#0ea5e9]">
              SERIES STANDINGS
            </p>
            <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-white">
              Franchise Pitch Standings & Goal Differential
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1e1e3a] bg-[#080812] text-[12px] font-black uppercase tracking-[0.2em] text-[#64748b]">
                <th className="px-5 py-4 text-center w-16">#</th>
                <th className="px-5 py-4">TEAM</th>
                <th className="px-4 py-4 text-center">SERIES PLAYED</th>
                <th className="px-4 py-4 text-center text-[#34d399]">W - L</th>
                <th className="px-4 py-4 text-center">GOAL DIFF</th>
                <th className="px-5 py-4 text-center text-[#0ea5e9] font-black">POINTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e3a] text-sm">
              {standings.map((row, index) => (
                <tr key={row.team.id} className="transition hover:bg-[#121222]">
                  <td className="px-5 py-4 text-center font-bold text-[#94a3b8]">
                    #{index + 1}
                  </td>
                  <td className="px-5 py-4 font-black uppercase text-white">
                    {row.team.name} [{row.team.tag}]
                  </td>
                  <td className="px-4 py-4 text-center font-mono">{row.played}</td>
                  <td className="px-4 py-4 text-center font-black text-[#34d399]">
                    {row.wins} - {row.losses}
                  </td>
                  <td className="px-4 py-4 text-center font-mono">
                    {row.roundDifference > 0 ? `+${row.roundDifference}` : row.roundDifference}
                  </td>
                  <td className="px-5 py-4 text-center font-black text-base text-[#0ea5e9]">
                    {row.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

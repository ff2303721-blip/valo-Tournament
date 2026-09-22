"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import type { FrontPageProps } from "./types";

export function Cs2FrontPage({
  settings,
  teams,
  matches,
  standings,
  formatDate,
  game,
}: FrontPageProps) {
  const completedMatches = matches.filter((m) => m.status === "Completed");
  const liveMatches = matches.filter((m) => m.status === "Live");

  return (
    <div className="space-y-8">
      {/* ── 1. CS2 Premier Major Hero Deck ───────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-[#3b82f6]/40 bg-gradient-to-br from-[#0f172a]/95 via-[#0c0c18]/90 to-[#080812] p-6 sm:p-10 backdrop-blur-2xl shadow-[0_0_50px_rgba(59,130,246,0.12)]">
        {/* Glow Effects */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#3b82f6]/15 blur-[120px]" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-[#eab308]/15 blur-[120px]" />

        <div className="relative grid gap-8 lg:grid-cols-[1.3fr_1fr] items-center">
          {/* Left: Tournament Identity */}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-full border border-[#3b82f6]/50 bg-[#3b82f6]/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#60a5fa] shadow-[0_0_15px_rgba(59,130,246,0.25)]">
                💣 VALVE PREMIER CS2
              </span>
              <span className="rounded-full border border-[#eab308]/50 bg-[#eab308]/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#fde047]">
                MR12 REGULATION + OT
              </span>
              {settings?.tournamentStatus && (
                <span className="rounded-full border border-[#10b981]/40 bg-[#10b981]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#34d399]">
                  ● {settings.tournamentStatus.toUpperCase()}
                </span>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.05]">
              {settings?.tournamentName || "COUNTER-STRIKE 2 MAJOR"}
            </h1>

            <p className="mt-3 text-sm font-semibold uppercase tracking-wider text-[#94a3b8] sm:text-base">
              {settings?.tagline || "DEFUSE • RETAKE • BECOME MAJOR CHAMPIONS"}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-[#94a3b8] border-t border-[#1e293b] pt-5">
              <div className="flex items-center gap-2">
                <span className="text-[#3b82f6]">📅</span>
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
                <span className="text-[#eab308]">🛡️</span>
                <span>
                  <strong className="text-white">ORGANIZER:</strong>{" "}
                  {settings?.organizerName || "PREMIER ESPORTS LEAGUE"}
                </span>
              </div>
            </div>

            {/* Quick Action Navigation */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/tournament/matches"
                className="inline-flex items-center gap-2 rounded-xl border border-[#3b82f6]/50 bg-[#3b82f6]/20 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#bfdbfe] transition hover:bg-[#3b82f6]/35 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
              >
                <span>MATCH CENTER</span>
                <span>↗</span>
              </Link>

              <Link
                href="/tournament/bracket"
                className="inline-flex items-center gap-2 rounded-xl border border-[#eab308]/40 bg-[#eab308]/15 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#fef08a] transition hover:bg-[#eab308]/25 hover:shadow-[0_0_20px_rgba(234,179,8,0.25)]"
              >
                <span>MAJOR BRACKET</span>
                <span>↗</span>
              </Link>

              <Link
                href="/tournament/players"
                className="inline-flex items-center gap-2 rounded-xl border border-[#1e293b] bg-[#0c0a09] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#f1f5f9] transition hover:border-[#3b82f6]/50"
              >
                <span>HLTV 2.0 STATS</span>
                <span>↗</span>
              </Link>
            </div>
          </div>

          {/* Right: Major Prize Pool Showcase */}
          <div className="relative overflow-hidden rounded-2xl border border-[#3b82f6]/50 bg-gradient-to-b from-[#3b82f6]/15 via-[#0f172a] to-[#080812] p-5 shadow-[0_0_35px_rgba(59,130,246,0.2)]">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <span className="text-xs font-black uppercase tracking-widest text-[#60a5fa]">
                  MAJOR PRIZE POOL ({settings?.prizePool ? `₹${settings.prizePool}` : "₹6,000"})
                </span>
              </div>
              <span className="rounded-full border border-[#3b82f6]/40 bg-[#3b82f6]/15 px-2.5 py-0.5 text-[9px] font-black uppercase text-[#60a5fa]">
                OFFICIAL TROPHY
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-[#eab308]/50 bg-[#eab308]/10 p-3.5 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
                <span className="text-2xl">🏆</span>
                <span className="block text-[9px] font-black uppercase text-[#fde047] mt-1">CHAMPIONS</span>
                <span className="text-sm font-black text-white">₹3,000</span>
                <span className="block text-[8px] font-bold text-[#94a3b8] mt-0.5">Major Trophy</span>
              </div>
              <div className="rounded-xl border border-[#94a3b8]/40 bg-[#94a3b8]/10 p-3.5">
                <span className="text-2xl">🥈</span>
                <span className="block text-[9px] font-black uppercase text-[#cbd5e1] mt-1">FINALIST</span>
                <span className="text-sm font-black text-white">₹1,800</span>
                <span className="block text-[8px] font-bold text-[#94a3b8] mt-0.5">Silver Medal</span>
              </div>
              <div className="rounded-xl border border-[#3b82f6]/40 bg-[#3b82f6]/10 p-3.5">
                <span className="text-2xl">🌟</span>
                <span className="block text-[9px] font-black uppercase text-[#93c5fd] mt-1">MAJOR MVP</span>
                <span className="text-sm font-black text-white">₹1,200</span>
                <span className="block text-[8px] font-bold text-[#94a3b8] mt-0.5">HLTV Rating</span>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#1e293b] bg-[#080812]/80 p-3 text-center">
              <p className="text-[10px] font-bold text-[#94a3b8]">
                Valve Active Duty Pool • BO1 Group Fixtures • BO3 Grand Final Decider
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Active Duty Map Pool Veto Grid ────────────────────────────────── */}
      <section className="rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-[#1e1e3a] pb-4 mb-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#3b82f6]">
              VALVE OFFICIAL POOL
            </p>
            <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-white">
              Active Duty Map Pool Veto ({game.maps.length} Maps)
            </h2>
          </div>
          <span className="rounded-full border border-[#3b82f6]/30 bg-[#3b82f6]/10 px-3 py-1 text-[9px] font-black text-[#60a5fa]">
            ACTIVE DUTY
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {game.maps.map((mapItem) => (
            <div
              key={mapItem.id}
              className="rounded-xl border border-[#1e1e3a] bg-[#080812] p-3 text-center transition hover:border-[#3b82f6]/60 group"
            >
              <span className="text-xl">🗺️</span>
              <h4 className="mt-2 text-xs font-black uppercase text-white tracking-wider">
                {mapItem.name}
              </h4>
              <span className="mt-1 inline-block rounded bg-[#1e1e3a] px-1.5 py-0.5 text-[8px] font-bold text-[#64748b] group-hover:text-[#60a5fa]">
                COMPETITIVE
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Standings Leaderboard ─────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-[#1e1e3a] p-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#3b82f6]">
              MAJOR STANDINGS
            </p>
            <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-white">
              Group Stage Round & Point Differential
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1e1e3a] bg-[#080812] text-[10px] font-black uppercase tracking-[0.2em] text-[#64748b]">
                <th className="px-5 py-4 text-center w-16">#</th>
                <th className="px-5 py-4">TEAM</th>
                <th className="px-4 py-4 text-center">PLAYED</th>
                <th className="px-4 py-4 text-center text-[#34d399]">W - L</th>
                <th className="px-4 py-4 text-center">ROUND DIFF</th>
                <th className="px-5 py-4 text-center text-[#3b82f6] font-black">PTS</th>
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
                  <td className="px-5 py-4 text-center font-black text-base text-[#3b82f6]">
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

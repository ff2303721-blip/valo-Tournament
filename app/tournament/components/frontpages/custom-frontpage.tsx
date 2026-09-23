"use client";

import Link from "next/link";
import Image from "next/image";
import type { FrontPageProps } from "./types";
import { getTournamentStatusMeta } from "@/lib/tournament-status";
import { StatusBadge } from "../ui/status-badge";

export function CustomFrontPage({
  settings,
  teams,
  matches,
  standings,
  formatDate,
  game,
}: FrontPageProps) {
  const completed = matches.filter((m) => m.status === "Completed");
  const live = matches.filter((m) => m.status === "Live");
  const scheduled = matches.filter((m) => m.status === "Scheduled");

  const nextMatch = [...scheduled].sort(
    (a, b) =>
      new Date(a.scheduledAt || "9999").getTime() -
      new Date(b.scheduledAt || "9999").getTime(),
  )[0];
  const activeLive = live[0];

  const nextMatchTeam1 = nextMatch
    ? teams.find((t) => t.id === nextMatch.team1Id)
    : null;
  const nextMatchTeam2 = nextMatch
    ? teams.find((t) => t.id === nextMatch.team2Id)
    : null;

  const gameTitle = settings?.gameCustomName || game.name;

  return (
    <div className="space-y-8">
      {/* ── 1. Custom Community Championship Hero Deck ────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-[#a855f7]/40 bg-gradient-to-br from-[#2e1065]/90 via-[#0c0c18]/90 to-[#080812] p-6 sm:p-10 backdrop-blur-2xl shadow-[0_0_50px_rgba(168,85,247,0.15)]">
        {/* Glow Effects */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[#a855f7]/20 blur-[130px]" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-[#94a3b8]/20 blur-[130px]" />

        <div className="relative grid gap-8 lg:grid-cols-[1.3fr_1fr] items-center">
          {/* Left: Tournament Identity */}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-full border border-[#a855f7]/50 bg-[#a855f7]/15 px-3 py-1 text-[12px] font-black uppercase tracking-widest text-[#f1f5f9] shadow-[0_0_15px_rgba(168,85,247,0.25)]">
                🎮 COMMUNITY ESPORTS
              </span>
              <span className="rounded-full border border-[#94a3b8]/50 bg-[#94a3b8]/15 px-3 py-1 text-[12px] font-black uppercase tracking-widest text-[#f1f5f9]">
                {gameTitle.toUpperCase()}
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
              {settings?.tournamentName || `${gameTitle.toUpperCase()} INVITATIONAL`}
            </h1>

            <p className="mt-3 text-sm font-semibold uppercase tracking-wider text-[#cbd5e1] sm:text-base">
              {settings?.tagline || "COMPETE • CONQUER • CROWN THE ULTIMATE CHAMPIONS"}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-[#94a3b8] border-t border-[#1e293b] pt-5">
              <div className="flex items-center gap-2">
                <span className="text-[#a855f7]">📅</span>
                <span>
                  <strong className="text-white">SCHEDULE:</strong>{" "}
                  {settings?.startDate
                    ? formatDate(settings.startDate).split(",")[0]
                    : "ACTIVE"}{" "}
                  –{" "}
                  {settings?.endDate
                    ? formatDate(settings.endDate).split(",")[0]
                    : "FINALS"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#94a3b8]">🛡️</span>
                <span>
                  <strong className="text-white">ORGANIZER:</strong>{" "}
                  {settings?.organizerName || "COMMUNITY HOST"}
                </span>
              </div>
            </div>

            {/* Quick Action Navigation */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/tournament/matches"
                className="inline-flex items-center gap-2 rounded-xl border border-[#a855f7]/50 bg-[#a855f7]/20 px-5 py-2.5 text-sm font-black uppercase tracking-wider text-[#f1f5f9] transition hover:bg-[#a855f7]/35 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
              >
                <span>BRACKET</span>
                <span>↗</span>
              </Link>

              <Link
                href="/tournament/matches"
                className="inline-flex items-center gap-2 rounded-xl border border-[#94a3b8]/40 bg-[#94a3b8]/15 px-5 py-2.5 text-sm font-black uppercase tracking-wider text-[#f1f5f9] transition hover:bg-[#94a3b8]/25 hover:shadow-[0_0_20px_rgba(148,163,184,0.25)]"
              >
                <span>MATCHES</span>
                <span>↗</span>
              </Link>

              <Link
                href="/tournament/teams"
                className="inline-flex items-center gap-2 rounded-xl border border-[#1e1e3a] bg-[#080812] px-5 py-2.5 text-sm font-black uppercase tracking-wider text-[#f1f5f9] transition hover:border-[#a855f7]/50"
              >
                <span>TEAMS</span>
                <span>↗</span>
              </Link>
            </div>
          </div>

          {/* Right: Prize Pool Podium */}
          <div className="relative overflow-hidden rounded-2xl border border-[#a855f7]/40 bg-gradient-to-b from-[#a855f7]/20 via-[#0c0c18] to-[#080812] p-5 shadow-[0_0_35px_rgba(168,85,247,0.2)]">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <span className="text-sm font-black uppercase tracking-widest text-[#fde047]">
                  PRIZE POOL ({settings?.prizePool ? `₹${settings.prizePool}` : "GLORY & REWARDS"})
                </span>
              </div>
              <span className="rounded-full border border-[#a855f7]/50 bg-[#a855f7]/20 px-2.5 py-0.5 text-[11px] font-black uppercase text-[#e9d5ff]">
                STANDINGS REWARD
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
              <div className="rounded-xl border border-[#f59e0b]/50 bg-gradient-to-b from-[#f59e0b]/20 to-[#0c0c18] p-3 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                <span className="text-2xl">🥇</span>
                <span className="block text-[11px] font-black uppercase tracking-wider text-[#fbbf24] mt-1">
                  1ST PLACE
                </span>
                <span className="text-sm font-black text-white">CHAMPIONS</span>
              </div>
              <div className="rounded-xl border border-[#94a3b8]/40 bg-gradient-to-b from-[#94a3b8]/15 to-[#0c0c18] p-3">
                <span className="text-2xl">🥈</span>
                <span className="block text-[11px] font-black uppercase tracking-wider text-[#cbd5e1] mt-1">
                  2ND PLACE
                </span>
                <span className="text-sm font-black text-white">RUNNER UP</span>
              </div>
              <div className="rounded-xl border border-[#a855f7]/40 bg-gradient-to-b from-[#a855f7]/15 to-[#0c0c18] p-3">
                <span className="text-2xl">🎖️</span>
                <span className="block text-[11px] font-black uppercase tracking-wider text-[#f1f5f9] mt-1">
                  MVP
                </span>
                <span className="text-sm font-black text-white">STAR PLAYER</span>
              </div>
            </div>
          </div>
        </div>

        {/* Announcement ticker if set */}
        {settings?.announcement && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-[#a855f7]/40 bg-[#a855f7]/15 p-3.5 text-sm text-[#e9d5ff]">
            <span className="text-base font-black">📢</span>
            <span className="font-bold">{settings.announcement}</span>
          </div>
        )}
      </section>

      {/* ── 2. High-Impact Metrics Grid ──────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-[#a855f7]/30 bg-[#0c0c18]/85 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-black uppercase tracking-[0.25em] text-[#f1f5f9]">
              REGISTERED TEAMS
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#a855f7]/40 bg-[#a855f7]/10 text-sm">
              🛡️
            </span>
          </div>
          <div className="mt-3 text-3xl font-black text-white">{teams.length}</div>
          <p className="mt-1 text-[12px] font-bold uppercase tracking-wider text-[#64748b]">
            Competing Rosters
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-[#10b981]/30 bg-[#0c0c18]/85 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-black uppercase tracking-[0.25em] text-[#34d399]">
              COMPLETED MATCHES
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#10b981]/40 bg-[#10b981]/10 text-sm">
              ⚔️
            </span>
          </div>
          <div className="mt-3 text-3xl font-black text-white">{completed.length}</div>
          <p className="mt-1 text-[12px] font-bold uppercase tracking-wider text-[#64748b]">
            Results Logged
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-[#ff2d55]/30 bg-[#0c0c18]/85 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-black uppercase tracking-[0.25em] text-[#ff4d6a]">
              LIVE NOW
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#ff2d55]/40 bg-[#ff2d55]/10 text-sm">
              🔴
            </span>
          </div>
          <div className="mt-3 text-3xl font-black text-[#ff4d6a]">{live.length}</div>
          <p className="mt-1 text-[12px] font-bold uppercase tracking-wider text-[#64748b]">
            {live.length > 0 ? "Matches In Progress" : "No Matches Live"}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-[#94a3b8]/30 bg-[#0c0c18]/85 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-black uppercase tracking-[0.25em] text-[#f1f5f9]">
              UPCOMING
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#94a3b8]/40 bg-[#94a3b8]/10 text-sm">
              ⏱️
            </span>
          </div>
          <div className="mt-3 text-xl font-black text-white">
            {scheduled.length > 0 ? (
              nextMatch?.scheduledAt ? (
                formatDate(nextMatch.scheduledAt).split(",")[0]
              ) : (
                "Scheduled"
              )
            ) : (
              "None"
            )}
          </div>
          <p className="mt-1 text-[12px] font-bold uppercase tracking-wider text-[#94a3b8]">
            {scheduled.length} Scheduled
          </p>
        </div>
      </section>

      {/* ── 3. Featured Upcoming / Live Clash ─────────────────────────────────── */}
      {(activeLive || nextMatch) && (
        <section className="relative overflow-hidden rounded-3xl border border-[#1e1e3a] bg-[#0c0c18]/90 p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_40px_rgba(168,85,247,0.08)]">
          <div className="flex items-center justify-between border-b border-[#1e1e3a] pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 items-center justify-center rounded-lg border border-[#1e1e3a] bg-[#080812] px-2.5 text-sm font-black text-white">
                M{String((activeLive || nextMatch)!.matchNumber).padStart(2, "0")}
              </span>
              <span className="rounded-lg border border-[#a855f7]/40 bg-[#a855f7]/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#f1f5f9]">
                {(activeLive || nextMatch)!.stage}
              </span>
              <span className="rounded-lg border border-[#1e1e3a] bg-[#080812] px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#94a3b8]">
                {(activeLive || nextMatch)!.map || "Standard Arena"} • BO{(activeLive || nextMatch)!.bestOf}
              </span>
            </div>

            <StatusBadge status={(activeLive || nextMatch)!.status} />
          </div>

          <div className="mt-6 grid items-center gap-6 grid-cols-1 md:grid-cols-[1fr_auto_1fr]">
            {/* Team 1 */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18] shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                {nextMatchTeam1?.logo ? (
                  <Image
                    src={nextMatchTeam1.logo}
                    alt={nextMatchTeam1.name}
                    width={56}
                    height={56}
                    unoptimized
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <span className="text-sm font-black text-[#a855f7]">
                    {(nextMatchTeam1?.tag ?? "TBD").slice(0, 3)}
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
                  {nextMatchTeam1?.name ?? "TBD"}
                </h4>
                <p className="mt-0.5 text-sm font-bold text-[#64748b]">
                  [{nextMatchTeam1?.tag ?? "TBD"}] • Seed #{nextMatchTeam1?.seed ?? "—"}
                </p>
              </div>
            </div>

            {/* Center Hub */}
            <div className="flex flex-col items-center justify-center py-2 md:py-0 px-6">
              <div className="rounded-2xl border border-[#a855f7]/40 bg-[#a855f7]/15 px-5 py-2 text-sm font-black tracking-widest text-[#f1f5f9] shadow-[0_0_20px_rgba(168,85,247,0.25)]">
                VS
              </div>
              <span className="mt-2 text-sm font-black uppercase tracking-wider text-[#a855f7]">
                {formatDate((activeLive || nextMatch)!.scheduledAt)}
              </span>
            </div>

            {/* Team 2 */}
            <div className="flex items-center gap-4 md:flex-row-reverse md:text-right">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18] shadow-[0_0_20px_rgba(148,163,184,0.15)]">
                {nextMatchTeam2?.logo ? (
                  <Image
                    src={nextMatchTeam2.logo}
                    alt={nextMatchTeam2.name}
                    width={56}
                    height={56}
                    unoptimized
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <span className="text-sm font-black text-[#94a3b8]">
                    {(nextMatchTeam2?.tag ?? "TBD").slice(0, 3)}
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
                  {nextMatchTeam2?.name ?? "TBD"}
                </h4>
                <p className="mt-0.5 text-sm font-bold text-[#64748b]">
                  [{nextMatchTeam2?.tag ?? "TBD"}] • Seed #{nextMatchTeam2?.seed ?? "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-[#1e1e3a] pt-4">
            <span className="text-sm text-[#64748b]">
              Head-to-head match telemetrics
            </span>
            <Link
              href={`/tournament/matches/${encodeURIComponent((activeLive || nextMatch)!.id)}`}
              className="inline-flex items-center gap-2 rounded-xl border border-[#a855f7]/40 bg-[#a855f7]/10 px-4 py-2 text-sm font-black uppercase tracking-wider text-[#f1f5f9] transition hover:bg-[#a855f7]/20"
            >
              <span>VIEW MATCH DETAILS</span>
              <span>→</span>
            </Link>
          </div>
        </section>
      )}

      {/* ── 4. Community Arena Standings Table ────────────────────────────────── */}
      <section className="overflow-hidden rounded-3xl border border-[#1e1e3a] bg-[#0c0c18]/90 backdrop-blur-xl">
        <div className="border-b border-[#1e1e3a] p-6 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#a855f7]">
              RANKINGS & LEADERBOARD
            </p>
            <h3 className="mt-1 text-2xl font-black uppercase tracking-tight text-white">
              Tournament Standings
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead>
              <tr className="border-b border-[#1e1e3a] bg-[#080812] text-[12px] font-black uppercase tracking-widest text-[#64748b]">
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Team</th>
                <th className="px-4 py-4 text-center">Played</th>
                <th className="px-4 py-4 text-center">Won</th>
                <th className="px-4 py-4 text-center">Lost</th>
                <th className="px-4 py-4 text-center">Score Diff</th>
                <th className="px-6 py-4 text-center">Total Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e3a] text-sm font-semibold">
              {standings.map((s, i) => (
                <tr
                  key={s.team.id}
                  className={`transition hover:bg-[#080812]/70 ${
                    i === 0
                      ? "border-l-4 border-l-[#f59e0b] bg-[#f59e0b]/5"
                      : i === 1
                      ? "border-l-4 border-l-[#94a3b8] bg-[#94a3b8]/5"
                      : i === 2
                      ? "border-l-4 border-l-[#a855f7] bg-[#a855f7]/5"
                      : "border-l-4 border-l-[#1e1e3a]"
                  }`}
                >
                  <td className="px-6 py-4">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm font-black ${
                        i === 0
                          ? "bg-[#f59e0b]/20 text-[#fbbf24]"
                          : i === 1
                          ? "bg-[#94a3b8]/20 text-[#94a3b8]"
                          : i === 2
                          ? "bg-[#a855f7]/20 text-[#f1f5f9]"
                          : "bg-[#1e1e3a] text-[#64748b]"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <Link
                      href={`/tournament/teams/${encodeURIComponent(s.team.id)}`}
                      className="group flex items-center gap-3.5"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#1e1e3a] bg-[#080812] group-hover:border-[#a855f7]">
                        {s.team.logo ? (
                          <Image
                            src={s.team.logo}
                            alt={s.team.name}
                            width={40}
                            height={40}
                            unoptimized
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <span className="text-sm font-black text-[#a855f7]">
                            {s.team.tag.slice(0, 3)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-black uppercase text-white group-hover:text-[#a855f7] transition-colors">
                          {s.team.name}
                        </p>
                        <p className="text-[12px] font-bold uppercase text-[#64748b]">
                          [{s.team.tag}] • Seed #{s.team.seed}
                        </p>
                      </div>
                    </Link>
                  </td>

                  <td className="px-4 py-4 text-center font-bold text-[#94a3b8]">
                    {s.played}
                  </td>

                  <td className="px-4 py-4 text-center font-black text-[#34d399]">
                    {s.wins}
                  </td>

                  <td className="px-4 py-4 text-center font-semibold text-[#ff4d6a]">
                    {s.losses}
                  </td>

                  <td className="px-4 py-4 text-center font-bold text-[#f1f5f9]">
                    {s.roundDifference > 0 ? `+${s.roundDifference}` : s.roundDifference}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="inline-block rounded-xl border border-[#a855f7]/40 bg-[#a855f7]/15 px-3 py-1 text-sm font-black text-[#f1f5f9]">
                      {s.points} PTS
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 5. Map Rotation / Arenas Showcase ─────────────────────────────────── */}
      {game.maps && game.maps.length > 0 && (
        <section className="rounded-3xl border border-[#1e1e3a] bg-[#0c0c18]/90 p-6 sm:p-8 backdrop-blur-xl">
          <div className="border-b border-[#1e1e3a] pb-4">
            <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#a855f7]">
              MAP POOL & ARENAS
            </p>
            <h3 className="mt-1 text-xl font-black uppercase tracking-tight text-white">
              Official Competitive Maps
            </h3>
          </div>

          <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {game.maps.map((map) => (
              <div
                key={map.id}
                className="overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#080812] transition hover:border-[#a855f7]/50"
              >
                <div className="relative h-28 w-full bg-[#0c0c18] flex items-center justify-center">
                  {map.splashUrl ? (
                    <Image
                      src={map.splashUrl}
                      alt={map.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-2xl opacity-40">🏟️</span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080812] via-transparent to-transparent" />
                  <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[12px] font-black uppercase text-white backdrop-blur">
                    {map.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

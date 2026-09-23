"use client";

import Link from "next/link";
import Image from "next/image";
import { StatusBadge } from "../ui/status-badge";
import { MatchCard } from "../ui/match-card";
import { LiveStreamEmbed } from "../ui/live-stream-embed";
import type { FrontPageProps, StandingsView } from "./types";
import type { Match } from "@/lib/types";
import { getTournamentStatusMeta } from "@/lib/tournament-status";

function phaseMatches(matches: Match[]) {
  return matches
    .filter((m) => m.matchNumber >= 13 && m.matchNumber <= 16)
    .sort((a, b) => a.matchNumber - b.matchNumber);
}

export function ValorantFrontPage({
  settings,
  teams,
  matches,
  standings,
  standingsView,
  setStandingsView,
  formatDate,
  game,
}: FrontPageProps) {
  const completed = matches.filter((m) => m.status === "Completed");
  const live = matches.filter((m) => m.status === "Live");
  const scheduled = matches.filter((m) => m.status === "Scheduled");

  const qualifierMs = phaseMatches(matches).filter(
    (m) => m.matchNumber >= 13 && m.matchNumber <= 15,
  );
  const grandFinal = matches.find((m) => m.matchNumber === 16);

  const nextMatch = [...scheduled].sort(
    (a, b) =>
      new Date(a.scheduledAt || "9999").getTime() -
      new Date(b.scheduledAt || "9999").getTime(),
  )[0];
  const activeLive = live[0];

  const groupCompleted = completed.filter(
    (m) => m.stage === "Group Stage",
  ).length;
  const groupTotal = 12;
  const progress = Math.min(
    100,
    Math.round((groupCompleted / groupTotal) * 100),
  );
  const qualifierTeams = standings.slice(0, 4);

  const nextMatchTeam1 = nextMatch
    ? teams.find((t) => t.id === nextMatch.team1Id)
    : null;
  const nextMatchTeam2 = nextMatch
    ? teams.find((t) => t.id === nextMatch.team2Id)
    : null;

  const featuredMatchId = (activeLive || nextMatch)?.id;
  const upNextMatches = [...live, ...scheduled]
    .filter((m) => m.id !== featuredMatchId)
    .sort(
      (a, b) =>
        new Date(a.scheduledAt || "9999").getTime() -
        new Date(b.scheduledAt || "9999").getTime(),
    );

  const STANDINGS_TABS: { id: StandingsView; label: string }[] = [
    { id: "overall", label: "OVERALL" },
    { id: "group", label: "GROUP STAGE" },
    { id: "qualifiers", label: "QUALIFIERS PATH" },
    { id: "final", label: "GRAND FINAL" },
  ];

  return (
    <div className="space-y-8">
      {/* ══════════════════════════════════════════════════════════════════
          1. EPIC CINEMATIC HERO ARENA
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden rounded-3xl border border-[#1e1e3a] bg-[#0c0c18]/90 p-6 sm:p-10 backdrop-blur-2xl shadow-[0_0_50px_rgba(148,163,184,0.1)]">
        {/* Radial gradient backing */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#2e2e5a]/15 blur-[100px]" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-[#ff2d55]/10 blur-[100px]" />

        <div className="relative grid gap-8 lg:grid-cols-[1.3fr_1fr] items-center">
          {/* Left: Tournament Identity */}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-full border border-[#2e2e5a]/40 bg-[#2e2e5a]/10 px-3 py-1 text-[12px] font-black uppercase tracking-widest text-[#94a3b8]">
                {game.shortName} ESPORTS
              </span>
              <span className="rounded-full border border-[#ff2d55]/40 bg-[#ff2d55]/10 px-3 py-1 text-[12px] font-black uppercase tracking-widest text-[#ff4d6a]">
                SEASON 2026
              </span>
              {settings?.tournamentStatus && (
                <span
                  className={`rounded-full border px-3 py-1 text-[12px] font-black uppercase tracking-widest ${
                    getTournamentStatusMeta(settings.tournamentStatus).badgeClass
                  }`}
                >
                  ● {getTournamentStatusMeta(settings.tournamentStatus).display}
                </span>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.05]">
              {settings?.tournamentName || "XMD VALORANT"}
            </h1>

            <p className="mt-3 text-sm font-semibold uppercase tracking-wider text-[#94a3b8] sm:text-base">
              {settings?.tagline || "ONE GAME ONE SQUAD XMD FAMILY"}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-[#94a3b8] border-t border-[#1e1e3a]/80 pt-5">
              <div className="flex items-center gap-2">
                <span className="text-[#94a3b8]">📅</span>
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
                <span className="text-[#ff2d55]">🛡️</span>
                <span>
                  <strong className="text-white">ORGANIZER:</strong>{" "}
                  {settings?.organizerName || "XMD FAMILY"}
                </span>
              </div>
            </div>

            {/* Quick Action Navigation */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/tournament/bracket"
                className="inline-flex items-center gap-2 rounded-xl border border-[#ff2d55]/50 bg-[#ff2d55]/20 px-5 py-2.5 text-sm font-black uppercase tracking-wider text-[#ff8fa3] transition hover:bg-[#ff2d55]/35 hover:shadow-[0_0_20px_rgba(255,45,85,0.3)]"
              >
                <span>PLAYOFF BRACKET</span>
                <span>↗</span>
              </Link>

              <Link
                href="/tournament/matches"
                className="inline-flex items-center gap-2 rounded-xl border border-[#1e1e3a] bg-[#080812] px-5 py-2.5 text-sm font-black uppercase tracking-wider text-[#f1f5f9] transition hover:border-[#ff2d55]/50"
              >
                <span>MATCHES</span>
                <span>↗</span>
              </Link>

              <Link
                href="/tournament/teams"
                className="inline-flex items-center gap-2 rounded-xl border border-[#1e1e3a] bg-[#080812] px-5 py-2.5 text-sm font-black uppercase tracking-wider text-[#f1f5f9] transition hover:border-[#ff2d55]/50"
              >
                <span>TEAMS</span>
                <span>↗</span>
              </Link>
            </div>
          </div>

          {/* Right: Official Prize Pool Showcase */}
          <div className="relative overflow-hidden rounded-2xl border border-[#ff2d55]/40 bg-gradient-to-b from-[#ff2d55]/15 via-[#0c0c18] to-[#080812] p-5 shadow-[0_0_35px_rgba(255,45,85,0.15)]">
            {/* Header Strip */}
            <div className="flex items-center justify-between border-b border-[#1e1e3a] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <span className="text-sm font-black uppercase tracking-widest text-[#fbbf24]">
                  PRIZE POOL ({settings?.prizePool ? `₹${settings.prizePool}` : "OFFICIAL"})
                </span>
              </div>
              <span className="rounded-full border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-2.5 py-0.5 text-[11px] font-black uppercase text-[#fbbf24]">
                OFFICIAL BREAKDOWN
              </span>
            </div>

            {/* Graphic Artwork / Podium Card */}
            <div className="mt-4 overflow-hidden rounded-xl border border-[#1e1e3a] shadow-inner transition hover:border-[#ff2d55]/50 hover:shadow-[0_0_25px_rgba(255,45,85,0.2)]">
              {settings?.bannerUrl ? (
                <Image
                  src={settings.bannerUrl}
                  alt="Official Prize Pool"
                  width={592}
                  height={185}
                  unoptimized
                  className="block h-auto w-full object-cover"
                />
              ) : (
                <Image
                  src="/prizepool-breakdown.png"
                  alt="Official Prize Pool 6K"
                  width={592}
                  height={185}
                  unoptimized
                  className="block h-auto w-full object-cover"
                />
              )}
            </div>
          </div>
        </div>

        {/* Announcement ticker if set */}
        {settings?.announcement && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/10 p-3.5 text-sm text-[#fde68a]">
            <span className="text-base font-black">📢</span>
            <span className="font-bold">{settings.announcement}</span>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          2. LIVE BROADCAST EMBED
      ══════════════════════════════════════════════════════════════════ */}
      <LiveStreamEmbed url={settings?.liveStreamUrl} />

      {/* ══════════════════════════════════════════════════════════════════
          3. HIGH-IMPACT METRIC CARDS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Registered Teams */}
        <div className="relative overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-5 backdrop-blur-xl transition hover:border-[#2e2e5a]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-black uppercase tracking-[0.25em] text-[#94a3b8]">
              FRANCHISES
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1e1e3a] bg-[#080812] text-sm">
              🛡️
            </span>
          </div>
          <div className="mt-3 text-3xl font-black text-white">
            {teams.length}
          </div>
          <p className="mt-1 text-[12px] font-bold uppercase tracking-wider text-[#64748b]">
            {teams.length} Verified Lineups
          </p>
        </div>

        {/* Card 2: Completed Matches */}
        <div className="relative overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-5 backdrop-blur-xl transition hover:border-[#2e2e5a]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-black uppercase tracking-[0.25em] text-[#94a3b8]">
              COMPLETED
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1e1e3a] bg-[#080812] text-sm">
              ⚔️
            </span>
          </div>
          <div className="mt-3 text-3xl font-black text-white">
            {completed.length}{" "}
            <span className="text-sm font-bold text-[#64748b]">/ 16</span>
          </div>
          <p className="mt-1 text-[12px] font-bold uppercase tracking-wider text-[#64748b]">
            {completed.length} Official Results Logged
          </p>
        </div>

        {/* Card 3: Live Arena */}
        <div className="relative overflow-hidden rounded-2xl border border-[#ff2d55]/30 bg-[#0c0c18]/85 p-5 backdrop-blur-xl transition hover:border-[#ff2d55]/60 hover:shadow-[0_0_25px_rgba(255,45,85,0.15)]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-black uppercase tracking-[0.25em] text-[#ff4d6a]">
              LIVE ARENA
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#ff2d55]/40 bg-[#ff2d55]/10 text-sm">
              🔴
            </span>
          </div>
          <div className="mt-3 text-3xl font-black text-[#ff4d6a]">
            {live.length}
          </div>
          <p className="mt-1 text-[12px] font-bold uppercase tracking-wider text-[#64748b]">
            {live.length > 0 ? "Broadcast Stream Active" : "No Active Games"}
          </p>
        </div>

        {/* Card 4: Upcoming / Next */}
        <div className="relative overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-5 backdrop-blur-xl transition hover:border-[#2e2e5a]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-black uppercase tracking-[0.25em] text-[#94a3b8]">
              NEXT SCHEDULED
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1e1e3a] bg-[#080812] text-sm">
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
          <p className="mt-1 text-[12px] font-bold uppercase tracking-wider text-[#64748b]">
            {scheduled.length} Scheduled Fixture{scheduled.length === 1 ? "" : "s"}
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          4. BROADCAST STANDINGS DECK
      ══════════════════════════════════════════════════════════════════ */}
      <section className="overflow-hidden rounded-3xl border border-[#1e1e3a] bg-[#0c0c18]/90 backdrop-blur-xl">
        <div className="border-b border-[#1e1e3a] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#f59e0b]">
                TELEMETRY
              </p>
              <h3 className="mt-1 text-2xl font-black uppercase tracking-tight text-white">
                Tournament Standings
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {STANDINGS_TABS.map((tab) => {
                const active = standingsView === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStandingsView(tab.id)}
                    className={`rounded-xl border px-4 py-2 text-[12px] font-black tracking-widest uppercase transition ${
                      active
                        ? "border-[#ff2d55]/70 bg-[#ff2d55]/20 text-[#ff4d6a] shadow-[0_0_15px_rgba(255,45,85,0.2)]"
                        : "border-[#1e1e3a] bg-[#080812] text-[#64748b] hover:border-[#2e2e5a] hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Overall / Group Table */}
        {(standingsView === "overall" || standingsView === "group") && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr className="border-b border-[#1e1e3a] bg-[#080812] text-[13px] font-black uppercase tracking-widest text-[#94a3b8]">
                  <th className="px-6 py-4 w-16">#</th>
                  <th className="px-6 py-4">Franchise</th>
                  <th className="px-4 py-4 text-center">Played</th>
                  <th className="px-4 py-4 text-center">Won</th>
                  <th className="px-4 py-4 text-center">Lost</th>
                  <th className="px-4 py-4 text-center">Round Diff</th>
                  <th className="px-6 py-4 text-center">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e3a] text-base font-semibold">
                {standings.map((s, i) => {
                  const isUpperBracket = i < 2;
                  const isLowerBracket = i >= 2 && i < 4;

                  const rankStyle = isUpperBracket
                    ? "border-l-4 border-l-[#34d399]"
                    : isLowerBracket
                    ? "border-l-4 border-l-[#fbbf24]"
                    : "border-l-4 border-l-transparent";

                  return (
                    <tr
                      key={s.team.id}
                      className={`transition hover:bg-[#080812]/70 ${rankStyle}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1e1e3a] text-lg font-black text-white">
                            {i + 1}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <Link
                          href={`/tournament/teams/${encodeURIComponent(s.team.id)}`}
                          className="group flex items-center gap-3.5"
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#1e1e3a] bg-[#080812] group-hover:border-[#ff2d55]/60">
                            {s.team.logo ? (
                              <Image
                                src={s.team.logo}
                                alt={s.team.name}
                                width={44}
                                height={44}
                                unoptimized
                                className="h-full w-full object-contain p-1"
                              />
                            ) : (
                              <span className="text-sm font-black text-[#94a3b8]">
                                {s.team.tag.slice(0, 3)}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-base font-black uppercase text-white group-hover:text-[#ff4d6a] transition-colors">
                              {s.team.name}
                            </p>
                            <p className="text-[13px] font-bold uppercase text-[#64748b]">
                              [{s.team.tag}] • Seed #{s.team.seed}
                              {isUpperBracket && (
                                <span className="ml-2 text-[#34d399]">● Advances to Q1</span>
                              )}
                              {isLowerBracket && (
                                <span className="ml-2 text-[#fbbf24]">● Eliminator</span>
                              )}
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

                      <td
                        className={`px-4 py-4 text-center font-bold ${
                          s.roundDifference > 0
                            ? "text-[#34d399]"
                            : s.roundDifference < 0
                            ? "text-[#ff4d6a]"
                            : "text-[#94a3b8]"
                        }`}
                      >
                        {s.roundDifference > 0
                          ? `+${s.roundDifference}`
                          : s.roundDifference}
                      </td>

                      <td className="px-6 py-4 text-center text-lg font-black text-white">
                        {s.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Qualification Footer Legend */}
            <div className="flex flex-wrap items-center gap-6 border-t border-[#1e1e3a] bg-[#080812] px-6 py-3 text-[13px] font-black uppercase tracking-wider text-[#64748b]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#34d399]" />
                <span>Top 2 Advance to Upper Bracket (Q1)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#fbbf24]" />
                <span>3rd & 4th Advance to Eliminator (Lower Bracket)</span>
              </div>
            </div>
          </div>
        )}

        {/* Qualifiers path view */}
        {standingsView === "qualifiers" && (
          <div className="grid gap-6 p-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[#2e2e5a]/30 bg-[#080812] p-5">
              <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#94a3b8]">
                QUALIFICATION SEEDING
              </p>
              <h4 className="mt-1 text-lg font-black text-white">
                Projected Playoff Seeds
              </h4>
              <div className="mt-4 space-y-2.5">
                {qualifierTeams.map((item, i) => (
                  <div
                    key={item.team.id}
                    className="flex items-center justify-between rounded-xl border border-[#1e1e3a] bg-[#0c0c18] p-3.5"
                  >
                    <div>
                      <div className="text-sm font-black uppercase text-white">
                        {item.team.name}
                      </div>
                      <div className="mt-0.5 text-[11px] font-bold text-[#64748b]">
                        STANDINGS SEED #{i + 1}
                      </div>
                    </div>
                    <span
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-black uppercase ${
                        i < 2
                          ? "border border-[#10b981]/40 bg-[#10b981]/15 text-[#34d399]"
                          : "border border-[#f59e0b]/40 bg-[#f59e0b]/15 text-[#fbbf24]"
                      }`}
                    >
                      {i < 2 ? "★ QUALIFIER 1 (UPPER)" : "ELIMINATOR (LOWER)"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {qualifierMs.length === 0 ? (
                <div className="rounded-2xl border border-[#1e1e3a] bg-[#080812] p-10 text-center text-sm text-[#64748b]">
                  Qualifier matches will be unlocked after all 12 Group Stage matches conclude.
                </div>
              ) : (
                qualifierMs.map((m) => (
                  <MatchCard key={m.id} match={m} teams={teams} />
                ))
              )}
            </div>
          </div>
        )}

        {/* Grand Final view */}
        {standingsView === "final" && (
          <div className="p-6">
            {!grandFinal ? (
              <div className="rounded-2xl border border-[#f59e0b]/30 bg-[#080812] p-12 text-center">
                <div className="text-3xl">🏆</div>
                <p className="mt-3 text-sm font-black uppercase tracking-[0.25em] text-[#fbbf24]">
                  GRAND FINAL CHAMPIONSHIP
                </p>
                <p className="mt-2 text-sm text-[#64748b]">
                  The Grand Final championship match unlocks after Qualifier 2 concludes.
                </p>
              </div>
            ) : (
              <MatchCard match={grandFinal} teams={teams} />
            )}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          5. FEATURED CLASH + ROADMAP — SIDE BY SIDE ON WIDE SCREENS
      ══════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr] xl:items-start">
      {(activeLive || nextMatch) && (
        <section className="relative overflow-hidden rounded-3xl border border-[#1e1e3a] bg-[#0c0c18]/90 p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_40px_rgba(148,163,184,0.08)]">
          <div className="flex items-center justify-between border-b border-[#1e1e3a] pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 items-center justify-center rounded-lg border border-[#1e1e3a] bg-[#080812] px-2.5 text-sm font-black text-white">
                M{String((activeLive || nextMatch)!.matchNumber).padStart(2, "0")}
              </span>
              <span className="rounded-lg border border-[#2e2e5a]/40 bg-[#2e2e5a]/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#94a3b8]">
                {(activeLive || nextMatch)!.stage}
              </span>
              <span className="rounded-lg border border-[#1e1e3a] bg-[#080812] px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#94a3b8]">
                {(activeLive || nextMatch)!.map || "TBD"} • BO{(activeLive || nextMatch)!.bestOf}
              </span>
            </div>

            <StatusBadge status={(activeLive || nextMatch)!.status} />
          </div>

          <div className="mt-6 grid items-center gap-6 grid-cols-1 md:grid-cols-[1fr_auto_1fr]">
            {/* Team 1 */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18] shadow-[0_0_20px_rgba(148,163,184,0.15)]">
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
                  <span className="text-sm font-black text-[#94a3b8]">
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
              <div className="rounded-2xl border border-[#2e2e5a]/40 bg-[#2e2e5a]/15 px-5 py-2 text-sm font-black tracking-widest text-[#f1f5f9] shadow-[0_0_20px_rgba(148,163,184,0.25)]">
                VS
              </div>
              <span className="mt-2 text-sm font-black uppercase tracking-wider text-[#94a3b8]">
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
              Featured Match Stream & Scoreboard Telemetry
            </span>
            <Link
              href={`/tournament/matches/${encodeURIComponent((activeLive || nextMatch)!.id)}`}
              className="inline-flex items-center gap-2 rounded-xl border border-[#2e2e5a]/40 bg-[#2e2e5a]/10 px-4 py-2 text-sm font-black uppercase tracking-wider text-[#94a3b8] transition hover:bg-[#2e2e5a]/20"
            >
              <span>OPEN MATCH TELEMETRY</span>
              <span>→</span>
            </Link>
          </div>

          {/* Up Next — fills remaining space with the next few fixtures */}
          {upNextMatches.length > 0 && (
            <div className="mt-6 border-t border-[#1e1e3a] pt-6">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#94a3b8]">
                  Up Next
                </span>
                <Link
                  href="/tournament/matches"
                  className="text-[11px] font-black uppercase tracking-wider text-[#64748b] hover:text-white transition"
                >
                  View All Fixtures →
                </Link>
              </div>
              <div className="mt-4 grid max-h-[420px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-min">
                {upNextMatches.map((m) => (
                  <MatchCard key={m.id} match={m} teams={teams} compact />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          5a. TOURNAMENT MILESTONE ROADMAP
      ══════════════════════════════════════════════════════════════════ */}
      <section className="rounded-3xl border border-[#1e1e3a] bg-[#0c0c18]/90 p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e1e3a] pb-4">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#ff2d55]">
              TOURNAMENT ARCHITECTURE
            </p>
            <h3 className="mt-1 text-xl font-black uppercase tracking-tight text-white">
              Progression Roadmap
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-black uppercase tracking-wider text-[#94a3b8]">
              Group Stage: {groupCompleted}/12 Matches
            </span>
            <span className="rounded-full bg-[#2e2e5a]/20 px-2 py-0.5 text-[12px] font-black text-[#94a3b8]">
              {progress}%
            </span>
          </div>
        </div>

        {/* 3-Stage Milestone Grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          {/* Milestone 1: Group Stage */}
          <div className="relative rounded-2xl border border-[#2e2e5a]/40 bg-[#080812] p-5 shadow-[0_0_25px_rgba(148,163,184,0.1)]">
            <div className="flex items-center justify-between">
              <span className="rounded bg-[#2e2e5a]/20 px-2 py-0.5 text-[11px] font-black uppercase text-[#94a3b8]">
                GROUP STAGE
              </span>
              <span className="text-sm font-black text-[#34d399]">
                {groupCompleted === 12 ? "COMPLETED" : "ACTIVE STAGE"}
              </span>
            </div>
            <h4 className="mt-3 text-base font-black uppercase text-white">
              Group Stage
            </h4>
            <p className="mt-1 text-sm text-[#64748b]">
              12 Fixtures • Single Round-Robin. Top 2 advance to Qualifier 1; 3rd & 4th to Eliminator.
            </p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#1e1e3a]">
              <div
                className="h-full bg-gradient-to-r from-[#2e2e5a] to-[#34d399]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Milestone 2: Double-Elimination Playoffs */}
          <div className="relative rounded-2xl border border-[#2e2e5a]/30 bg-[#080812] p-5">
            <div className="flex items-center justify-between">
              <span className="rounded bg-[#2e2e5a]/20 px-2 py-0.5 text-[11px] font-black uppercase text-[#94a3b8]">
                PLAYOFFS
              </span>
              <span className="text-sm font-black text-[#94a3b8]">
                {groupCompleted === 12 ? "UNLOCKED" : "LOCKED"}
              </span>
            </div>
            <h4 className="mt-3 text-base font-black uppercase text-white">
              Playoffs
            </h4>
            <p className="mt-1 text-sm text-[#64748b]">
              3 Matches (Q1, Eliminator, Q2). Top seeds get two chances to qualify for the Grand Final.
            </p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#1e1e3a]">
              <div
                className="h-full bg-[#2e2e5a]"
                style={{ width: groupCompleted === 12 ? "30%" : "0%" }}
              />
            </div>
          </div>

          {/* Milestone 3: Grand Final */}
          <div className="relative rounded-2xl border border-[#f59e0b]/30 bg-[#080812] p-5">
            <div className="flex items-center justify-between">
              <span className="rounded bg-[#f59e0b]/20 px-2 py-0.5 text-[11px] font-black uppercase text-[#fbbf24]">
                CHAMPIONSHIP
              </span>
              <span className="text-sm font-black text-[#fbbf24]">
                OCT 23
              </span>
            </div>
            <h4 className="mt-3 text-base font-black uppercase text-white">
              Grand Final
            </h4>
            <p className="mt-1 text-sm text-[#64748b]">
              The ultimate championship series. Winner claims the gold trophy & ₹6,000 prize pool.
            </p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#1e1e3a]">
              <div
                className="h-full bg-[#f59e0b]"
                style={{ width: "0%" }}
              />
            </div>
          </div>
        </div>
      </section>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          6. SPONSORS & OFFICIAL PARTNERS - MODERN 4-CARD DECK
      ══════════════════════════════════════════════════════════════════ */}
      <section className="rounded-3xl border border-[#1e1e3a] bg-[#0c0c18]/90 p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e1e3a] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-black uppercase tracking-[0.25em] text-[#ff4d6a]">
                OFFICIAL PARTNERS
              </span>
              <span className="rounded-full border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-2 py-0.5 text-[10px] font-black uppercase text-[#fbbf24]">
                4 CHAMPIONSHIP SPONSORS
              </span>
            </div>
            <h4 className="mt-1 text-2xl font-black uppercase tracking-tight text-white">
              Tournament Sponsors
            </h4>
          </div>
          <span className="rounded-full border border-[#1e1e3a] bg-[#080812] px-3.5 py-1 text-[12px] font-black text-[#94a3b8]">
            PRESENTED BY XMD FAMILY
          </span>
        </div>

        {/* 4 Equal-Weight Sponsor Cards */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              name: "Sheikh Kunjappu",
              role: "Title Partner & Championship Patron",
              image: "/sponsors/sheikh-kunjappu.jpg",
              fit: "object-cover",
            },
            {
              name: "OSDF Clan",
              role: "Official Clan & Community Sponsor",
              image: "/sponsors/osdf-clan.png",
              fit: "object-contain p-3",
            },
            {
              name: "Deuz X Gaming",
              role: "Esports Media & Gaming Partner",
              image: "/sponsors/deuz-x.png",
              fit: "object-contain p-2.5",
            },
            {
              name: "Agon Desantos",
              role: "Championship Supporter & Sponsor",
              image: "/sponsors/agon-desantos.png",
              fit: "object-contain p-1",
            },
          ].map((sponsor) => (
            <div
              key={sponsor.name}
              className="group relative flex flex-col items-center justify-between overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/80 p-6 text-center transition hover:border-white/50 hover:shadow-[0_0_25px_rgba(255,255,255,0.1)]"
            >
              <span className="rounded-full border border-[#1e1e3a] bg-[#080812] px-3 py-1 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                OFFICIAL SPONSOR
              </span>

              <div className="my-5 flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#94a3b8]/40 bg-[#080812] shadow-[0_0_25px_rgba(255,255,255,0.1)] transition-transform duration-300 group-hover:scale-105">
                <Image
                  src={sponsor.image}
                  alt={sponsor.name}
                  width={112}
                  height={112}
                  unoptimized
                  className={`h-full w-full ${sponsor.fit}`}
                />
              </div>

              <div>
                <h5 className="text-lg font-black uppercase tracking-tight text-white group-hover:text-[#f1f5f9] transition-colors">
                  {sponsor.name}
                </h5>
                <p className="mt-1 text-[12px] font-bold uppercase tracking-wider text-[#64748b]">
                  {sponsor.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          7. OFFICIAL CASTERS / BROADCAST TALENT
      ══════════════════════════════════════════════════════════════════ */}
      <section className="rounded-3xl border border-[#1e1e3a] bg-[#0c0c18]/90 p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e1e3a] pb-5">
          <div>
            <span className="text-[12px] font-black uppercase tracking-[0.25em] text-[#ff4d6a]">
              BROADCAST TALENT
            </span>
            <h4 className="mt-1 text-2xl font-black uppercase tracking-tight text-white">
              Official Casters
            </h4>
          </div>
          <span className="rounded-full border border-[#1e1e3a] bg-[#080812] px-3.5 py-1 text-[12px] font-black text-[#94a3b8]">
            WATCH ON YOUTUBE
          </span>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((slot) => (
            <a
              key={slot}
              href="#"
              className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#1e1e3a] bg-[#080812]/60 p-6 text-center transition hover:border-[#ff2d55]/50 hover:bg-[#080812]"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-[#1e1e3a] bg-[#0c0c18] text-2xl text-[#64748b] transition group-hover:border-[#ff2d55]/50 group-hover:text-[#ff4d6a]">
                ▶
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-[#94a3b8] group-hover:text-white transition-colors">
                  Caster Slot {slot}
                </p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                  YouTube channel link coming soon
                </p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { StatusBadge } from "../ui/status-badge";
import { MatchCard } from "../ui/match-card";
import type { FrontPageProps, StandingsView } from "./types";
import type { Match } from "@/lib/types";

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
      <section className="relative overflow-hidden rounded-3xl border border-[#1e1e3a] bg-[#0c0c18]/90 p-6 sm:p-10 backdrop-blur-2xl shadow-[0_0_50px_rgba(124,58,237,0.1)]">
        {/* Radial gradient backing */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#7c3aed]/15 blur-[100px]" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-[#ff2d55]/10 blur-[100px]" />

        <div className="relative grid gap-8 lg:grid-cols-[1.3fr_1fr] items-center">
          {/* Left: Tournament Identity */}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-full border border-[#06b6d4]/40 bg-[#06b6d4]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#22d3ee]">
                {game.shortName} ESPORTS
              </span>
              <span className="rounded-full border border-[#ff2d55]/40 bg-[#ff2d55]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#ff4d6a]">
                SEASON 2026
              </span>
              {settings?.tournamentStatus && (
                <span className="rounded-full border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#fbbf24]">
                  ● {settings.tournamentStatus.toUpperCase()}
                </span>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.05]">
              {settings?.tournamentName || "XMD VALORANT"}
            </h1>

            <p className="mt-3 text-sm font-semibold uppercase tracking-wider text-[#94a3b8] sm:text-base">
              {settings?.tagline || "ONE GAME ONE SQUAD XMD FAMILY"}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-[#94a3b8] border-t border-[#1e1e3a]/80 pt-5">
              <div className="flex items-center gap-2">
                <span className="text-[#06b6d4]">📅</span>
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
                className="inline-flex items-center gap-2 rounded-xl border border-[#7c3aed]/50 bg-[#7c3aed]/20 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#d8b4fe] transition hover:bg-[#7c3aed]/35 hover:shadow-[0_0_20px_rgba(124,58,237,0.3)]"
              >
                <span>PLAYOFF BRACKET</span>
                <span>↗</span>
              </Link>

              <Link
                href="/tournament/matches"
                className="inline-flex items-center gap-2 rounded-xl border border-[#06b6d4]/40 bg-[#06b6d4]/15 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#67e8f9] transition hover:bg-[#06b6d4]/25 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]"
              >
                <span>MATCHES</span>
                <span>↗</span>
              </Link>

              <Link
                href="/tournament/teams"
                className="inline-flex items-center gap-2 rounded-xl border border-[#1e1e3a] bg-[#080812] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#f1f5f9] transition hover:border-[#7c3aed]/50"
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
                <span className="text-xs font-black uppercase tracking-widest text-[#fbbf24]">
                  PRIZE POOL ({settings?.prizePool ? `₹${settings.prizePool}` : "OFFICIAL"})
                </span>
              </div>
              <span className="rounded-full border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-2.5 py-0.5 text-[9px] font-black uppercase text-[#fbbf24]">
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
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/10 p-3.5 text-xs text-[#fde68a]">
            <span className="text-base font-black">📢</span>
            <span className="font-bold">{settings.announcement}</span>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          2. HIGH-IMPACT METRIC CARDS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Registered Teams */}
        <div className="relative overflow-hidden rounded-2xl border border-[#06b6d4]/30 bg-[#0c0c18]/85 p-5 backdrop-blur-xl transition hover:border-[#06b6d4]/60 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#22d3ee]">
              FRANCHISES
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#06b6d4]/40 bg-[#06b6d4]/10 text-sm">
              🛡️
            </span>
          </div>
          <div className="mt-3 text-3xl font-black text-white">
            {teams.length}
          </div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
            {teams.length} Verified Lineups
          </p>
        </div>

        {/* Card 2: Completed Matches */}
        <div className="relative overflow-hidden rounded-2xl border border-[#10b981]/30 bg-[#0c0c18]/85 p-5 backdrop-blur-xl transition hover:border-[#10b981]/60 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#34d399]">
              COMPLETED
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#10b981]/40 bg-[#10b981]/10 text-sm">
              ⚔️
            </span>
          </div>
          <div className="mt-3 text-3xl font-black text-white">
            {completed.length}{" "}
            <span className="text-sm font-bold text-[#64748b]">/ 16</span>
          </div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
            {completed.length} Official Results Logged
          </p>
        </div>

        {/* Card 3: Live Arena */}
        <div className="relative overflow-hidden rounded-2xl border border-[#ff2d55]/30 bg-[#0c0c18]/85 p-5 backdrop-blur-xl transition hover:border-[#ff2d55]/60 hover:shadow-[0_0_25px_rgba(255,45,85,0.15)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ff4d6a]">
              LIVE ARENA
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#ff2d55]/40 bg-[#ff2d55]/10 text-sm">
              🔴
            </span>
          </div>
          <div className="mt-3 text-3xl font-black text-[#ff4d6a]">
            {live.length}
          </div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
            {live.length > 0 ? "Broadcast Stream Active" : "No Active Games"}
          </p>
        </div>

        {/* Card 4: Upcoming / Next */}
        <div className="relative overflow-hidden rounded-2xl border border-[#7c3aed]/30 bg-[#0c0c18]/85 p-5 backdrop-blur-xl transition hover:border-[#7c3aed]/60 hover:shadow-[0_0_25px_rgba(124,58,237,0.15)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#a78bfa]">
              NEXT SCHEDULED
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#7c3aed]/40 bg-[#7c3aed]/10 text-sm">
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
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#a78bfa]">
            {scheduled.length} Scheduled Fixture{scheduled.length === 1 ? "" : "s"}
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          3. FEATURED UPCOMING / LIVE CLASH
      ══════════════════════════════════════════════════════════════════ */}
      {(activeLive || nextMatch) && (
        <section className="relative overflow-hidden rounded-3xl border border-[#1e1e3a] bg-[#0c0c18]/90 p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_40px_rgba(6,182,212,0.08)]">
          <div className="flex items-center justify-between border-b border-[#1e1e3a] pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 items-center justify-center rounded-lg border border-[#1e1e3a] bg-[#080812] px-2.5 text-xs font-black text-white">
                M{String((activeLive || nextMatch)!.matchNumber).padStart(2, "0")}
              </span>
              <span className="rounded-lg border border-[#06b6d4]/40 bg-[#06b6d4]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[#22d3ee]">
                {(activeLive || nextMatch)!.stage}
              </span>
              <span className="rounded-lg border border-[#1e1e3a] bg-[#080812] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[#94a3b8]">
                {(activeLive || nextMatch)!.map || "TBD"} • BO{(activeLive || nextMatch)!.bestOf}
              </span>
            </div>

            <StatusBadge status={(activeLive || nextMatch)!.status} />
          </div>

          <div className="mt-6 grid items-center gap-6 grid-cols-1 md:grid-cols-[1fr_auto_1fr]">
            {/* Team 1 */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18] shadow-[0_0_20px_rgba(6,182,212,0.15)]">
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
                  <span className="text-sm font-black text-[#06b6d4]">
                    {(nextMatchTeam1?.tag ?? "TBD").slice(0, 3)}
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
                  {nextMatchTeam1?.name ?? "TBD"}
                </h4>
                <p className="mt-0.5 text-xs font-bold text-[#64748b]">
                  [{nextMatchTeam1?.tag ?? "TBD"}] • Seed #{nextMatchTeam1?.seed ?? "—"}
                </p>
              </div>
            </div>

            {/* Center Hub */}
            <div className="flex flex-col items-center justify-center py-2 md:py-0 px-6">
              <div className="rounded-2xl border border-[#7c3aed]/40 bg-[#7c3aed]/15 px-5 py-2 text-sm font-black tracking-widest text-[#d8b4fe] shadow-[0_0_20px_rgba(124,58,237,0.25)]">
                VS
              </div>
              <span className="mt-2 text-xs font-black uppercase tracking-wider text-[#06b6d4]">
                {formatDate((activeLive || nextMatch)!.scheduledAt)}
              </span>
            </div>

            {/* Team 2 */}
            <div className="flex items-center gap-4 md:flex-row-reverse md:text-right">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18] shadow-[0_0_20px_rgba(124,58,237,0.15)]">
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
                  <span className="text-sm font-black text-[#7c3aed]">
                    {(nextMatchTeam2?.tag ?? "TBD").slice(0, 3)}
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
                  {nextMatchTeam2?.name ?? "TBD"}
                </h4>
                <p className="mt-0.5 text-xs font-bold text-[#64748b]">
                  [{nextMatchTeam2?.tag ?? "TBD"}] • Seed #{nextMatchTeam2?.seed ?? "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-[#1e1e3a] pt-4">
            <span className="text-xs text-[#64748b]">
              Featured Match Stream & Scoreboard Telemetry
            </span>
            <Link
              href={`/tournament/matches/${encodeURIComponent((activeLive || nextMatch)!.id)}`}
              className="inline-flex items-center gap-2 rounded-xl border border-[#06b6d4]/40 bg-[#06b6d4]/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#22d3ee] transition hover:bg-[#06b6d4]/20"
            >
              <span>OPEN MATCH TELEMETRY</span>
              <span>→</span>
            </Link>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          4. TOURNAMENT MILESTONE ROADMAP
      ══════════════════════════════════════════════════════════════════ */}
      <section className="rounded-3xl border border-[#1e1e3a] bg-[#0c0c18]/90 p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e1e3a] pb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ff2d55]">
              TOURNAMENT ARCHITECTURE
            </p>
            <h3 className="mt-1 text-xl font-black uppercase tracking-tight text-white">
              Progression Roadmap
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#22d3ee]">
              Group Stage: {groupCompleted}/12 Matches
            </span>
            <span className="rounded-full bg-[#06b6d4]/20 px-2 py-0.5 text-[10px] font-black text-[#22d3ee]">
              {progress}%
            </span>
          </div>
        </div>

        {/* 3-Stage Milestone Grid */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {/* Milestone 1: Group Stage */}
          <div className="relative rounded-2xl border border-[#06b6d4]/40 bg-[#080812] p-5 shadow-[0_0_25px_rgba(6,182,212,0.1)]">
            <div className="flex items-center justify-between">
              <span className="rounded bg-[#06b6d4]/20 px-2 py-0.5 text-[9px] font-black uppercase text-[#22d3ee]">
                PHASE 1
              </span>
              <span className="text-xs font-black text-[#34d399]">
                {groupCompleted === 12 ? "COMPLETED" : "ACTIVE STAGE"}
              </span>
            </div>
            <h4 className="mt-3 text-base font-black uppercase text-white">
              Group Stage
            </h4>
            <p className="mt-1 text-xs text-[#64748b]">
              12 Fixtures • Single Round-Robin. Top 2 advance to Qualifier 1; 3rd & 4th to Eliminator.
            </p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#1e1e3a]">
              <div
                className="h-full bg-gradient-to-r from-[#06b6d4] to-[#34d399]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Milestone 2: Double-Elimination Playoffs */}
          <div className="relative rounded-2xl border border-[#7c3aed]/30 bg-[#080812] p-5">
            <div className="flex items-center justify-between">
              <span className="rounded bg-[#7c3aed]/20 px-2 py-0.5 text-[9px] font-black uppercase text-[#a78bfa]">
                PHASE 2
              </span>
              <span className="text-xs font-black text-[#a78bfa]">
                {groupCompleted === 12 ? "UNLOCKED" : "LOCKED"}
              </span>
            </div>
            <h4 className="mt-3 text-base font-black uppercase text-white">
              IPL Playoffs
            </h4>
            <p className="mt-1 text-xs text-[#64748b]">
              3 Matches (Q1, Eliminator, Q2). Top seeds get two chances to qualify for the Grand Final.
            </p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#1e1e3a]">
              <div
                className="h-full bg-[#7c3aed]"
                style={{ width: groupCompleted === 12 ? "30%" : "0%" }}
              />
            </div>
          </div>

          {/* Milestone 3: Grand Final */}
          <div className="relative rounded-2xl border border-[#f59e0b]/30 bg-[#080812] p-5">
            <div className="flex items-center justify-between">
              <span className="rounded bg-[#f59e0b]/20 px-2 py-0.5 text-[9px] font-black uppercase text-[#fbbf24]">
                CHAMPIONSHIP
              </span>
              <span className="text-xs font-black text-[#fbbf24]">
                OCT 23
              </span>
            </div>
            <h4 className="mt-3 text-base font-black uppercase text-white">
              Grand Final
            </h4>
            <p className="mt-1 text-xs text-[#64748b]">
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

      {/* ══════════════════════════════════════════════════════════════════
          5. BROADCAST STANDINGS DECK
      ══════════════════════════════════════════════════════════════════ */}
      <section className="overflow-hidden rounded-3xl border border-[#1e1e3a] bg-[#0c0c18]/90 backdrop-blur-xl">
        <div className="border-b border-[#1e1e3a] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#f59e0b]">
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
                    className={`rounded-xl border px-4 py-2 text-[10px] font-black tracking-widest uppercase transition ${
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
                <tr className="border-b border-[#1e1e3a] bg-[#080812] text-[10px] font-black uppercase tracking-widest text-[#64748b]">
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Franchise</th>
                  <th className="px-4 py-4 text-center">Played</th>
                  <th className="px-4 py-4 text-center">Won</th>
                  <th className="px-4 py-4 text-center">Lost</th>
                  <th className="px-4 py-4 text-center">Round Diff</th>
                  <th className="px-6 py-4 text-center">Total Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e3a] text-sm font-semibold">
                {standings.map((s, i) => {
                  const isUpperBracket = i < 2;
                  const isLowerBracket = i >= 2 && i < 4;

                  const rankStyle =
                    i === 0
                      ? "border-l-4 border-l-[#f59e0b] bg-[#f59e0b]/5"
                      : i === 1
                      ? "border-l-4 border-l-[#38bdf8] bg-[#38bdf8]/5"
                      : i === 2
                      ? "border-l-4 border-l-[#d97706] bg-[#d97706]/5"
                      : "border-l-4 border-l-[#475569]";

                  return (
                    <tr
                      key={s.team.id}
                      className={`transition hover:bg-[#080812]/70 ${rankStyle}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${
                              i === 0
                                ? "bg-[#f59e0b]/20 text-[#fbbf24]"
                                : i === 1
                                ? "bg-[#38bdf8]/20 text-[#38bdf8]"
                                : i === 2
                                ? "bg-[#d97706]/20 text-[#fbbf24]"
                                : "bg-[#1e1e3a] text-[#64748b]"
                            }`}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {isUpperBracket && (
                            <span className="hidden sm:inline-block rounded bg-[#10b981]/15 px-2 py-0.5 text-[8px] font-black uppercase text-[#34d399]">
                              UPPER BRACKET
                            </span>
                          )}
                          {isLowerBracket && (
                            <span className="hidden sm:inline-block rounded bg-[#f59e0b]/15 px-2 py-0.5 text-[8px] font-black uppercase text-[#fbbf24]">
                              LOWER BRACKET
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <Link
                          href={`/tournament/teams/${encodeURIComponent(s.team.id)}`}
                          className="group flex items-center gap-3.5"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#1e1e3a] bg-[#080812] group-hover:border-[#7c3aed]">
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
                              <span className="text-xs font-black text-[#7c3aed]">
                                {s.team.tag.slice(0, 3)}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-black uppercase text-white group-hover:text-[#22d3ee] transition-colors">
                              {s.team.name}
                            </p>
                            <p className="text-[10px] font-bold uppercase text-[#64748b]">
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

                      <td className="px-4 py-4 text-center font-bold text-[#22d3ee]">
                        {s.roundDifference > 0
                          ? `+${s.roundDifference}`
                          : s.roundDifference}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="inline-block rounded-xl border border-[#f59e0b]/40 bg-[#f59e0b]/15 px-3 py-1 text-sm font-black text-[#fbbf24]">
                          {s.points} PTS
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Qualification Footer Legend */}
            <div className="flex flex-wrap items-center gap-6 border-t border-[#1e1e3a] bg-[#080812] px-6 py-3 text-[10px] font-black uppercase tracking-wider text-[#64748b]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                <span>Top 2 Advance to Upper Bracket (Q1)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                <span>3rd & 4th Advance to Eliminator (Lower Bracket)</span>
              </div>
            </div>
          </div>
        )}

        {/* Qualifiers path view */}
        {standingsView === "qualifiers" && (
          <div className="grid gap-6 p-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[#7c3aed]/30 bg-[#080812] p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#a78bfa]">
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
                      <div className="text-xs font-black uppercase text-white">
                        {item.team.name}
                      </div>
                      <div className="mt-0.5 text-[9px] font-bold text-[#64748b]">
                        STANDINGS SEED #{i + 1}
                      </div>
                    </div>
                    <span
                      className={`rounded-lg px-2.5 py-1 text-[9px] font-black uppercase ${
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
                <div className="rounded-2xl border border-[#1e1e3a] bg-[#080812] p-10 text-center text-xs text-[#64748b]">
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
                <p className="mt-3 text-xs font-black uppercase tracking-[0.25em] text-[#fbbf24]">
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
          6. SPONSORS & OFFICIAL PARTNERS - MODERN 4-CARD DECK
      ══════════════════════════════════════════════════════════════════ */}
      <section className="rounded-3xl border border-[#1e1e3a] bg-[#0c0c18]/90 p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e1e3a] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ff4d6a]">
                OFFICIAL PARTNERS
              </span>
              <span className="rounded-full border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-2 py-0.5 text-[8px] font-black uppercase text-[#fbbf24]">
                4 CHAMPIONSHIP SPONSORS
              </span>
            </div>
            <h4 className="mt-1 text-2xl font-black uppercase tracking-tight text-white">
              Tournament Sponsors
            </h4>
          </div>
          <span className="rounded-full border border-[#1e1e3a] bg-[#080812] px-3.5 py-1 text-[10px] font-black text-[#94a3b8]">
            PRESENTED BY XMD FAMILY
          </span>
        </div>

        {/* 4 Dedicated Sponsor Cards */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. SHEIKH KUNJAPPU */}
          <div className="group relative flex flex-col items-center justify-between overflow-hidden rounded-2xl border border-[#ff2d55]/50 bg-gradient-to-b from-[#ff2d55]/15 via-[#0c0c18] to-[#080812] p-6 text-center transition hover:border-[#f59e0b] hover:shadow-[0_0_35px_rgba(255,45,85,0.25)]">
            <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#ff2d55]/20 blur-2xl" />

            <span className="rounded-full border border-[#f59e0b]/50 bg-[#f59e0b]/15 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[#fbbf24] shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              ★ TITLE SPONSOR
            </span>

            <div className="my-5 relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#f59e0b]/60 bg-[#080812] shadow-[0_0_30px_rgba(255,45,85,0.35)] transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/sponsors/sheikh-kunjappu.jpg"
                alt="Sheikh Kunjappu"
                width={112}
                height={112}
                unoptimized
                className="h-full w-full object-cover"
              />
            </div>

            <div>
              <h5 className="text-lg font-black uppercase tracking-tight text-white group-hover:text-[#fbbf24] transition-colors">
                Sheikh Kunjappu
              </h5>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#ff6080]">
                Title Partner & Championship Patron
              </p>
            </div>
          </div>

          {/* 2. OSDF CLAN */}
          <div className="group relative flex flex-col items-center justify-between overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/80 p-6 text-center transition hover:border-white/50 hover:shadow-[0_0_25px_rgba(255,255,255,0.1)]">
            <span className="rounded-full border border-[#1e1e3a] bg-[#080812] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[#94a3b8]">
              COMMUNITY PARTNER
            </span>

            <div className="my-5 flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#94a3b8]/40 bg-[#080812] p-3 shadow-[0_0_25px_rgba(255,255,255,0.1)] transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/sponsors/osdf-clan.png"
                alt="OSDF Clan"
                width={112}
                height={112}
                unoptimized
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <h5 className="text-lg font-black uppercase tracking-tight text-white group-hover:text-[#f1f5f9] transition-colors">
                OSDF Clan
              </h5>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                Official Clan & Community Sponsor
              </p>
            </div>
          </div>

          {/* 3. DEUZ X GAMING */}
          <div className="group relative flex flex-col items-center justify-between overflow-hidden rounded-2xl border border-[#7c3aed]/40 bg-[#0c0c18]/80 p-6 text-center transition hover:border-[#7c3aed] hover:shadow-[0_0_25px_rgba(124,58,237,0.2)]">
            <span className="rounded-full border border-[#7c3aed]/30 bg-[#7c3aed]/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[#a78bfa]">
              GAMING PARTNER
            </span>

            <div className="my-5 flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#7c3aed]/50 bg-[#080812] p-2.5 shadow-[0_0_25px_rgba(124,58,237,0.25)] transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/sponsors/deuz-x.png"
                alt="Deuz X Gaming"
                width={112}
                height={112}
                unoptimized
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <h5 className="text-lg font-black uppercase tracking-tight text-white group-hover:text-[#a78bfa] transition-colors">
                Deuz X Gaming
              </h5>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#9d63ff]">
                Esports Media & Gaming Partner
              </p>
            </div>
          </div>

          {/* 4. AGON DESANTOS */}
          <div className="group relative flex flex-col items-center justify-between overflow-hidden rounded-2xl border border-[#06b6d4]/40 bg-[#0c0c18]/80 p-6 text-center transition hover:border-[#06b6d4] hover:shadow-[0_0_25px_rgba(6,182,212,0.2)]">
            <span className="rounded-full border border-[#06b6d4]/30 bg-[#06b6d4]/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[#22d3ee]">
              ELITE SPONSOR
            </span>

            <div className="my-5 flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#06b6d4]/50 bg-[#080812] p-1 shadow-[0_0_25px_rgba(6,182,212,0.25)] transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/sponsors/agon-desantos.png"
                alt="Agon Desantos"
                width={112}
                height={112}
                unoptimized
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <h5 className="text-lg font-black uppercase tracking-tight text-white group-hover:text-[#22d3ee] transition-colors">
                Agon Desantos
              </h5>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#06b6d4]">
                Championship Supporter & Sponsor
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

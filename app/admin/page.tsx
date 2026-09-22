"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import type { Match, Team, TournamentSettings } from "@/lib/types";
import { defaultSettings } from "@/lib/api";
import { StatusBadge } from "@/app/tournament/components/ui/status-badge";
import { getGameDefinition } from "@/lib/games/registry";

export default function AdminHubPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [settings, setSettings] = useState<TournamentSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [fixtureFilter, setFixtureFilter] = useState<"all" | "pending" | "completed">("all");

  const game = useMemo(() => getGameDefinition(settings?.gameId), [settings?.gameId]);

  useEffect(() => {
    let active = true;

    async function fetchDashboard() {
      try {
        const [teamsRes, matchesRes, settingsRes] = await Promise.all([
          fetch("/api/teams", { cache: "no-store" }),
          fetch("/api/matches", { cache: "no-store" }),
          fetch("/api/settings", { cache: "no-store" }),
        ]);

        if (teamsRes.ok) {
          const t = await teamsRes.json();
          if (active && Array.isArray(t)) setTeams(t);
        }
        if (matchesRes.ok) {
          const m = await matchesRes.json();
          if (active && Array.isArray(m)) setMatches(m);
        }
        if (settingsRes.ok) {
          const s = await settingsRes.json();
          if (active && s?.tournamentName) setSettings(s);
        }
      } catch (err) {
        console.error("Error loading admin dashboard:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchDashboard();
    return () => { active = false; };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    }
  }

  const completedMatches = matches.filter((m) => m.status === "Completed");
  const liveMatches      = matches.filter((m) => m.status === "Live");
  const scheduledMatches = matches.filter((m) => m.status === "Scheduled");

  const totalPlayers = teams.reduce(
    (acc, team) => acc + (team.players?.length || 0), 0
  );

  const filteredMatches = useMemo(() => {
    if (fixtureFilter === "completed") {
      return matches.filter((m) => m.status === "Completed");
    }
    if (fixtureFilter === "pending") {
      return matches.filter((m) => m.status === "Scheduled" || m.status === "Live");
    }
    return matches;
  }, [matches, fixtureFilter]);

  return (
    <div className="relative min-h-screen text-[#f1f5f9] pb-16">
      {/* ── Ambient Neon Glow Orbs ────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#7c3aed]/12 blur-[180px]" />
        <div className="absolute top-1/4 -right-40 h-[500px] w-[500px] rounded-full bg-[#ff2d55]/10 blur-[160px]" />
        <div className="absolute bottom-10 left-1/3 h-[500px] w-[500px] rounded-full bg-[#06b6d4]/8 blur-[160px]" />
      </div>

      {/* ── Modern Command Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#030308]/85 px-4 py-3 backdrop-blur-2xl sm:px-8 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3.5">
            <div
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] text-lg font-black text-white shadow-inner transition hover:scale-105 hover:border-white/25"
            >
              <span className="drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">{game.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight sm:text-lg text-white">
                  ADMIN HUB{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff2d55] to-[#9d63ff]">
                    // COMMAND CENTER
                  </span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-mono font-bold tracking-wider text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  SYSTEM ACTIVE
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {game.name} Operations Hub • Cloud Synchronization
              </p>
            </div>
          </div>

          {/* Quick Nav Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/tournament"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[11px] font-bold tracking-wider text-slate-300 backdrop-blur-xl transition hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-300 hover:scale-[1.02]"
            >
              <span>PUBLIC SITE</span>
              <span className="text-xs">↗</span>
            </Link>

            <Link
              href="/matches"
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-gradient-to-r from-rose-600/25 to-rose-600/15 px-4 py-1.5 text-[11px] font-bold tracking-wider text-rose-300 backdrop-blur-xl transition hover:border-rose-400 hover:bg-rose-600/35 hover:text-white hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:scale-[1.02]"
            >
              <span>MATCH CENTRE</span>
              <span className="text-xs">↗</span>
            </Link>

            <Link
              href="/teams"
              className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-gradient-to-r from-purple-600/25 to-purple-600/15 px-4 py-1.5 text-[11px] font-bold tracking-wider text-purple-300 backdrop-blur-xl transition hover:border-purple-400 hover:bg-purple-600/35 hover:text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:scale-[1.02]"
            >
              <span>TEAMS & ROSTERS</span>
              <span className="text-xs">↗</span>
            </Link>

            <Link
              href="/admin/settings"
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-gradient-to-r from-amber-600/25 to-amber-600/15 px-4 py-1.5 text-[11px] font-bold tracking-wider text-amber-300 backdrop-blur-xl transition hover:border-amber-400 hover:bg-amber-600/35 hover:text-white hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:scale-[1.02]"
            >
              <span>SETTINGS</span>
              <span className="text-xs">⚙</span>
            </Link>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/25 bg-rose-500/5 px-4 py-1.5 text-[11px] font-bold tracking-wider text-rose-400 transition hover:bg-rose-500/20 hover:text-rose-300 disabled:opacity-50"
            >
              {loggingOut ? "LOGGING OUT…" : "LOGOUT"}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content Container ───────────────────────────────────────── */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-8 space-y-7">

        {/* ── KPI Metric Cards ────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: "REGISTERED TEAMS",
              value: loading ? "…" : teams.length,
              sub: `${totalPlayers} players registered`,
              accentColor: "text-[#22d3ee]",
              glowColor: "rgba(6,182,212,0.15)",
              border: "border-[#06b6d4]/25 hover:border-[#06b6d4]/60",
              tag: "ROSTERS",
              tagClass: "text-[#06b6d4] bg-[#06b6d4]/10 border-[#06b6d4]/20",
            },
            {
              label: "COMPLETED MATCHES",
              value: loading ? "…" : completedMatches.length,
              sub: `of ${matches.length} total fixtures`,
              accentColor: "text-[#34d399]",
              glowColor: "rgba(16,185,129,0.15)",
              border: "border-[#10b981]/25 hover:border-[#10b981]/60",
              tag: "PLAYED",
              tagClass: "text-[#10b981] bg-[#10b981]/10 border-[#10b981]/20",
            },
            {
              label: "LIVE FIXTURES",
              value: loading ? "…" : liveMatches.length,
              sub: `${scheduledMatches.length} fixtures upcoming`,
              accentColor: "text-[#ff4d6a]",
              glowColor: "rgba(255,45,85,0.2)",
              border: "border-[#ff2d55]/30 hover:border-[#ff2d55]/70",
              tag: liveMatches.length > 0 ? "LIVE NOW" : "STANDBY",
              tagClass: liveMatches.length > 0
                ? "text-[#ff4d6a] bg-[#ff2d55]/15 border-[#ff2d55]/30 animate-pulse"
                : "text-[#64748b] bg-[#1e1e3a]/40 border-[#1e1e3a]",
            },
            {
              label: "PRIZE POOL",
              value: settings.prizePool || "—",
              sub: settings.tournamentName || "Tournament Pool",
              accentColor: "text-[#fbbf24]",
              glowColor: "rgba(245,158,11,0.15)",
              border: "border-[#f59e0b]/25 hover:border-[#f59e0b]/60",
              tag: "REWARD",
              tagClass: "text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`group relative overflow-hidden rounded-2xl border ${card.border} bg-[#0c0c18]/85 p-5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02]`}
              style={{
                boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 25px ${card.glowColor}`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748b]">
                  {card.label}
                </span>
                <span className={`rounded-md border px-2 py-0.5 text-[9px] font-black tracking-widest ${card.tagClass}`}>
                  {card.tag}
                </span>
              </div>

              <div className={`mt-3 text-4xl font-black tracking-tight sm:text-5xl ${card.accentColor}`}>
                {card.value}
              </div>

              <div className="mt-2 truncate text-xs text-[#64748b]">
                {card.sub}
              </div>

              {/* Bottom decorative neon accent line */}
              <div
                className="absolute bottom-0 inset-x-0 h-[2px] opacity-40 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: `linear-gradient(90deg, transparent, ${card.accentColor.includes("22d3ee") ? "#06b6d4" : card.accentColor.includes("34d399") ? "#10b981" : card.accentColor.includes("ff4d6a") ? "#ff2d55" : "#f59e0b"}, transparent)`,
                }}
              />
            </div>
          ))}
        </section>

        {/* ── Status & Announcement Control Banner ─────────────────────────── */}
        <section className="overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
          <div className="grid gap-6 p-6 sm:grid-cols-3 sm:items-center">
            {/* Status box */}
            <div className="sm:border-r sm:border-[#1e1e3a] sm:pr-6">
              <div className="text-[9px] font-black uppercase tracking-[0.25em] text-[#64748b]">
                TOURNAMENT STATUS
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#ff2d55]/20 border border-[#ff2d55]/50">
                  <span className="h-2 w-2 rounded-full bg-[#ff2d55] animate-ping" />
                </span>
                <span className="text-2xl font-black uppercase tracking-tight text-white">
                  {settings.tournamentStatus || "UPCOMING"}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-[#64748b]">
                {settings.tournamentName}
              </div>
            </div>

            {/* Announcement text */}
            <div className="sm:col-span-2 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#f59e0b]">
                    BROADCAST ANNOUNCEMENT
                  </span>
                  <Link
                    href="/admin/settings"
                    className="inline-flex items-center gap-1 text-[10px] font-black tracking-widest text-[#7c3aed] transition hover:text-[#9d63ff]"
                  >
                    <span>EDIT</span>
                    <span>⚙</span>
                  </Link>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#cbd5e1]">
                  {settings.announcement || "No active tournament broadcast announcement set."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[10px] text-[#64748b]">
                <span>Tagline: <strong className="text-[#94a3b8]">{settings.tagline || "—"}</strong></span>
                <span>•</span>
                <span>Organizer: <strong className="text-[#94a3b8]">{settings.organizerName || "—"}</strong></span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Main Operations Grid ─────────────────────────────────────────── */}
        <div className="grid gap-7 lg:grid-cols-[380px_1fr]">
          {/* Left Column: Quick Actions */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-6 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
              <div className="flex items-center justify-between border-b border-[#1e1e3a] pb-4">
                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#64748b]">
                    OPERATIONS
                  </h2>
                  <div className="text-base font-black text-white">
                    Quick Actions
                  </div>
                </div>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#7c3aed]/30 bg-[#7c3aed]/10 text-xs font-black text-[#9d63ff]">
                  ⚡
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  {
                    href: "/matches",
                    icon: "📸",
                    title: "Record Match via OCR",
                    desc: "Upload scoreboard screenshot to auto-parse stats & ACS.",
                    badge: "FAST PARSER",
                    hoverBorder: "hover:border-[#ff2d55]/60 hover:bg-[#ff2d55]/5",
                    arrowColor: "text-[#ff4d6a]",
                  },
                  {
                    href: "/teams",
                    icon: "👥",
                    title: "Manage Teams & Rosters",
                    desc: "Configure 6-man team lineups, captains, and seeds.",
                    badge: "TEAMS",
                    hoverBorder: "hover:border-[#06b6d4]/60 hover:bg-[#06b6d4]/5",
                    arrowColor: "text-[#22d3ee]",
                  },
                  {
                    href: "/admin/settings",
                    icon: "⚙️",
                    title: "Branding & Prize Pool",
                    desc: "Update tournament dates, name, prize money, and logos.",
                    badge: "CONFIG",
                    hoverBorder: "hover:border-[#f59e0b]/60 hover:bg-[#f59e0b]/5",
                    arrowColor: "text-[#fbbf24]",
                  },
                  {
                    href: "/tournament",
                    icon: "🌐",
                    title: "View Live Public Site",
                    desc: "Check public leaderboards, standings, and brackets.",
                    badge: "PREVIEW",
                    hoverBorder: "hover:border-[#10b981]/60 hover:bg-[#10b981]/5",
                    arrowColor: "text-[#34d399]",
                  },
                ].map((action) => (
                  <Link
                    key={action.title}
                    href={action.href}
                    className={`group flex items-center justify-between rounded-xl border border-[#1e1e3a] bg-[#030308]/70 p-4 transition-all duration-200 ${action.hoverBorder} hover:scale-[1.01]`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#1e1e3a] bg-[#0c0c18] text-base shadow-sm">
                        {action.icon}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#f1f5f9] group-hover:text-white">
                            {action.title}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#64748b] leading-tight">
                          {action.desc}
                        </p>
                      </div>
                    </div>

                    <span className={`text-lg font-bold transition-transform duration-200 group-hover:translate-x-1 ${action.arrowColor}`}>
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Fixtures & Scores Control Deck */}
          <div className="overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
            {/* Control Deck Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e1e3a] px-6 py-4">
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#64748b]">
                  MATCH CONTROL DECK
                </h2>
                <div className="text-base font-black text-white">
                  Fixtures & Score Recording
                </div>
              </div>

              {/* Filter Tabs & Link */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-xl border border-[#1e1e3a] bg-[#030308] p-1">
                  {(["all", "pending", "completed"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setFixtureFilter(tab)}
                      className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest transition ${
                        fixtureFilter === tab
                          ? "bg-[#ff2d55]/15 text-[#ff4d6a] border border-[#ff2d55]/30 shadow-[0_0_10px_rgba(255,45,85,0.2)]"
                          : "text-[#64748b] hover:text-[#f1f5f9]"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <Link
                  href="/matches"
                  className="rounded-xl border border-[#1e1e3a] bg-[#030308] px-3.5 py-1.5 text-[10px] font-black tracking-widest text-[#94a3b8] transition hover:border-[#7c3aed]/50 hover:text-[#9d63ff]"
                >
                  FULL CENTER →
                </Link>
              </div>
            </div>

            {/* Match Feed List */}
            <div className="divide-y divide-[#1e1e3a]/60 max-h-[580px] overflow-y-auto">
              {filteredMatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#1e1e3a] bg-[#030308] text-xl text-[#475569] mb-3">
                    🎮
                  </div>
                  <div className="text-sm font-bold text-[#64748b]">
                    {loading ? "Loading fixture control deck…" : "No fixtures found for selected filter."}
                  </div>
                  <p className="mt-1 text-xs text-[#334155]">
                    Switch tabs or add new fixtures in Match Manager.
                  </p>
                </div>
              ) : (
                filteredMatches.slice(0, 12).map((match) => {
                  const t1 = teams.find((t) => t.id === match.team1Id);
                  const t2 = teams.find((t) => t.id === match.team2Id);
                  const isCompleted = match.status === "Completed";
                  const isLive = match.status === "Live";

                  return (
                    <div
                      key={match.id}
                      className="group flex flex-wrap items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-[#030308]/60"
                    >
                      {/* Left: Match Number & Teams */}
                      <div className="flex items-center gap-4">
                        {/* Match Slot Badge */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#1e1e3a] bg-[#030308] text-xs font-black text-[#94a3b8] group-hover:border-[#7c3aed]/40 group-hover:text-[#9d63ff]">
                          M{String(match.matchNumber).padStart(2, "0")}
                        </div>

                        {/* Teams Info with Logo Avatars */}
                        <div>
                          <div className="flex items-center gap-3">
                            {/* Team 1 */}
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#1e1e3a] bg-[#030308]">
                                {t1?.logo ? (
                                  <Image
                                    src={t1.logo}
                                    alt={t1.name}
                                    width={24}
                                    height={24}
                                    unoptimized
                                    className="h-full w-full object-contain"
                                  />
                                ) : (
                                  <span className="text-[8px] font-black text-[#7c3aed]">
                                    {t1?.tag?.slice(0, 3) || "TBD"}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm font-bold text-white">
                                {t1?.name || "TBD"}
                              </span>
                            </div>

                            <span className="text-xs font-black text-[#475569]">VS</span>

                            {/* Team 2 */}
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#1e1e3a] bg-[#030308]">
                                {t2?.logo ? (
                                  <Image
                                    src={t2.logo}
                                    alt={t2.name}
                                    width={24}
                                    height={24}
                                    unoptimized
                                    className="h-full w-full object-contain"
                                  />
                                ) : (
                                  <span className="text-[8px] font-black text-[#7c3aed]">
                                    {t2?.tag?.slice(0, 3) || "TBD"}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm font-bold text-white">
                                {t2?.name || "TBD"}
                              </span>
                            </div>
                          </div>

                          {/* Stage, Map, Format meta tags */}
                          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-[#64748b]">
                            <span className="font-semibold text-[#94a3b8]">{match.stage}</span>
                            <span>•</span>
                            <span className="rounded bg-[#1e1e3a]/50 px-1.5 py-0.2 text-[#22d3ee] font-bold">
                              {match.map || "MAP TBD"}
                            </span>
                            <span>•</span>
                            <span>BO{match.bestOf}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Score / Status & Action Button */}
                      <div className="flex items-center gap-3.5">
                        {isCompleted ? (
                          <div className="flex items-center gap-2 rounded-lg border border-[#10b981]/20 bg-[#10b981]/10 px-3 py-1">
                            <span className="text-sm font-black text-[#34d399]">
                              {match.team1Score} - {match.team2Score}
                            </span>
                          </div>
                        ) : (
                          <StatusBadge status={match.status} />
                        )}

                        <Link
                          href={`/matches/${match.id}`}
                          className={`rounded-xl px-3.5 py-2 text-[10px] font-black tracking-widest transition-all ${
                            isCompleted
                              ? "border border-[#1e1e3a] bg-[#0c0c18] text-[#94a3b8] hover:border-[#2e2e5a] hover:text-white"
                              : "border border-[#ff2d55]/40 bg-[#ff2d55]/10 text-[#ff4d6a] hover:bg-[#ff2d55]/20 hover:shadow-[0_0_15px_rgba(255,45,85,0.25)]"
                          }`}
                        >
                          {isCompleted ? "EDIT STATS ↗" : "RECORD SCORE ⚡"}
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

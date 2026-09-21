"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Match, Team, TournamentSettings } from "@/lib/types";
import { defaultSettings } from "@/lib/api";
import { teams as defaultTeams } from "@/app/data/teams";
import { matches as defaultMatches } from "@/app/data/matches";
import { StatusBadge } from "@/app/tournament/components/ui/status-badge";

export default function AdminHubPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>(defaultTeams);
  const [matches, setMatches] = useState<Match[]>(defaultMatches);
  const [settings, setSettings] = useState<TournamentSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchDashboard() {
      try {
        const [teamsRes, matchesRes, settingsRes] = await Promise.all([
          fetch("/api/teams?lite=1", { cache: "no-store" }),
          fetch("/api/matches", { cache: "no-store" }),
          fetch("/api/settings", { cache: "no-store" }),
        ]);

        if (teamsRes.ok) {
          const t = await teamsRes.json();
          if (active && Array.isArray(t) && t.length > 0) setTeams(t);
        }
        if (matchesRes.ok) {
          const m = await matchesRes.json();
          if (active && Array.isArray(m) && m.length > 0) setMatches(m);
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

  return (
    <div className="valorant-page min-h-screen bg-[#030308] text-[#f1f5f9]">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#7c3aed]/7 blur-[180px]" />
        <div className="absolute -right-40 top-10 h-[500px] w-[500px] rounded-full bg-[#ff2d55]/6 blur-[160px]" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[400px] rounded-full bg-[#06b6d4]/5 blur-[140px]" />
      </div>

      {/* ── Admin Header ───────────────────────────────────────────── */}
      <header className="relative border-b border-[#1e1e3a] bg-[#030308]/95 px-6 py-4 backdrop-blur-xl sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ff2d55]/40 bg-[#ff2d55]/10 text-sm font-black text-[#ff2d55]"
              style={{ boxShadow: "0 0 16px rgba(255,45,85,0.15)" }}
            >
              V
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">
                TOURNAMENT{" "}
                <span className="text-[#ff2d55]">// ADMIN HUB</span>
              </h1>
              <p className="text-[10px] text-[#475569]">
                Valorant Esports Control Center • Cloud Database Sync
              </p>
            </div>
          </div>

          {/* Nav actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/tournament"
              target="_blank"
              className="rounded-lg border border-[#1e1e3a] bg-[#0c0c18] px-3.5 py-2 text-[10px] font-black tracking-widest text-[#64748b] transition hover:border-[#06b6d4]/50 hover:text-[#22d3ee]"
            >
              PUBLIC SITE ↗
            </Link>
            <Link
              href="/matches"
              className="rounded-lg border border-[#ff2d55]/40 bg-[#ff2d55]/10 px-3.5 py-2 text-[10px] font-black tracking-widest text-[#ff4d6a] transition hover:bg-[#ff2d55]/25"
            >
              MATCH MANAGER ↗
            </Link>
            <Link
              href="/teams"
              className="rounded-lg border border-[#1e1e3a] bg-[#0c0c18] px-3.5 py-2 text-[10px] font-black tracking-widest text-[#64748b] transition hover:border-[#2e2e5a] hover:text-[#f1f5f9]"
            >
              TEAMS & ROSTERS ↗
            </Link>
            <Link
              href="/admin/settings"
              className="rounded-lg border border-[#1e1e3a] bg-[#0c0c18] px-3.5 py-2 text-[10px] font-black tracking-widest text-[#64748b] transition hover:border-[#2e2e5a] hover:text-[#f1f5f9]"
            >
              SETTINGS ⚙
            </Link>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-lg border border-[#ff2d55]/30 bg-[#ff2d55]/8 px-3.5 py-2 text-[10px] font-black tracking-widest text-[#ff4d6a] transition hover:bg-[#ff2d55]/20 disabled:opacity-50"
            >
              {loggingOut ? "LOGGING OUT…" : "LOGOUT"}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────────────── */}
      <main className="relative mx-auto max-w-7xl px-6 py-8 sm:px-10 space-y-8">

        {/* KPI Cards */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "REGISTERED TEAMS",  value: loading ? "…" : teams.length,            sub: `${totalPlayers} players total`,              accent: "text-[#22d3ee]",  border: "border-[#06b6d4]/20" },
            { label: "COMPLETED MATCHES", value: loading ? "…" : completedMatches.length, sub: `of ${matches.length} total fixtures`,         accent: "text-[#34d399]",  border: "border-[#10b981]/20" },
            { label: "LIVE NOW",          value: loading ? "…" : liveMatches.length,      sub: `${scheduledMatches.length} upcoming`,         accent: "text-[#ff4d6a]",  border: "border-[#ff2d55]/25" },
            { label: "PRIZE POOL",        value: settings.prizePool || "—",               sub: settings.tournamentName,                       accent: "text-[#fbbf24]",  border: "border-[#f59e0b]/20" },
          ].map((card) => (
            <div key={card.label} className={`rounded-xl border ${card.border} bg-[#0c0c18] p-5`}>
              <div className="text-[9px] font-black uppercase tracking-[0.25em] text-[#334155]">
                {card.label}
              </div>
              <div className={`mt-2 text-3xl font-black tracking-tight sm:text-4xl ${card.accent}`}>
                {card.value}
              </div>
              <div className="mt-1 truncate text-[10px] text-[#334155]">{card.sub}</div>
            </div>
          ))}
        </section>

        {/* Status + Tournament Info row */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#1e1e3a] bg-[#0c0c18] p-5">
            <div className="text-[9px] font-black uppercase tracking-widest text-[#334155]">STATUS</div>
            <div className="mt-3 flex items-center gap-3">
              {settings.tournamentStatus === "Live" && (
                <span className="live-dot h-2.5 w-2.5 flex-shrink-0" />
              )}
              <span className="text-xl font-black uppercase">
                {settings.tournamentStatus}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-[#1e1e3a] bg-[#0c0c18] p-5 sm:col-span-2">
            <div className="text-[9px] font-black uppercase tracking-widest text-[#334155]">CURRENT ANNOUNCEMENT</div>
            <p className="mt-3 text-sm leading-relaxed text-[#94a3b8]">
              {settings.announcement || "No active tournament announcement."}
            </p>
            <Link
              href="/admin/settings"
              className="mt-3 inline-block text-[10px] font-black tracking-widest text-[#7c3aed] transition hover:text-[#9d63ff]"
            >
              Update Announcement →
            </Link>
          </div>
        </section>

        {/* Main grid */}
        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          {/* Quick Actions */}
          <div className="space-y-4">
            <div className="rounded-xl border border-[#1e1e3a] bg-[#0c0c18] p-6">
              <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#334155]">QUICK ACTIONS</h2>
              <p className="mt-1 text-xs text-[#475569]">Common tournament management operations.</p>

              <div className="mt-5 flex flex-col gap-3">
                {[
                  {
                    href:    "/matches",
                    emoji:   "📸",
                    title:   "Record Match via OCR Scoreboard",
                    desc:    "Upload screenshot to parse player stats & scores.",
                    accent:  "hover:border-[#ff2d55]/60 hover:bg-[#ff2d55]/5",
                    arrow:   "text-[#ff4d6a]",
                  },
                  {
                    href:    "/teams",
                    emoji:   "👥",
                    title:   "Manage Teams & Players",
                    desc:    "Add teams, configure 6-man rosters and captain roles.",
                    accent:  "hover:border-[#06b6d4]/60 hover:bg-[#06b6d4]/5",
                    arrow:   "text-[#22d3ee]",
                  },
                  {
                    href:    "/admin/settings",
                    emoji:   "⚙️",
                    title:   "Tournament Branding & Dates",
                    desc:    "Edit title, banner, prize pool, and announcements.",
                    accent:  "hover:border-[#f59e0b]/60 hover:bg-[#f59e0b]/5",
                    arrow:   "text-[#fbbf24]",
                  },
                ].map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={`flex items-center justify-between rounded-xl border border-[#1e1e3a] bg-[#030308] p-4 text-left transition ${action.accent}`}
                  >
                    <div>
                      <div className="text-sm font-bold">
                        {action.emoji} {action.title}
                      </div>
                      <div className="mt-0.5 text-[10px] text-[#475569]">{action.desc}</div>
                    </div>
                    <span className={`text-lg ${action.arrow}`}>→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Fixtures overview */}
          <div className="overflow-hidden rounded-xl border border-[#1e1e3a] bg-[#0c0c18]">
            <div className="flex items-center justify-between border-b border-[#1e1e3a] px-6 py-4">
              <div>
                <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#334155]">FIXTURES & SCORES</h2>
                <p className="text-[10px] text-[#475569]">
                  {scheduledMatches.length} pending · {completedMatches.length} completed
                </p>
              </div>
              <Link
                href="/matches"
                className="rounded-lg border border-[#1e1e3a] bg-[#030308] px-3 py-1.5 text-[10px] font-black tracking-widest text-[#64748b] transition hover:border-[#2e2e5a] hover:text-[#f1f5f9]"
              >
                Full Match Center →
              </Link>
            </div>

            <div className="max-h-[600px] divide-y divide-[#1e1e3a] overflow-y-auto">
              {matches.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-[#334155]">
                  {loading ? "Loading fixtures…" : "No matches configured."}
                </div>
              ) : (
                matches.slice(0, 12).map((match) => {
                  const t1 = teams.find((t) => t.id === match.team1Id);
                  const t2 = teams.find((t) => t.id === match.team2Id);

                  return (
                    <div
                      key={match.id}
                      className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 transition hover:bg-[#030308]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1e1e3a] text-[10px] font-black text-[#475569]">
                          {match.matchNumber}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 text-sm font-bold">
                            <span>{t1?.name || "TBD"}</span>
                            <span className="text-[#334155]">vs</span>
                            <span>{t2?.name || "TBD"}</span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[9px] text-[#475569]">
                            <span>{match.stage}</span>
                            <span>·</span>
                            <span>{match.map || "TBD"}</span>
                            <span>·</span>
                            <span>BO{match.bestOf}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {match.status === "Completed" ? (
                          <span className="text-sm font-black text-[#34d399]">
                            {match.team1Score} – {match.team2Score}
                          </span>
                        ) : (
                          <StatusBadge status={match.status} />
                        )}

                        <Link
                          href={`/matches/${match.id}`}
                          className="rounded-lg border border-[#ff2d55]/40 bg-[#ff2d55]/8 px-3 py-1.5 text-[10px] font-black tracking-widest text-[#ff4d6a] transition hover:bg-[#ff2d55]/20"
                        >
                          {match.status === "Completed" ? "Edit Stats" : "Record Score"}
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
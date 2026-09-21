"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Match, Team, TournamentSettings } from "@/lib/types";
import { defaultSettings } from "@/lib/api";

export default function AdminHubPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [settings, setSettings] = useState<TournamentSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchDashboard() {
      try {
        const [teamsRes, matchesRes, settingsRes] = await Promise.all([
          fetch("/api/teams", { cache: "no-store" }),
          fetch("/api/matches", { cache: "no-store" }),
          fetch("/api/settings", { cache: "no-store" }),
        ]);

        if (!active) return;

        if (teamsRes.ok) {
          const t = await teamsRes.json();
          if (Array.isArray(t)) setTeams(t);
        }
        if (matchesRes.ok) {
          const m = await matchesRes.json();
          if (Array.isArray(m)) setMatches(m);
        }
        if (settingsRes.ok) {
          const s = await settingsRes.json();
          if (s && s.tournamentName) setSettings(s);
        }
      } catch (err) {
        console.error("Error loading admin dashboard:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      active = false;
    };
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
  const liveMatches = matches.filter((m) => m.status === "Live");
  const scheduledMatches = matches.filter((m) => m.status === "Scheduled");

  const totalPlayers = teams.reduce(
    (acc, team) => acc + (team.players?.length || 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#080c12] text-white">
      {/* Top Header */}
      <header className="border-b border-[#202c3d] bg-[#0c121c]/95 px-6 py-4 backdrop-blur sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded border border-[#ff4655]/50 bg-[#ff4655]/15 text-[#ff4655] font-black shadow-[0_0_15px_rgba(255,70,85,0.3)]">
              V
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-wide">
                TOURNAMENT MANAGEMENT{" "}
                <span className="text-[#ff4655]">{"// ADMIN COMMAND HUB"}</span>
              </h1>
              <p className="text-[11px] text-[#88a0bd]">
                Valorant Esports Control Center • Cloud Database Sync
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/tournament"
              target="_blank"
              className="rounded border border-[#38506d] bg-[#111b29] px-3.5 py-2 text-xs font-bold text-[#bcd0e8] transition hover:border-cyan-400/50 hover:text-cyan-300"
            >
              PUBLIC TOURNAMENT ↗
            </Link>

            <Link
              href="/matches"
              className="rounded border border-[#ff4655]/50 bg-[#ff4655]/15 px-3.5 py-2 text-xs font-bold text-[#ff707e] transition hover:bg-[#ff4655] hover:text-white"
            >
              MATCH MANAGER ↗
            </Link>

            <Link
              href="/teams"
              className="rounded border border-[#38506d] bg-[#111b29] px-3.5 py-2 text-xs font-bold text-[#bcd0e8] transition hover:border-white/40 hover:text-white"
            >
              TEAMS & ROSTERS ↗
            </Link>

            <Link
              href="/admin/settings"
              className="rounded border border-[#38506d] bg-[#111b29] px-3.5 py-2 text-xs font-bold text-[#bcd0e8] transition hover:border-white/40 hover:text-white"
            >
              SETTINGS ⚙
            </Link>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500 hover:text-white"
            >
              {loggingOut ? "LOGGING OUT..." : "LOGOUT"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Command Dashboard */}
      <main className="mx-auto max-w-7xl px-6 py-8 sm:px-10">
        {/* Tournament KPI Cards */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
          <div className="rounded-xl border border-[#223145] bg-[#0e1522] p-5 shadow-lg">
            <div className="text-[10px] font-black uppercase tracking-wider text-[#7994b5]">
              REGISTERED TEAMS
            </div>
            <div className="mt-2 text-3xl font-black text-white sm:text-4xl">
              {loading ? "..." : teams.length}
            </div>
            <div className="mt-1 text-xs text-[#526d8f]">
              {totalPlayers} players in rosters
            </div>
          </div>

          <div className="rounded-xl border border-[#223145] bg-[#0e1522] p-5 shadow-lg">
            <div className="text-[10px] font-black uppercase tracking-wider text-[#7994b5]">
              COMPLETED MATCHES
            </div>
            <div className="mt-2 text-3xl font-black text-[#53efb1] sm:text-4xl">
              {loading ? "..." : completedMatches.length}
            </div>
            <div className="mt-1 text-xs text-[#526d8f]">
              of {matches.length} total fixtures
            </div>
          </div>

          <div className="rounded-xl border border-[#223145] bg-[#0e1522] p-5 shadow-lg">
            <div className="text-[10px] font-black uppercase tracking-wider text-[#7994b5]">
              ACTIVE STATUS
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${
                  settings.tournamentStatus === "Live"
                    ? "animate-pulse bg-red-400 shadow-[0_0_10px_#f87171]"
                    : "bg-cyan-400"
                }`}
              />
              <span className="text-2xl font-black uppercase text-white sm:text-3xl">
                {settings.tournamentStatus}
              </span>
            </div>
            <div className="mt-1 text-xs text-[#526d8f]">
              {liveMatches.length} match currently live
            </div>
          </div>

          <div className="rounded-xl border border-[#223145] bg-[#0e1522] p-5 shadow-lg">
            <div className="text-[10px] font-black uppercase tracking-wider text-[#7994b5]">
              PRIZE POOL
            </div>
            <div className="mt-2 truncate text-2xl font-black text-[#ffd45c] sm:text-3xl">
              {settings.prizePool || "₹50,000"}
            </div>
            <div className="mt-1 text-xs text-[#526d8f]">
              {settings.tournamentName}
            </div>
          </div>
        </section>

        {/* Quick Launchpad & Match Action Center */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[440px_1fr]">
          {/* Quick Admin Actions */}
          <div className="space-y-6">
            <div className="rounded-xl border border-[#26374d] bg-[#0e1522] p-6">
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                QUICK ACTIONS
              </h2>
              <p className="mt-1 text-xs text-[#7d97b8]">
                Common tournament management operations.
              </p>

              <div className="mt-5 flex flex-col gap-3">
                <Link
                  href="/matches"
                  className="flex items-center justify-between rounded-lg border border-[#30445d] bg-[#121c2b] p-4 text-left transition hover:border-[#ff4655] hover:bg-[#182335]"
                >
                  <div>
                    <div className="text-sm font-bold text-white">
                      📸 Record Match via OCR Scoreboard
                    </div>
                    <div className="mt-0.5 text-xs text-[#718dae]">
                      Upload screenshot to automatically parse player stats & scores.
                    </div>
                  </div>
                  <span className="text-lg text-[#ff4655]">→</span>
                </Link>

                <Link
                  href="/teams"
                  className="flex items-center justify-between rounded-lg border border-[#30445d] bg-[#121c2b] p-4 text-left transition hover:border-cyan-400 hover:bg-[#182335]"
                >
                  <div>
                    <div className="text-sm font-bold text-white">
                      👥 Manage Teams & Players
                    </div>
                    <div className="mt-0.5 text-xs text-[#718dae]">
                      Add new teams, configure 6-man rosters and captain roles.
                    </div>
                  </div>
                  <span className="text-lg text-cyan-400">→</span>
                </Link>

                <Link
                  href="/admin/settings"
                  className="flex items-center justify-between rounded-lg border border-[#30445d] bg-[#121c2b] p-4 text-left transition hover:border-yellow-400 hover:bg-[#182335]"
                >
                  <div>
                    <div className="text-sm font-bold text-white">
                      ⚙️ Tournament Branding & Dates
                    </div>
                    <div className="mt-0.5 text-xs text-[#718dae]">
                      Edit tournament title, banner, prize pool, and announcements.
                    </div>
                  </div>
                  <span className="text-lg text-yellow-400">→</span>
                </Link>
              </div>
            </div>

            {/* Live Announcement Info */}
            <div className="rounded-xl border border-[#26374d] bg-[#0e1522] p-6">
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                CURRENT ANNOUNCEMENT
              </h2>
              <div className="mt-3 rounded-lg border border-[#2c3d52] bg-[#090e16] p-4 text-xs leading-relaxed text-[#a5bad2]">
                {settings.announcement || "No active tournament announcement."}
              </div>
              <Link
                href="/admin/settings"
                className="mt-3 inline-block text-[11px] font-bold text-cyan-400 hover:underline"
              >
                Update Announcement Banner →
              </Link>
            </div>
          </div>

          {/* Pending & Recent Matches with Direct Actions */}
          <div className="overflow-hidden rounded-xl border border-[#26374d] bg-[#0e1522]">
            <div className="flex items-center justify-between border-b border-[#26374d] px-6 py-4">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-white">
                  FIXTURES & SCORES
                </h2>
                <p className="text-xs text-[#7d97b8]">
                  {scheduledMatches.length} pending • {completedMatches.length} completed
                </p>
              </div>

              <Link
                href="/matches"
                className="rounded border border-[#38506d] bg-[#111b29] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#182538]"
              >
                Full Match Center →
              </Link>
            </div>

            <div className="divide-y divide-[#1c293a] max-h-[620px] overflow-y-auto">
              {matches.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-[#7d97b8]">
                  {loading ? "Loading fixtures..." : "No matches configured."}
                </div>
              ) : (
                matches.slice(0, 10).map((match) => {
                  const t1 = teams.find((t) => t.id === match.team1Id);
                  const t2 = teams.find((t) => t.id === match.team2Id);

                  return (
                    <div
                      key={match.id}
                      className="flex flex-wrap items-center justify-between gap-4 p-4 transition hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded bg-[#162130] text-[11px] font-black text-[#6a87aa]">
                          M{match.matchNumber}
                        </span>

                        <div>
                          <div className="flex items-center gap-2 text-sm font-bold text-white">
                            <span>{t1?.name || "TBD"}</span>
                            <span className="text-xs text-[#587394]">vs</span>
                            <span>{t2?.name || "TBD"}</span>
                          </div>

                          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[#6d88a8]">
                            <span>{match.stage}</span>
                            <span>•</span>
                            <span>Map: {match.map || "TBD"}</span>
                            <span>•</span>
                            <span>BO{match.bestOf}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {match.status === "Completed" ? (
                          <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-black text-emerald-400">
                            {match.team1Score} - {match.team2Score}
                          </span>
                        ) : match.status === "Live" ? (
                          <span className="rounded border border-red-500/40 bg-red-500/15 px-2.5 py-1 text-xs font-black text-red-400">
                            LIVE
                          </span>
                        ) : (
                          <span className="rounded border border-zinc-600/30 bg-zinc-600/10 px-2.5 py-1 text-xs font-bold text-[#8fa7c4]">
                            Scheduled
                          </span>
                        )}

                        <Link
                          href={`/matches/${match.id}`}
                          className="rounded border border-[#ff4655]/50 bg-[#ff4655]/10 px-3 py-1.5 text-xs font-bold text-[#ff707e] transition hover:bg-[#ff4655] hover:text-white"
                        >
                          {match.status === "Completed" ? "Edit Stats" : "Record Score / OCR"}
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
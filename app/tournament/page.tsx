"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { matches as defaultMatches } from "@/app/data/matches";
import { teams as defaultTeams } from "@/app/data/teams";
import { defaultSettings } from "@/lib/api";
import type { Match, Team, TournamentSettings, Standing } from "@/lib/types";
import { TournamentBrand } from "./components/tournament-brand";
import { StatCard } from "./components/ui/stat-card";
import { StatusBadge } from "./components/ui/status-badge";
import { MatchCard } from "./components/ui/match-card";

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Not set";
  return d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function getTeam(teams: Team[], id?: string) {
  return teams.find((t) => t.id === id);
}

function buildStandings(teams: Team[], matches: Match[]): Standing[] {
  const map = new Map<string, Standing>();
  for (const team of teams) {
    map.set(team.id, { team, played: 0, wins: 0, losses: 0, points: 0, roundDifference: 0 });
  }
  for (const m of matches) {
    if (m.stage !== "Group Stage" || m.status !== "Completed" || !m.team1Id || !m.team2Id) continue;
    const t1 = map.get(m.team1Id);
    const t2 = map.get(m.team2Id);
    if (!t1 || !t2) continue;
    t1.played += 1; t2.played += 1;
    t1.roundDifference += m.team1Score - m.team2Score;
    t2.roundDifference += m.team2Score - m.team1Score;
    if (m.team1Score > m.team2Score) { t1.wins += 1; t1.points += 3; t2.losses += 1; }
    if (m.team2Score > m.team1Score) { t2.wins += 1; t2.points += 3; t1.losses += 1; }
  }
  return [...map.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.roundDifference - a.roundDifference ||
      b.wins - a.wins ||
      a.team.seed - b.team.seed,
  );
}

function phaseMatches(matches: Match[]) {
  return matches
    .filter((m) => m.matchNumber >= 13 && m.matchNumber <= 16)
    .sort((a, b) => a.matchNumber - b.matchNumber);
}

type StandingsView = "overall" | "group" | "qualifiers" | "final";

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function TournamentDashboard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [settings, setSettings] = useState<TournamentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [standingsView, setStandingsView] = useState<StandingsView>("overall");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [tr, mr, sr] = await Promise.all([
          fetch("/api/teams", { cache: "no-store" }),
          fetch("/api/matches", { cache: "no-store" }),
          fetch("/api/settings", { cache: "no-store" }),
        ]);
        const td = tr.ok ? await tr.json() : null;
        const md = mr.ok ? await mr.json() : null;
        const sd = sr.ok ? await sr.json() : null;
        if (!mounted) return;
        setTeams(Array.isArray(td) && td.length > 0 ? td : defaultTeams);
        setMatches(Array.isArray(md) && md.length > 0 ? md : defaultMatches);
        setSettings(sd?.tournamentName ? sd : defaultSettings);
      } catch (err) {
        if (!mounted) return;
        setTeams(defaultTeams);
        setMatches(defaultMatches);
        setSettings(defaultSettings);
        setError(err instanceof Error ? err.message : "Failed to load tournament data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const standings = useMemo(() => buildStandings(teams, matches), [teams, matches]);

  const completed = matches.filter((m) => m.status === "Completed");
  const live      = matches.filter((m) => m.status === "Live");
  const scheduled = matches.filter((m) => m.status === "Scheduled");

  const qualifierMs = phaseMatches(matches).filter((m) => m.matchNumber >= 13 && m.matchNumber <= 15);
  const grandFinal  = matches.find((m) => m.matchNumber === 16);

  const nextMatch = [...scheduled].sort(
    (a, b) => new Date(a.scheduledAt || "9999").getTime() - new Date(b.scheduledAt || "9999").getTime(),
  )[0];
  const activeLive = live[0];
  const latestResults = [...completed].sort((a, b) => b.matchNumber - a.matchNumber).slice(0, 5);

  const groupCompleted = completed.filter((m) => m.stage === "Group Stage").length;
  const groupTotal = 12;
  const progress = Math.min(100, Math.round((groupCompleted / groupTotal) * 100));
  const qualifierTeams = standings.slice(0, 4);

  const STANDINGS_TABS: { id: StandingsView; label: string }[] = [
    { id: "overall",    label: "OVERALL" },
    { id: "group",      label: "GROUP STAGE" },
    { id: "qualifiers", label: "QUALIFIERS" },
    { id: "final",      label: "GRAND FINAL" },
  ];

  return (
    <main className="min-h-screen bg-[#030308] text-[#f1f5f9]">
      {/* ── Ambient glows ──────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[600px] w-[600px] rounded-full bg-[#ff2d55]/8 blur-[160px]" />
        <div className="absolute -right-32 top-0 h-[500px] w-[500px] rounded-full bg-[#7c3aed]/8 blur-[160px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-[#06b6d4]/6 blur-[140px]" />
      </div>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="relative border-b border-[#1e1e3a] bg-[#030308]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-6 py-6">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-black tracking-[0.4em] text-[#ff2d55]">
              <span className="live-dot h-2 w-2 flex-shrink-0" />
              VALORANT ESPORTS
            </div>
            <div className="mt-2">
              <TournamentBrand />
            </div>
            <p className="mt-1.5 text-xs text-[#475569]">Official tournament hub</p>
          </div>

          <nav className="flex flex-wrap gap-2">
            {[
              { href: "/tournament/matches",  label: "MATCHES",     color: "hover:border-[#06b6d4]/60 hover:text-[#22d3ee]" },
              { href: "/tournament/teams",    label: "TEAMS",       color: "hover:border-[#06b6d4]/60 hover:text-[#22d3ee]" },
              { href: "/tournament/fixtures", label: "FIXTURES",    color: "hover:border-[#06b6d4]/60 hover:text-[#22d3ee]" },
              { href: "/tournament/bracket",  label: "BRACKET",     color: "hover:border-[#9d63ff]/60 hover:text-[#9d63ff]" },
              { href: "/tournament/players",  label: "LEADERBOARD", color: "hover:border-[#10b981]/60 hover:text-[#34d399]" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg border border-[#1e1e3a] bg-[#0c0c18] px-4 py-2 text-[9px] font-black tracking-widest text-[#64748b] transition ${l.color}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl px-6 py-8 space-y-6">
        {/* Error banner */}
        {error && (
          <div className="rounded-xl border border-[#ff2d55]/40 bg-[#ff2d55]/8 p-4">
            <div className="font-black text-[#ff4d6a]">Unable to load tournament data</div>
            <div className="mt-1 text-sm text-[#ff6080]">{error}</div>
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-[#1e1e3a] bg-[#0c0c18] p-20 text-center">
            <div className="text-sm text-[#475569]">Loading tournament…</div>
          </div>
        ) : (
          <>
            {/* ── Stats Row ─────────────────────────────────────────────── */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Registered Teams" count={teams.length}        accent="cyan" />
              <StatCard label="Completed Matches" count={completed.length}   accent="green" />
              <StatCard label="Live Now"          count={live.length}        accent="crimson" />
              <StatCard label="Upcoming"          count={scheduled.length}   accent="violet" />
            </section>

            {/* ── Tournament Info ───────────────────────────────────────── */}
            <section className="rounded-xl border border-[#1e1e3a] bg-[#0c0c18] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#06b6d4]">
                    TOURNAMENT INFO
                  </div>
                  <h2 className="mt-1 text-2xl font-black tracking-tight">
                    {settings?.tournamentName || "Tournament Information"}
                  </h2>
                  {settings?.tagline && (
                    <p className="mt-1 text-sm text-[#475569]">{settings.tagline}</p>
                  )}
                </div>
                {settings?.tournamentStatus && (
                  <StatusBadge
                    status={settings.tournamentStatus === "Live" ? "Live" : settings.tournamentStatus === "Completed" ? "Completed" : "Scheduled"}
                  />
                )}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "START",     value: formatDate(settings?.startDate),    color: "text-[#f1f5f9]" },
                  { label: "END",       value: formatDate(settings?.endDate),      color: "text-[#f1f5f9]" },
                  { label: "ORGANIZER", value: settings?.organizerName || "Not set", color: "text-[#f1f5f9]" },
                  { label: "PRIZE POOL", value: settings?.prizePool || "Not set",  color: "text-[#f59e0b]" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-[#1e1e3a] bg-[#030308] p-4">
                    <div className="text-[9px] font-black uppercase tracking-widest text-[#334155]">{item.label}</div>
                    <div className={`mt-2 text-sm font-black ${item.color}`}>{item.value}</div>
                  </div>
                ))}
              </div>

              {settings?.announcement && (
                <div className="mt-4 rounded-lg border border-[#f59e0b]/20 bg-[#f59e0b]/5 p-4">
                  <div className="text-[9px] font-black uppercase tracking-widest text-[#f59e0b]">ANNOUNCEMENT</div>
                  <p className="mt-2 text-sm leading-relaxed text-[#cbd5e1]">{settings.announcement}</p>
                </div>
              )}
            </section>

            {/* ── Progress Bar ──────────────────────────────────────────── */}
            <section className="rounded-xl border border-[#1e1e3a] bg-[#0c0c18] p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#ff2d55]">TOURNAMENT</div>
                  <h2 className="mt-1 text-lg font-black tracking-tight">Tournament Progress</h2>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black tracking-tighter text-[#22d3ee]">
                    {groupCompleted}
                    <span className="text-[#1e1e3a]">/</span>
                    {groupTotal}
                  </div>
                  <div className="text-[9px] font-black uppercase tracking-wider text-[#334155]">Group matches</div>
                </div>
              </div>
              <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#0c0c18] border border-[#1e1e3a]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #ff2d55 0%, #7c3aed 55%, #06b6d4 100%)",
                    boxShadow: "0 0 10px rgba(124,58,237,0.4)",
                  }}
                />
              </div>
              <div className="mt-2 text-right text-[10px] font-black text-[#334155]">{progress}%</div>
            </section>

            {/* ── Standings ─────────────────────────────────────────────── */}
            <section className="overflow-hidden rounded-xl border border-[#1e1e3a] bg-[#0c0c18]">
              <div className="border-b border-[#1e1e3a] p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#f59e0b]">STANDINGS</div>
                    <h2 className="mt-1 text-xl font-black tracking-tight">Tournament Standings</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {STANDINGS_TABS.map((tab) => {
                      const active = standingsView === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setStandingsView(tab.id)}
                          className={`rounded-lg border px-3.5 py-1.5 text-[9px] font-black tracking-widest transition ${
                            active
                              ? "border-[#ff2d55]/60 bg-[#ff2d55]/10 text-[#ff4d6a]"
                              : "border-[#1e1e3a] bg-[#030308] text-[#475569] hover:border-[#2e2e5a] hover:text-[#94a3b8]"
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Overall / Group table */}
              {(standingsView === "overall" || standingsView === "group") && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-[#1e1e3a] bg-[#030308] text-[9px] font-black uppercase tracking-widest text-[#334155]">
                        <th className="px-5 py-3 text-left">#</th>
                        <th className="px-3 py-3 text-left">TEAM</th>
                        <th className="px-3 py-3 text-center">P</th>
                        <th className="px-3 py-3 text-center">W</th>
                        <th className="px-3 py-3 text-center">L</th>
                        <th className="px-3 py-3 text-center">RD</th>
                        <th className="px-5 py-3 text-center">PTS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((s, i) => {
                        const isTop4 = i < 4;
                        return (
                          <tr
                            key={s.team.id}
                            className={`border-t border-[#1e1e3a] transition hover:bg-[#0c0c18] ${isTop4 ? "border-l-2 border-l-[#f59e0b]/40" : ""}`}
                          >
                            <td className="px-5 py-3.5">
                              <span
                                className={`flex h-6 w-6 items-center justify-center rounded text-[10px] font-black ${
                                  i === 0 ? "bg-[#f59e0b]/15 text-[#fbbf24]"
                                  : i === 1 ? "bg-[#94a3b8]/10 text-[#94a3b8]"
                                  : i === 2 ? "bg-[#d97706]/10 text-[#d97706]"
                                  : "bg-[#1e1e3a] text-[#475569]"
                                }`}
                              >
                                {i + 1}
                              </span>
                            </td>
                            <td className="px-3 py-3.5">
                              <Link
                                href={`/tournament/teams/${encodeURIComponent(s.team.id)}`}
                                className="font-black hover:text-[#22d3ee] transition-colors"
                              >
                                {s.team.name}
                              </Link>
                              <div className="mt-0.5 text-[9px] text-[#334155]">{s.team.tag}</div>
                            </td>
                            <td className="px-3 py-3.5 text-center text-sm text-[#64748b]">{s.played}</td>
                            <td className="px-3 py-3.5 text-center text-sm font-black text-[#34d399]">{s.wins}</td>
                            <td className="px-3 py-3.5 text-center text-sm text-[#ff4d6a]">{s.losses}</td>
                            <td className="px-3 py-3.5 text-center text-sm text-[#22d3ee]">
                              {s.roundDifference > 0 ? `+${s.roundDifference}` : s.roundDifference}
                            </td>
                            <td className="px-5 py-3.5 text-center text-lg font-black text-[#fbbf24]">{s.points}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Qualifiers view */}
              {standingsView === "qualifiers" && (
                <div className="grid gap-4 p-6 md:grid-cols-2">
                  <div className="rounded-xl border border-[#7c3aed]/30 bg-[#7c3aed]/5 p-5">
                    <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#9d63ff]">QUALIFIER PATH</div>
                    <h3 className="mt-2 text-lg font-black">Phase 2 Seeding</h3>
                    <div className="mt-5 space-y-2">
                      {qualifierTeams.map((item, i) => (
                        <div key={item.team.id} className="flex items-center justify-between rounded-lg border border-[#1e1e3a] bg-[#030308] p-3">
                          <div>
                            <div className="text-xs font-black">{item.team.name}</div>
                            <div className="mt-0.5 text-[9px] text-[#475569]">GROUP POSITION #{i + 1}</div>
                          </div>
                          <span className={`text-[9px] font-black ${i < 2 ? "text-[#34d399]" : "text-[#f59e0b]"}`}>
                            {i < 2 ? "Q1" : "ELIMINATION"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {qualifierMs.length === 0 ? (
                      <div className="rounded-xl border border-[#1e1e3a] bg-[#030308] p-10 text-center text-sm text-[#334155]">
                        Qualifier matches will appear after the Group Stage.
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
                    <div className="rounded-xl border border-[#f59e0b]/20 bg-[#f59e0b]/5 p-12 text-center">
                      <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#f59e0b]">GRAND FINAL</div>
                      <p className="mt-3 text-sm text-[#475569]">The Grand Final will appear after the qualifier stage.</p>
                    </div>
                  ) : (
                    <MatchCard match={grandFinal} teams={teams} />
                  )}
                </div>
              )}
            </section>

            {/* ── Bottom Grid ───────────────────────────────────────────── */}
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              {/* Latest Results */}
              <section className="overflow-hidden rounded-xl border border-[#1e1e3a] bg-[#0c0c18]">
                <div className="flex items-center justify-between border-b border-[#1e1e3a] p-5">
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#f59e0b]">LATEST RESULTS</div>
                    <h2 className="mt-1 text-lg font-black tracking-tight">Completed Matches</h2>
                  </div>
                  <Link href="/tournament/matches" className="text-[9px] font-black text-[#22d3ee] hover:text-white transition-colors">
                    ALL →
                  </Link>
                </div>
                <div className="divide-y divide-[#1e1e3a] p-3">
                  {latestResults.length === 0 ? (
                    <div className="p-8 text-center text-sm text-[#334155]">No completed matches yet.</div>
                  ) : (
                    latestResults.map((m) => <MatchCard key={m.id} match={m} teams={teams} compact />)
                  )}
                </div>
              </section>

              {/* Right column */}
              <div className="flex flex-col gap-6">
                {/* Live / Next Match */}
                <section className="rounded-xl border border-[#06b6d4]/25 bg-[#0c0c18] p-5">
                  <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#22d3ee]">
                    {activeLive ? "🔴 LIVE MATCH" : "NEXT MATCH"}
                  </div>
                  {(activeLive || nextMatch) ? (
                    <div className="mt-3">
                      <MatchCard match={activeLive || nextMatch!} teams={teams} />
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl border border-[#1e1e3a] bg-[#030308] p-6 text-center text-sm text-[#334155]">
                      No upcoming matches.
                    </div>
                  )}
                </section>

                {/* Sponsors */}
                <section className="rounded-xl border border-[#ff2d55]/20 bg-[#0c0c18] p-5">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#ff4d6a]">OFFICIAL PARTNERS</div>
                      <h2 className="mt-1 text-lg font-black uppercase">SPONSORS</h2>
                      <p className="mt-0.5 text-xs text-[#475569]">Proudly supported by our sponsors.</p>
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-[#22d3ee]">XMD FAMILY</div>
                  </div>
                  <div className="mt-4 overflow-hidden rounded-xl border border-[#1e1e3a]">
                    <Image
                      src="/sponsors-banner.png"
                      alt="Official tournament sponsors"
                      width={1200}
                      height={400}
                      unoptimized
                      className="block h-auto w-full object-cover"
                    />
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
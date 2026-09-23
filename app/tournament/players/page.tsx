"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { TournamentNav } from "../components/tournament-nav";
import { fetchTeams, fetchMatches } from "@/lib/api";
import type { Match, Team, Player, PlayerStat } from "@/lib/types";
import { matches as defaultMatches } from "@/app/data/matches";
import { teams as defaultTeams } from "@/app/data/teams";
import { getGameDefinition } from "@/lib/games/registry";

const STAGES = [
  "All Matches",
  "Group Stage",
  "Qualifier 1",
  "Eliminator",
  "Qualifier 2",
  "Grand Final",
];

type SortField = "acs" | "kills" | "kd" | "mvp" | "wins" | "matches";

type PlayerRow = {
  player: Player;
  team: Team;
  matches: number;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  assists: number;
  acsTotal: number;
  adrTotal: number;
  kastTotal: number;
  acsMatches: number;
  adrMatches: number;
  kastMatches: number;
  mvp: number;
  topFragger: number;
};

function parseRiotName(fullName: string) {
  if (!fullName) return { ign: "Unknown", tag: "" };
  if (fullName.includes("#")) {
    const [ign, tag] = fullName.split("#");
    return { ign: ign.trim(), tag: tag.trim() };
  }
  return { ign: fullName.trim(), tag: "" };
}

function normalize(value: string) {
  return (value || "")
    .split("#")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function matchesPlayerName(name1: string, name2: string) {
  if (!name1 || !name2) return false;
  const n1 = normalize(name1);
  const n2 = normalize(name2);
  if (n1 === n2) return true;

  const full1 = name1.toLowerCase().replace(/[^a-z0-9]/g, "");
  const full2 = name2.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (full1 === full2) return true;

  if (n1.length >= 3 && n2.length >= 3 && (n1.includes(n2) || n2.includes(n1))) {
    return true;
  }
  return false;
}

function findPlayerRow(rows: Map<string, PlayerRow>, stat: PlayerStat) {
  if (stat.playerId) {
    const direct = rows.get(stat.playerId);
    if (direct) return direct;
  }

  for (const row of rows.values()) {
    if (stat.teamId && row.team.id === stat.teamId && matchesPlayerName(row.player.name, stat.playerName)) {
      return row;
    }
  }

  for (const row of rows.values()) {
    if (matchesPlayerName(row.player.name, stat.playerName)) {
      return row;
    }
  }

  return undefined;
}

export default function PlayerStatisticsPage() {
  const [teams, setTeams] = useState<Team[]>(defaultTeams);
  const [matches, setMatches] = useState<Match[]>(defaultMatches);
  const [stageFilter, setStageFilter] = useState("All Matches");
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("acs");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [gameId, setGameId] = useState<string>("valorant");

  const game = useMemo(() => getGameDefinition(gameId), [gameId]);

  useEffect(() => {
    let active = true;

    async function initialFetch() {
      try {
        const [teamsData, matchesData, settingsRes] = await Promise.all([
          fetchTeams(),
          fetchMatches(),
          fetch("/api/settings", { cache: "no-store" }).catch(() => null),
        ]);
        if (!active) return;
        if (teamsData && teamsData.length > 0) setTeams(teamsData);
        if (matchesData && matchesData.length > 0) setMatches(matchesData);
        if (settingsRes && settingsRes.ok) {
          const sData = await settingsRes.json();
          if (sData?.gameId) setGameId(sData.gameId);
        }
      } catch {
        // Fallback to default
      }
    }

    initialFetch();

    const refresh = () => {
      fetchTeams().then((t) => {
        if (active && t && t.length > 0) setTeams(t);
      });
      fetchMatches().then((m) => {
        if (active && m && m.length > 0) setMatches(m);
      });
    };

    window.addEventListener("tournament-matches-updated", refresh);
    return () => {
      active = false;
      window.removeEventListener("tournament-matches-updated", refresh);
    };
  }, []);

  const completedMatches = useMemo(() => {
    return matches.filter((m) => m.status === "Completed");
  }, [matches]);

  const filteredMatches = useMemo(() => {
    if (stageFilter === "All Matches") return completedMatches;
    return completedMatches.filter((m) => m.stage === stageFilter);
  }, [completedMatches, stageFilter]);

  const playerRows = useMemo(() => {
    const rows = new Map<string, PlayerRow>();

    for (const team of teams) {
      for (const player of team.players) {
        rows.set(player.id, {
          player,
          team,
          matches: 0,
          wins: 0,
          losses: 0,
          kills: 0,
          deaths: 0,
          assists: 0,
          acsTotal: 0,
          adrTotal: 0,
          kastTotal: 0,
          acsMatches: 0,
          adrMatches: 0,
          kastMatches: 0,
          mvp: 0,
          topFragger: 0,
        });
      }
    }

    for (const match of filteredMatches) {
      const winnerId = match.winnerId;

      for (const stat of match.playerStats || []) {
        const row = findPlayerRow(rows, stat);
        if (!row) continue;

        row.matches += 1;

        if (winnerId && stat.teamId === winnerId) {
          row.wins += 1;
        } else {
          row.losses += 1;
        }

        row.kills += Number(stat.kills) || 0;
        row.deaths += Number(stat.deaths) || 0;
        row.assists += Number(stat.assists) || 0;

        if (Number.isFinite(Number(stat.acs))) {
          row.acsTotal += Number(stat.acs);
          row.acsMatches += 1;
        }

        if (Number.isFinite(Number(stat.adr)) && Number(stat.adr) > 0) {
          row.adrTotal += Number(stat.adr);
          row.adrMatches += 1;
        }

        if (Number.isFinite(Number(stat.kast)) && Number(stat.kast) > 0) {
          row.kastTotal += Number(stat.kast);
          row.kastMatches += 1;
        }

        if (match.mvpPlayerId && (match.mvpPlayerId === stat.playerId || match.mvpPlayerId === row.player.id)) {
          row.mvp += 1;
        }

        if (match.topFraggerPlayerId && (match.topFraggerPlayerId === stat.playerId || match.topFraggerPlayerId === row.player.id)) {
          row.topFragger += 1;
        }
      }
    }

    return Array.from(rows.values());
  }, [teams, filteredMatches]);

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = playerRows.filter((row) => {
      if (teamFilter !== "ALL" && row.team.id !== teamFilter) {
        return false;
      }
      if (!query) return true;
      return (
        row.player.name.toLowerCase().includes(query) ||
        row.team.name.toLowerCase().includes(query) ||
        row.team.tag.toLowerCase().includes(query)
      );
    });

    return filtered.sort((a, b) => {
      const getVal = (r: PlayerRow) => {
        const acs = r.acsMatches > 0 ? r.acsTotal / r.acsMatches : 0;
        const kd = r.deaths > 0 ? r.kills / r.deaths : r.kills;
        switch (sortBy) {
          case "acs":
            return acs;
          case "kills":
            return r.kills;
          case "kd":
            return kd;
          case "mvp":
            return r.mvp;
          case "wins":
            return r.wins;
          case "matches":
            return r.matches;
          default:
            return acs;
        }
      };

      const valA = getVal(a);
      const valB = getVal(b);

      if (valA !== valB) {
        return sortDir === "desc" ? valB - valA : valA - valB;
      }

      // Tiebreaker 1: Kills
      if (b.kills !== a.kills) return b.kills - a.kills;
      // Tiebreaker 2: Name
      return a.player.name.localeCompare(b.player.name);
    });
  }, [playerRows, teamFilter, search, sortBy, sortDir]);

  const totalPlayers = teams.reduce((t, team) => t + team.players.length, 0);

  function toggleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  }

  // Find standout leaders if any completed matches exist
  const acsLeader = useMemo(() => {
    const active = playerRows.filter((r) => r.matches > 0);
    if (active.length === 0) return null;
    return [...active].sort((a, b) => {
      const aAcs = a.acsMatches > 0 ? a.acsTotal / a.acsMatches : 0;
      const bAcs = b.acsMatches > 0 ? b.acsTotal / b.acsMatches : 0;
      return bAcs - aAcs;
    })[0];
  }, [playerRows]);

  const killLeader = useMemo(() => {
    const active = playerRows.filter((r) => r.matches > 0);
    if (active.length === 0) return null;
    return [...active].sort((a, b) => b.kills - a.kills)[0];
  }, [playerRows]);

  const mvpLeader = useMemo(() => {
    const active = playerRows.filter((r) => r.mvp > 0);
    if (active.length === 0) return null;
    return [...active].sort((a, b) => b.mvp - a.mvp)[0];
  }, [playerRows]);

  return (
    <div className="relative min-h-screen text-[#f1f5f9] pb-24">
      {/* ── Ambient Neon Glow Orbs ────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#94a3b8]/12 blur-[180px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-[#ff2d55]/10 blur-[160px]" />
        <div className="absolute bottom-10 left-1/3 h-[500px] w-[500px] rounded-full bg-[#94a3b8]/8 blur-[160px]" />
      </div>

      <TournamentNav />

      <main className="relative z-10 mx-auto max-w-[1680px] px-4 pt-8 sm:px-8">
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <header className="border-b border-[#1e1e3a] pb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#94a3b8]/30 bg-[#94a3b8]/10 px-3 py-1 text-[12px] font-black uppercase tracking-[0.25em] text-[#f1f5f9]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#94a3b8] animate-pulse" />
              {game.shortName} TOURNAMENT // OFFICIAL TELEMETRY
            </div>

            <h1 className="mt-3 text-4xl font-black uppercase tracking-tight sm:text-6xl">
              PLAYER{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff2d55] via-[#a855f7] to-[#94a3b8]">
                STATISTICS
              </span>
            </h1>

            <p className="mt-2 text-sm text-[#94a3b8] max-w-2xl">
              Player-by-player tournament telemetry, performance ratings, and MVP accolades calculated live across all official tournament matches.
            </p>
          </div>
        </header>

        {/* ── High-Impact Metric Cards ─────────────────────────────────────── */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="relative overflow-hidden rounded-2xl border border-[#94a3b8]/25 bg-[#0c0c18]/85 p-6 backdrop-blur-xl transition hover:border-[#94a3b8]/50 hover:shadow-[0_0_25px_rgba(148,163,184,0.15)]">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-black uppercase tracking-[0.25em] text-[#94a3b8]">
                COMBATANTS
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#94a3b8]/30 bg-[#94a3b8]/10 text-sm text-[#f1f5f9]">
                👥
              </span>
            </div>
            <div className="mt-4 text-4xl font-black text-white">
              {totalPlayers}
            </div>
            <p className="mt-1 text-[13px] font-bold text-[#64748b]">
              Registered across {teams.length} Franchise Rosters
            </p>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-[#10b981]/25 bg-[#0c0c18]/85 p-6 backdrop-blur-xl transition hover:border-[#10b981]/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-black uppercase tracking-[0.25em] text-[#10b981]">
                BATTLES CONCLUDED
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#10b981]/30 bg-[#10b981]/10 text-sm text-[#34d399]">
                ⚔️
              </span>
            </div>
            <div className="mt-4 text-4xl font-black text-[#34d399]">
              {completedMatches.length}
            </div>
            <p className="mt-1 text-[13px] font-bold text-[#64748b]">
              Official Published Match Scoreboards
            </p>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-[#f59e0b]/25 bg-[#0c0c18]/85 p-6 backdrop-blur-xl transition hover:border-[#f59e0b]/50 hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-black uppercase tracking-[0.25em] text-[#f59e0b]">
                CURRENT BEST PLAYER
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/10 text-sm text-[#fbbf24]">
                🌟
              </span>
            </div>
            {acsLeader ? (
              <>
                <div className="mt-4 truncate text-2xl font-black uppercase text-[#fbbf24]">
                  {parseRiotName(acsLeader.player.name).ign}
                </div>
                <p className="mt-1 truncate text-[13px] font-bold text-[#64748b]">
                  {acsLeader.team.name} · Avg {Math.round(acsLeader.acsMatches > 0 ? acsLeader.acsTotal / acsLeader.acsMatches : 0)} {game.statColumns[0]?.label || "ACS"}
                </p>
              </>
            ) : (
              <>
                <div className="mt-4 text-2xl font-black uppercase text-[#fbbf24]">TBD</div>
                <p className="mt-1 text-[13px] font-bold text-[#64748b]">
                  Leaderboard updates after matches are played
                </p>
              </>
            )}
          </div>
        </section>

        {/* ── Standout Season Leaders Spotlight (When Data Exists) ──────────── */}
        {completedMatches.length > 0 && (acsLeader || killLeader || mvpLeader) && (
          <section className="mt-8">
            <div className="flex items-center justify-between border-b border-[#1e1e3a] pb-3 mb-4">
              <span className="text-[12px] font-black uppercase tracking-[0.25em] text-[#f59e0b]">
                ★ STANDOUT PERFORMERS // CURRENT LEADERS
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Rating Leader */}
              {acsLeader && (
                <div className="relative overflow-hidden rounded-2xl border border-[#f59e0b]/40 bg-gradient-to-br from-[#f59e0b]/10 via-[#0c0c18]/90 to-[#080812] p-5 backdrop-blur-xl shadow-[0_0_25px_rgba(245,158,11,0.15)]">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f59e0b]/40 bg-[#f59e0b]/15 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#fbbf24]">
                      👑 {game.podiumLabels.ratingLeader}
                    </span>
                    <span className="text-sm font-mono font-bold text-[#64748b]">
                      [{acsLeader.team.tag}]
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-black uppercase text-white tracking-tight">
                        {parseRiotName(acsLeader.player.name).ign}
                      </h4>
                      <p className="text-sm font-semibold text-[#94a3b8]">
                        {acsLeader.team.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-[#f1f5f9]">
                        {Math.round(acsLeader.acsMatches > 0 ? acsLeader.acsTotal / acsLeader.acsMatches : 0)}
                      </span>
                      <span className="block text-[11px] font-black uppercase tracking-widest text-[#64748b]">
                        AVG {game.statColumns[0]?.label || "RATING"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Frag / Performer Leader */}
              {killLeader && (
                <div className="relative overflow-hidden rounded-2xl border border-[#ff2d55]/40 bg-gradient-to-br from-[#ff2d55]/10 via-[#0c0c18]/90 to-[#080812] p-5 backdrop-blur-xl shadow-[0_0_25px_rgba(255,45,85,0.15)]">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff2d55]/40 bg-[#ff2d55]/15 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#ff4d6a]">
                      🎯 {game.podiumLabels.topFragger}
                    </span>
                    <span className="text-sm font-mono font-bold text-[#64748b]">
                      [{killLeader.team.tag}]
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-black uppercase text-white tracking-tight">
                        {parseRiotName(killLeader.player.name).ign}
                      </h4>
                      <p className="text-sm font-semibold text-[#94a3b8]">
                        {killLeader.team.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-[#ff4d6a]">
                        {killLeader.kills}
                      </span>
                      <span className="block text-[11px] font-black uppercase tracking-widest text-[#64748b]">
                        TOTAL {game.statColumns.find((c) => c.key === "kills")?.label || "KILLS"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* MVP Leader */}
              {mvpLeader && (
                <div className="relative overflow-hidden rounded-2xl border border-[#a855f7]/40 bg-gradient-to-br from-[#a855f7]/10 via-[#0c0c18]/90 to-[#080812] p-5 backdrop-blur-xl shadow-[0_0_25px_rgba(168,85,247,0.15)]">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#a855f7]/40 bg-[#a855f7]/15 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#c084fc]">
                      🌟 {game.podiumLabels.mvp}
                    </span>
                    <span className="text-sm font-mono font-bold text-[#64748b]">
                      [{mvpLeader.team.tag}]
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-black uppercase text-white tracking-tight">
                        {parseRiotName(mvpLeader.player.name).ign}
                      </h4>
                      <p className="text-sm font-semibold text-[#94a3b8]">
                        {mvpLeader.team.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-[#fbbf24]">
                        {mvpLeader.mvp}
                      </span>
                      <span className="block text-[11px] font-black uppercase tracking-widest text-[#64748b]">
                        AWARDS
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Command Filter & Search Deck ─────────────────────────────────── */}
        <section className="mt-8 rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-[#1e1e3a] pb-6">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#94a3b8]">
                FILTER & SORT ROSTER DATABASE
              </p>
              <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-white">
                Displaying {visibleRows.length} of {totalPlayers} Players
              </h2>
            </div>

            {/* Quick Sort Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-black uppercase tracking-widest text-[#64748b] mr-1 hidden sm:inline">
                SORT BY:
              </span>
              {[
                { id: "acs", label: `⚡ ${game.statColumns[0]?.label || "ACS"}` },
                { id: "kills", label: `🎯 ${game.statColumns.find((c) => c.key === "kills")?.label || "Kills"}` },
                { id: "kd", label: "⚔️ K/D Ratio" },
                { id: "mvp", label: "🌟 MVPs" },
                { id: "wins", label: "🏆 Wins" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => toggleSort(tab.id as SortField)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-black uppercase tracking-wider transition ${
                    sortBy === tab.id
                      ? "border border-[#94a3b8]/50 bg-[#94a3b8]/20 text-[#f1f5f9] shadow-[0_0_15px_rgba(148,163,184,0.2)]"
                      : "border border-[#1e1e3a] bg-[#080812] text-[#94a3b8] hover:border-[#94a3b8]/40 hover:text-white"
                  }`}
                >
                  <span>{tab.label}</span>
                  {sortBy === tab.id && (
                    <span className="text-[11px]">{sortDir === "desc" ? "▼" : "▲"}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Inputs Grid */}
          <div className="mt-6 grid gap-4 sm:grid-cols-12">
            <div className="sm:col-span-4">
              <label className="text-[12px] font-black uppercase tracking-widest text-[#64748b]">
                Tournament Stage
              </label>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#1e1e3a] bg-[#080812] px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-[#94a3b8]"
              >
                {STAGES.map((stage) => (
                  <option key={stage} value={stage} className="bg-[#0c0c18]">
                    {stage}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-4">
              <label className="text-[12px] font-black uppercase tracking-widest text-[#64748b]">
                Franchise Team
              </label>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#1e1e3a] bg-[#080812] px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-[#94a3b8]"
              >
                <option value="ALL" className="bg-[#0c0c18]">
                  ALL FRANCHISES ({teams.length})
                </option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id} className="bg-[#0c0c18]">
                    {team.name} [{team.tag}]
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-4">
              <label className="text-[12px] font-black uppercase tracking-widest text-[#64748b]">
                Search Player / Team
              </label>
              <div className="relative mt-1.5">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="e.g. zippaz, nandu, naadan..."
                  className="w-full rounded-xl border border-[#1e1e3a] bg-[#080812] pl-10 pr-4 py-3 text-sm font-bold text-white placeholder-[#475569] outline-none transition focus:border-[#94a3b8]"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#64748b]">
                  🔍
                </span>
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#64748b] hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-[#1e1e3a]/50">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#475569]">
              ACTIVE SCOPE:
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg border border-[#94a3b8]/30 bg-[#94a3b8]/10 px-2.5 py-1 text-[12px] font-bold text-[#f1f5f9]">
              STAGE: {stageFilter.toUpperCase()}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg border border-[#94a3b8]/30 bg-[#94a3b8]/10 px-2.5 py-1 text-[12px] font-bold text-[#c084fc]">
              TEAM: {teamFilter === "ALL" ? "ALL TEAMS" : teams.find((t) => t.id === teamFilter)?.tag || teamFilter}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg border border-[#10b981]/30 bg-[#10b981]/10 px-2.5 py-1 text-[12px] font-bold text-[#34d399]">
              COMPLETED MATCHES: {filteredMatches.length}
            </span>
          </div>
        </section>

        {/* ── Ultra-Modern Leaderboard Table ───────────────────────────────── */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.4)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e1e3a] bg-[#080812] text-[12px] font-black uppercase tracking-[0.2em] text-[#64748b]">
                  <th className="px-5 py-4 text-center w-16">#</th>
                  <th className="px-5 py-4">Player Details</th>
                  <th className="px-4 py-4">Franchise</th>
                  <th
                    className="px-3 py-4 text-center cursor-pointer hover:text-white transition"
                    onClick={() => toggleSort("matches")}
                  >
                    MP {sortBy === "matches" ? (sortDir === "desc" ? "▼" : "▲") : ""}
                  </th>
                  <th
                    className="px-3 py-4 text-center cursor-pointer hover:text-white transition"
                    onClick={() => toggleSort("wins")}
                  >
                    W - L {sortBy === "wins" ? (sortDir === "desc" ? "▼" : "▲") : ""}
                  </th>
                  <th
                    className="px-3 py-4 text-center cursor-pointer hover:text-white transition"
                    onClick={() => toggleSort("kills")}
                  >
                    K {sortBy === "kills" ? (sortDir === "desc" ? "▼" : "▲") : ""}
                  </th>
                  <th className="px-3 py-4 text-center">D</th>
                  <th className="px-3 py-4 text-center">A</th>
                  <th
                    className="px-4 py-4 text-center cursor-pointer hover:text-white transition"
                    onClick={() => toggleSort("kd")}
                  >
                    K/D {sortBy === "kd" ? (sortDir === "desc" ? "▼" : "▲") : ""}
                  </th>
                  <th
                    className="px-4 py-4 text-center cursor-pointer text-[#f1f5f9] hover:brightness-125 transition"
                    onClick={() => toggleSort("acs")}
                  >
                    ⚡ {game.statColumns.find((c) => c.key === "acs")?.label || "ACS"} {sortBy === "acs" ? (sortDir === "desc" ? "▼" : "▲") : ""}
                  </th>
                  <th className="px-3 py-4 text-center">
                    {game.statColumns.find((c) => c.key === "adr")?.label || "ADR"}
                  </th>
                  <th className="px-3 py-4 text-center">
                    {game.statColumns.find((c) => c.key === "kast")?.label || "KAST%"}
                  </th>
                  <th
                    className="px-3 py-4 text-center cursor-pointer text-[#fbbf24] hover:brightness-125 transition"
                    onClick={() => toggleSort("mvp")}
                  >
                    ★ MVP {sortBy === "mvp" ? (sortDir === "desc" ? "▼" : "▲") : ""}
                  </th>
                  <th className="px-3 py-4 text-center text-[#ff4d6a]">TF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e3a] text-sm">
                {visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-3xl mb-2">🔍</span>
                        <h3 className="text-base font-black uppercase text-white">
                          No Players Found
                        </h3>
                        <p className="mt-1 text-sm text-[#64748b]">
                          Try adjusting your stage, team filter, or search query.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row, idx) => {
                    const rank = idx + 1;
                    const { ign, tag } = parseRiotName(row.player.name);
                    const acs = row.acsMatches > 0 ? Math.round(row.acsTotal / row.acsMatches) : 0;
                    const adr = row.adrMatches > 0 ? (row.adrTotal / row.adrMatches).toFixed(1) : "--";
                    const kast = row.kastMatches > 0 ? (row.kastTotal / row.kastMatches).toFixed(1) + "%" : "--";
                    const kdNum = row.deaths > 0 ? (row.kills / row.deaths) : row.kills;
                    const kdStr = row.matches > 0 ? kdNum.toFixed(2) : "--";

                    // Highlight top 3 medals
                    const isRank1 = rank === 1;
                    const isRank2 = rank === 2;
                    const isRank3 = rank === 3;

                    return (
                      <tr
                        key={row.player.id}
                        className={`group transition hover:bg-[#0c0c18] ${
                          isRank1
                            ? "bg-[#f59e0b]/[0.03] border-l-2 border-l-[#f59e0b]"
                            : isRank2
                            ? "border-l-2 border-l-[#94a3b8]"
                            : isRank3
                            ? "border-l-2 border-l-[#d97706]"
                            : ""
                        }`}
                      >
                        {/* RANK BADGE */}
                        <td className="px-5 py-4 text-center">
                          {isRank1 ? (
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#f59e0b]/60 bg-gradient-to-br from-[#f59e0b]/30 to-[#f59e0b]/10 text-sm font-black text-[#fbbf24] shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                              01
                            </span>
                          ) : isRank2 ? (
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-400/50 bg-slate-400/10 text-sm font-black text-slate-200">
                              02
                            </span>
                          ) : isRank3 ? (
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-amber-700/50 bg-amber-700/10 text-sm font-black text-amber-400">
                              03
                            </span>
                          ) : (
                            <span className="text-sm font-mono font-bold text-[#64748b]">
                              {String(rank).padStart(2, "0")}
                            </span>
                          )}
                        </td>

                        {/* PLAYER DETAILS */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black uppercase tracking-tight text-white group-hover:text-[#f1f5f9] transition-colors">
                                  {ign}
                                </span>
                                {tag && (
                                  <span className="rounded bg-[#1e1e3a]/90 px-1.5 py-0.5 text-[11px] font-mono font-bold text-[#f1f5f9] border border-[#94a3b8]/30">
                                    #{tag}
                                  </span>
                                )}
                                {row.player.role === "Captain" && (
                                  <span className="rounded bg-[#f59e0b]/15 border border-[#f59e0b]/40 px-1.5 py-0.5 text-[10px] font-black text-[#fbbf24]">
                                    ★ IGL
                                  </span>
                                )}
                              </div>
                              <p className="text-[12px] text-[#64748b] font-medium">
                                {row.team.name}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* FRANCHISE TEAM */}
                        <td className="px-4 py-4">
                          <Link
                            href={`/tournament/teams/${row.team.id}`}
                            className="flex flex-col items-center gap-1.5 rounded-lg px-2 py-1 text-center transition hover:bg-[#1e1e3a]/30"
                          >
                            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#1e1e3a] bg-[#080812]">
                              {row.team.logo ? (
                                <Image
                                  src={row.team.logo}
                                  alt={row.team.name}
                                  fill
                                  className="object-contain p-1"
                                />
                              ) : (
                                <span className="text-[11px] font-black text-[#94a3b8]">
                                  {row.team.tag.slice(0, 3)}
                                </span>
                              )}
                            </div>
                            <span className="max-w-[90px] truncate text-[11px] font-bold uppercase text-[#94a3b8]">
                              {row.team.name}
                            </span>
                          </Link>
                        </td>

                        {/* MATCHES PLAYED */}
                        <td className="px-3 py-4 text-center font-black text-[#f1f5f9]">
                          {row.matches}
                        </td>

                        {/* W - L */}
                        <td className="px-3 py-4 text-center">
                          {row.matches > 0 ? (
                            <span className="text-sm font-bold">
                              <span className="text-[#34d399] font-black">{row.wins}</span>
                              <span className="text-[#475569] mx-1">-</span>
                              <span className="text-[#ff4d6a] font-black">{row.losses}</span>
                            </span>
                          ) : (
                            <span className="text-sm text-[#475569]">0 - 0</span>
                          )}
                        </td>

                        {/* KILLS */}
                        <td className="px-3 py-4 text-center font-black text-white">
                          {row.kills}
                        </td>

                        {/* DEATHS */}
                        <td className="px-3 py-4 text-center font-semibold text-[#ff4d6a]">
                          {row.deaths}
                        </td>

                        {/* ASSISTS */}
                        <td className="px-3 py-4 text-center font-semibold text-[#94a3b8]">
                          {row.assists}
                        </td>

                        {/* K/D RATIO */}
                        <td className="px-4 py-4 text-center">
                          {row.matches > 0 ? (
                            <span
                              className={`rounded-lg px-2 py-1 text-sm font-black ${
                                kdNum >= 1.3
                                  ? "bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30"
                                  : kdNum >= 1.0
                                  ? "bg-[#94a3b8]/10 text-[#f1f5f9] border border-[#94a3b8]/25"
                                  : kdNum >= 0.8
                                  ? "text-[#94a3b8]"
                                  : "text-[#ff4d6a]"
                              }`}
                            >
                              {kdStr}
                            </span>
                          ) : (
                            <span className="text-sm text-[#475569]">--</span>
                          )}
                        </td>

                        {/* ACS RATING */}
                        <td className="px-4 py-4 text-center">
                          {row.matches > 0 ? (
                            <span className="inline-flex items-center justify-center rounded-xl border border-[#94a3b8]/40 bg-[#94a3b8]/10 px-2.5 py-1 text-sm font-black text-[#f1f5f9] shadow-[0_0_12px_rgba(148,163,184,0.15)]">
                              {acs}
                            </span>
                          ) : (
                            <span className="text-sm font-bold text-[#475569]">0</span>
                          )}
                        </td>

                        {/* ADR */}
                        <td className="px-3 py-4 text-center text-sm font-semibold text-[#94a3b8]">
                          {adr}
                        </td>

                        {/* KAST% */}
                        <td className="px-3 py-4 text-center text-sm font-semibold text-[#94a3b8]">
                          {kast}
                        </td>

                        {/* MVP COUNT */}
                        <td className="px-3 py-4 text-center">
                          {row.mvp > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#f59e0b]/40 bg-[#f59e0b]/15 px-2 py-0.5 text-[12px] font-black text-[#fbbf24]">
                              ★ {row.mvp}
                            </span>
                          ) : (
                            <span className="text-sm text-[#475569]">0</span>
                          )}
                        </td>

                        {/* TOP FRAGGER COUNT */}
                        <td className="px-3 py-4 text-center">
                          {row.topFragger > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#ff2d55]/40 bg-[#ff2d55]/15 px-2 py-0.5 text-[12px] font-black text-[#ff4d6a]">
                              ⚔️ {row.topFragger}
                            </span>
                          ) : (
                            <span className="text-sm text-[#475569]">0</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Esports Metric Explainer Legends ──────────────────────────────── */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[#f1f5f9]">
              <span className="text-sm">⚡</span>
              <span className="text-sm font-black uppercase tracking-wider">ACS (COMBAT SCORE)</span>
            </div>
            <p className="mt-2 text-[13px] text-[#94a3b8] leading-relaxed">
              Average Combat Score calculated per round. High damage, multi-kills, and first bloods heavily boost this rating.
            </p>
          </div>

          <div className="rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[#ff4d6a]">
              <span className="text-sm">⚔️</span>
              <span className="text-sm font-black uppercase tracking-wider">K/D & ADR RATINGS</span>
            </div>
            <p className="mt-2 text-[13px] text-[#94a3b8] leading-relaxed">
              Kill-to-Death ratio and Average Damage per Round. Accurately measures combat efficiency across every contested round.
            </p>
          </div>

          <div className="rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[#34d399]">
              <span className="text-sm">🛡️</span>
              <span className="text-sm font-black uppercase tracking-wider">KAST PERCENTAGE</span>
            </div>
            <p className="mt-2 text-[13px] text-[#94a3b8] leading-relaxed">
              Percentage of rounds where the player got a Kill, Assist, Survived, or was Traded by a teammate.
            </p>
          </div>

          <div className="rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[#fbbf24]">
              <span className="text-sm">🌟</span>
              <span className="text-sm font-black uppercase tracking-wider">MVP & TOP FRAGGER</span>
            </div>
            <p className="mt-2 text-[13px] text-[#94a3b8] leading-relaxed">
              MVP awards the highest impact performer on the winning team; TF awards the player with the highest total match kills.
            </p>
          </div>
        </section>

        {/* ── Modern Footer ────────────────────────────────────────────────── */}
        <footer className="mt-12 flex flex-col justify-between items-center gap-4 border-t border-[#1e1e3a] pt-6 text-[12px] font-black uppercase tracking-[0.2em] text-[#64748b] sm:flex-row">
          <span>VALORANT TOURNAMENT // PLAYER TELEMETRY SYSTEM</span>
          <span>POWERED BY RIOT GAMES API & HENRIKDEV TELEMETRY</span>
        </footer>
      </main>
    </div>
  );
}
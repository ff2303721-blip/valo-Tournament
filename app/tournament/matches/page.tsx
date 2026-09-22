"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { TournamentNav } from "../components/tournament-nav";
import { matches as defaultMatches } from "@/app/data/matches";
import { teams as defaultTeams } from "@/app/data/teams";
import type { Match, Team, MatchStatus } from "@/lib/types";
import { getGameDefinition } from "@/lib/games/registry";

const STAGE_OPTIONS = [
  "All Stages",
  "Group Stage",
  "Qualifier 1",
  "Eliminator",
  "Qualifier 2",
  "Grand Final",
];

const STATUS_OPTIONS = [
  "All Statuses",
  "Scheduled",
  "Live",
  "Completed",
];

const MAP_SPLASHES: Record<string, string> = {
  Ascent: "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png",
  Split: "https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/splash.png",
  Bind: "https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/splash.png",
  Breeze: "https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/splash.png",
  Lotus: "https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/splash.png",
  Sunset: "https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/splash.png",
  Haven: "https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/splash.png",
  Pearl: "https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/splash.png",
  Icebox: "https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/splash.png",
  Abyss: "https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/splash.png",
  Fracture: "https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/splash.png",
};

function getMapSplash(mapName?: string | null, activeMaps?: { name: string; splashUrl?: string }[]): string | null {
  if (!mapName) return null;
  if (activeMaps) {
    const found = activeMaps.find((m) => m.name.toLowerCase() === mapName.trim().toLowerCase());
    if (found?.splashUrl) return found.splashUrl;
  }
  const key = Object.keys(MAP_SPLASHES).find(
    (k) => k.toLowerCase() === mapName.trim().toLowerCase(),
  );
  return key ? MAP_SPLASHES[key] : null;
}

function formatDate(value: string) {
  if (!value) return "Schedule TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTeam(teams: Team[], id?: string) {
  return teams.find((team) => team.id === id);
}

function getTeamName(teams: Team[], id?: string) {
  return getTeam(teams, id)?.name ?? "TBD";
}

function getTeamTag(teams: Team[], id?: string) {
  return getTeam(teams, id)?.tag ?? "TBD";
}

type SlotInfo = {
  name: string;
  tag: string;
  seed: string;
  logo?: string;
  isPlaceholder: boolean;
};

function getSlotDetails(
  teams: Team[],
  teamId: string | null | undefined,
  matchNumber: number,
  slot: 1 | 2,
): SlotInfo {
  const team = teamId ? teams.find((t) => t.id === teamId) : null;
  if (team) {
    return {
      name: team.name,
      tag: team.tag ? `[${team.tag}]` : "",
      seed: team.seed ? `#${team.seed}` : "",
      logo: team.logo,
      isPlaceholder: false,
    };
  }

  // Playoff placeholders when teams are waiting to be decided by winners
  if (matchNumber === 13) {
    return {
      name: slot === 1 ? "1st in Group" : "2nd in Group",
      tag: slot === 1 ? "[#1 SEED]" : "[#2 SEED]",
      seed: slot === 1 ? "#1" : "#2",
      isPlaceholder: true,
    };
  }
  if (matchNumber === 14) {
    return {
      name: slot === 1 ? "3rd in Group" : "4th in Group",
      tag: slot === 1 ? "[#3 SEED]" : "[#4 SEED]",
      seed: slot === 1 ? "#3" : "#4",
      isPlaceholder: true,
    };
  }
  if (matchNumber === 15) {
    return {
      name: slot === 1 ? "Loser of Q1" : "Winner of Eliminator",
      tag: slot === 1 ? "[LOSER Q1]" : "[WINNER ELIM]",
      seed: slot === 1 ? "Q1" : "ELIM",
      isPlaceholder: true,
    };
  }
  if (matchNumber === 16) {
    return {
      name: slot === 1 ? "Winner of Q1" : "Winner of Q2",
      tag: slot === 1 ? "[WINNER Q1]" : "[WINNER Q2]",
      seed: "CHAMPIONSHIP",
      isPlaceholder: true,
    };
  }

  return {
    name: "TBD",
    tag: "[TBD]",
    seed: "",
    isPlaceholder: true,
  };
}

function StatusBadge({ status }: { status: MatchStatus }) {
  switch (status) {
    case "Live":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-[#ff2d55]/40 bg-[#ff2d55]/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#ff4d6a]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff2d55] animate-pulse" />
          LIVE
        </span>
      );
    case "Completed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-[#10b981]/40 bg-[#10b981]/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#34d399]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
          FINAL
        </span>
      );
    case "Cancelled":
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-[#64748b]/40 bg-[#64748b]/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#94a3b8]">
          CANCELLED
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#fbbf24]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#fbbf24]" />
          UPCOMING
        </span>
      );
  }
}

export default function PublicMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("All Stages");
  const [status, setStatus] = useState("All Statuses");
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");
  const [gameId, setGameId] = useState<string>("valorant");

  const game = useMemo(() => getGameDefinition(gameId), [gameId]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [matchRes, teamRes, settingsRes] = await Promise.all([
          fetch("/api/matches", { cache: "no-store" }),
          fetch("/api/teams?lite=1", { cache: "no-store" }),
          fetch("/api/settings", { cache: "no-store" }).catch(() => null),
        ]);

        const matchData = matchRes.ok ? await matchRes.json() : null;
        const teamData = teamRes.ok ? await teamRes.json() : null;

        if (!mounted) {
          setLoading(false);
          return;
        }

        if (settingsRes && settingsRes.ok) {
          const sData = await settingsRes.json();
          if (sData?.gameId) setGameId(sData.gameId);
        }

        const loadedMatches = Array.isArray(matchData?.matches)
          ? matchData.matches
          : Array.isArray(matchData)
          ? matchData
          : defaultMatches;

        const loadedTeams = Array.isArray(teamData)
          ? teamData
          : Array.isArray(teamData?.teams)
          ? teamData.teams
          : defaultTeams;

        setMatches(loadedMatches);
        setTeams(loadedTeams);
      } catch (loadError) {
        if (!mounted) {
          setLoading(false);
          return;
        }
        console.warn("Falling back to default fixtures:", loadError);
        setMatches(defaultMatches as unknown as Match[]);
        setTeams(defaultTeams as unknown as Team[]);
        setError("Viewing cached tournament fixtures.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = matches.length;
    const completed = matches.filter((m) => m.status === "Completed").length;
    const live = matches.filter((m) => m.status === "Live").length;
    const upcoming = matches.filter((m) => m.status === "Scheduled" || !m.status).length;
    const groupCount = matches.filter((m) => m.matchNumber <= 12).length;
    const playoffCount = matches.filter((m) => m.matchNumber >= 13).length;
    return { total, completed, live, upcoming, groupCount, playoffCount };
  }, [matches]);

  const filteredMatches = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...matches]
      .filter((match) => {
        if (status !== "All Statuses" && status !== "All" && match.status !== status) {
          return false;
        }

        if (stage !== "All Stages" && stage !== "All") {
          const matchStage = (match.stage || "").toLowerCase();
          const filterStage = stage.toLowerCase();

          if (filterStage === "group stage") {
            if (match.matchNumber > 12 && matchStage !== "group stage") return false;
          } else if (filterStage === "qualifier 1") {
            if (
              match.matchNumber !== 13 &&
              !matchStage.includes("qualifier 1") &&
              matchStage !== "q1"
            )
              return false;
          } else if (filterStage === "eliminator") {
            if (
              match.matchNumber !== 14 &&
              !matchStage.includes("eliminator") &&
              matchStage !== "elim"
            )
              return false;
          } else if (filterStage === "qualifier 2") {
            if (
              match.matchNumber !== 15 &&
              !matchStage.includes("qualifier 2") &&
              matchStage !== "q2"
            )
              return false;
          } else if (filterStage === "grand final") {
            if (
              match.matchNumber !== 16 &&
              !matchStage.includes("grand final") &&
              matchStage !== "gf"
            )
              return false;
          } else {
            if (matchStage !== filterStage) return false;
          }
        }

        if (!query) {
          return true;
        }

        const slot1 = getSlotDetails(teams, match.team1Id, match.matchNumber, 1);
        const slot2 = getSlotDetails(teams, match.team2Id, match.matchNumber, 2);

        const searchable = [
          match.id,
          String(match.matchNumber),
          match.stage,
          match.map,
          getTeamName(teams, match.team1Id),
          getTeamName(teams, match.team2Id),
          slot1.name,
          slot2.name,
          slot1.tag,
          slot2.tag,
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      })
      .sort((a, b) => a.matchNumber - b.matchNumber);
  }, [matches, teams, search, stage, status]);

  return (
    <div className="relative min-h-screen text-[#f1f5f9] pb-24">
      {/* Ambient Neon Glow Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#7c3aed]/12 blur-[180px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-[#ff2d55]/10 blur-[160px]" />
        <div className="absolute bottom-10 left-1/3 h-[500px] w-[500px] rounded-full bg-[#06b6d4]/8 blur-[160px]" />
      </div>

      <TournamentNav />

      <main className="relative z-10 mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* Compact Header & Telemetry Strip */}
        <header className="mb-6 flex flex-col gap-4 border-b border-[#1e1e3a] pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[#06b6d4]/40 bg-[#06b6d4]/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#22d3ee]">
                {game.shortName} ESPORTS
              </span>
              <span className="text-[10px] font-bold text-[#64748b]">
                • {stats.groupCount} Group Fixtures • {stats.playoffCount} Playoff Matches
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-black uppercase tracking-tight text-[#f1f5f9] sm:text-4xl">
              TOURNAMENT{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06b6d4] via-[#7c3aed] to-[#ff2d55]">
                MATCHES
              </span>
            </h1>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-[#1e1e3a] bg-[#0c0c18]/80 px-3 py-1.5 backdrop-blur-md">
              <span className="text-[10px] font-bold uppercase text-[#64748b]">Total:</span>
              <span className="text-xs font-black text-white">{stats.total}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-[#1e1e3a] bg-[#0c0c18]/80 px-3 py-1.5 backdrop-blur-md">
              <span className="text-[10px] font-bold uppercase text-[#06b6d4]">Group:</span>
              <span className="text-xs font-black text-[#22d3ee]">{stats.groupCount}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-[#1e1e3a] bg-[#0c0c18]/80 px-3 py-1.5 backdrop-blur-md">
              <span className="text-[10px] font-bold uppercase text-[#a78bfa]">Playoffs:</span>
              <span className="text-xs font-black text-[#a78bfa]">{stats.playoffCount}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-[#1e1e3a] bg-[#0c0c18]/80 px-3 py-1.5 backdrop-blur-md">
              <span className="text-[10px] font-bold uppercase text-[#34d399]">Completed:</span>
              <span className="text-xs font-black text-[#34d399]">{stats.completed}</span>
            </div>
            {stats.live > 0 && (
              <div className="flex items-center gap-1.5 rounded-xl border border-[#ff2d55]/40 bg-[#ff2d55]/15 px-3 py-1.5 backdrop-blur-md animate-pulse">
                <span className="text-[10px] font-black uppercase text-[#ff4d6a]">Live:</span>
                <span className="text-xs font-black text-white">{stats.live}</span>
              </div>
            )}
          </div>
        </header>

        {error && (
          <div className="mb-4 rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/10 p-3 text-xs font-bold text-[#fbbf24]">
            {error}
          </div>
        )}

        {/* High-Efficiency Controls & Filter Bar */}
        <section className="mb-6 rounded-xl border border-[#1e1e3a] bg-[#0c0c18]/90 p-3 sm:p-4 backdrop-blur-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search match ID, stage, team, or map..."
                className="w-full rounded-lg border border-[#1e1e3a] bg-[#080812] px-3.5 py-2 text-xs font-semibold text-[#f1f5f9] outline-none transition placeholder:text-[#475569] focus:border-[#06b6d4]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#64748b] hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Stage Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="rounded-lg border border-[#1e1e3a] bg-[#080812] px-3 py-2 text-xs font-semibold text-[#f1f5f9] outline-none transition focus:border-[#7c3aed]"
              >
                {STAGE_OPTIONS.map((stageName) => (
                  <option key={stageName} value={stageName} className="bg-[#0c0c18]">
                    {stageName}
                  </option>
                ))}
              </select>

              {/* Status Dropdown */}
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-lg border border-[#1e1e3a] bg-[#080812] px-3 py-2 text-xs font-semibold text-[#f1f5f9] outline-none transition focus:border-[#ff2d55]"
              >
                {STATUS_OPTIONS.map((statusName) => (
                  <option key={statusName} value={statusName} className="bg-[#0c0c18]">
                    {statusName}
                  </option>
                ))}
              </select>

              {/* View Mode Toggle: Grid vs Compact List */}
              <div className="flex items-center rounded-lg border border-[#1e1e3a] bg-[#080812] p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  title="Grid View (Modern Cards)"
                  className={`rounded-md px-2.5 py-1.5 text-xs font-black transition ${
                    viewMode === "grid"
                      ? "bg-[#7c3aed] text-white shadow-[0_0_10px_rgba(124,58,237,0.4)]"
                      : "text-[#64748b] hover:text-[#94a3b8]"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zm-9 9h7v7H4v-7zm9 0h7v7h-7v-7z" />
                    </svg>
                    <span className="hidden sm:inline">Grid</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("compact")}
                  title="Compact List View"
                  className={`rounded-md px-2.5 py-1.5 text-xs font-black transition ${
                    viewMode === "compact"
                      ? "bg-[#7c3aed] text-white shadow-[0_0_10px_rgba(124,58,237,0.4)]"
                      : "text-[#64748b] hover:text-[#94a3b8]"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
                    </svg>
                    <span className="hidden sm:inline">Compact</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Match Feed Content */}
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-xl border border-[#1e1e3a] bg-[#0c0c18]/85"
              />
            ))}
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="rounded-xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-8 text-center backdrop-blur-xl">
            <p className="text-sm font-black text-white">No matches found</p>
            <p className="mt-1 text-xs text-[#64748b]">
              Try clearing your search query or selecting a different stage filter.
            </p>
          </div>
        ) : viewMode === "compact" ? (
          /* ============================================================== */
          /* COMPACT LIST VIEW: High density, minimal scrolling             */
          /* ============================================================== */
          <div className="space-y-2">
            {filteredMatches.map((match) => {
              const slot1 = getSlotDetails(teams, match.team1Id, match.matchNumber, 1);
              const slot2 = getSlotDetails(teams, match.team2Id, match.matchNumber, 2);
              const isCompleted = match.status === "Completed";
              const isTeam1Winner = isCompleted && match.winnerId === match.team1Id;
              const isTeam2Winner = isCompleted && match.winnerId === match.team2Id;

              const stageColor =
                match.matchNumber === 16
                  ? "text-[#fbbf24] bg-[#f59e0b]/10 border-[#f59e0b]/30"
                  : match.matchNumber === 14
                  ? "text-[#ff4d6a] bg-[#ff2d55]/10 border-[#ff2d55]/30"
                  : match.matchNumber >= 13
                  ? "text-[#a78bfa] bg-[#7c3aed]/10 border-[#7c3aed]/30"
                  : "text-[#22d3ee] bg-[#06b6d4]/10 border-[#06b6d4]/30";

              return (
                <Link
                  key={match.id}
                  href={`/tournament/matches/${encodeURIComponent(match.id)}`}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#1e1e3a] bg-[#0c0c18]/90 px-4 py-3 backdrop-blur-md transition hover:border-[#7c3aed]/60 hover:bg-[#121224]"
                >
                  {/* Left: Match badge, Stage, Map */}
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-9 items-center justify-center rounded border border-[#1e1e3a] bg-[#080812] text-[10px] font-black text-white">
                      M{String(match.matchNumber).padStart(2, "0")}
                    </span>
                    <span className={`rounded border px-2 py-0.5 text-[9px] font-black uppercase ${stageColor}`}>
                      {match.stage}
                    </span>
                    <span className="text-[10px] text-[#475569]">•</span>
                    <span className="text-[10px] font-bold uppercase text-[#94a3b8]">
                      {match.map || "TBD"}
                    </span>
                  </div>

                  {/* Center: Teams clash strip */}
                  <div className="flex flex-1 items-center justify-center gap-4 sm:gap-6">
                    {/* Team 1 */}
                    <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                      <span
                        className={`truncate text-xs sm:text-sm font-black uppercase ${
                          isTeam1Winner ? "text-[#34d399]" : slot1.isPlaceholder ? "text-[#a78bfa]" : "text-[#f1f5f9]"
                        }`}
                      >
                        {slot1.name}
                      </span>
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded border border-[#1e1e3a] bg-[#080812]">
                        {slot1.logo ? (
                          <Image
                            src={slot1.logo}
                            alt={slot1.name}
                            width={24}
                            height={24}
                            unoptimized
                            className="h-full w-full object-contain p-0.5"
                          />
                        ) : slot1.isPlaceholder ? (
                          <span className="text-[11px]">
                            {match.matchNumber === 16 ? "🏆" : match.matchNumber === 14 ? "⚔️" : "★"}
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-[#06b6d4]">
                            {slot1.tag.slice(1, 4) || "TBD"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Center Score / VS */}
                    <div className="shrink-0 text-center">
                      {isCompleted ? (
                        <span className="text-xs font-black tracking-widest text-[#34d399]">
                          {match.team1Score} : {match.team2Score}
                        </span>
                      ) : match.status === "Live" ? (
                        <span className="text-xs font-black tracking-widest text-[#ff4d6a] animate-pulse">
                          {match.team1Score} : {match.team2Score}
                        </span>
                      ) : (
                        <span className="rounded bg-[#1e1e3a] px-2 py-0.5 text-[9px] font-black text-[#7c3aed]">
                          VS
                        </span>
                      )}
                    </div>

                    {/* Team 2 */}
                    <div className="flex items-center gap-2 min-w-0 flex-1 justify-start">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded border border-[#1e1e3a] bg-[#080812]">
                        {slot2.logo ? (
                          <Image
                            src={slot2.logo}
                            alt={slot2.name}
                            width={24}
                            height={24}
                            unoptimized
                            className="h-full w-full object-contain p-0.5"
                          />
                        ) : slot2.isPlaceholder ? (
                          <span className="text-[11px]">
                            {match.matchNumber === 16 ? "🏆" : match.matchNumber === 14 ? "⚔️" : "★"}
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-[#7c3aed]">
                            {slot2.tag.slice(1, 4) || "TBD"}
                          </span>
                        )}
                      </div>
                      <span
                        className={`truncate text-xs sm:text-sm font-black uppercase ${
                          isTeam2Winner ? "text-[#34d399]" : slot2.isPlaceholder ? "text-[#a78bfa]" : "text-[#f1f5f9]"
                        }`}
                      >
                        {slot2.name}
                      </span>
                    </div>
                  </div>

                  {/* Right: Status and Link arrow */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <StatusBadge status={match.status} />
                    <span className="text-xs text-[#64748b] transition-transform group-hover:translate-x-1 group-hover:text-[#22d3ee]">
                      →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* ============================================================== */
          /* MODERN 2-COLUMN GRID VIEW: Cinematic map backdrops, compact    */
          /* ============================================================== */
          <div className="grid gap-3.5 sm:grid-cols-2">
            {filteredMatches.map((match) => {
              const slot1 = getSlotDetails(teams, match.team1Id, match.matchNumber, 1);
              const slot2 = getSlotDetails(teams, match.team2Id, match.matchNumber, 2);
              const isCompleted = match.status === "Completed";
              const isTeam1Winner = isCompleted && match.winnerId === match.team1Id;
              const isTeam2Winner = isCompleted && match.winnerId === match.team2Id;
              const mapSplash = getMapSplash(match.map, game.maps);

              const stageColor =
                match.matchNumber === 16
                  ? "text-[#fbbf24] bg-[#f59e0b]/10 border-[#f59e0b]/30"
                  : match.matchNumber === 14
                  ? "text-[#ff4d6a] bg-[#ff2d55]/10 border-[#ff2d55]/30"
                  : match.matchNumber >= 13
                  ? "text-[#a78bfa] bg-[#7c3aed]/10 border-[#7c3aed]/30"
                  : "text-[#22d3ee] bg-[#06b6d4]/10 border-[#06b6d4]/30";

              const borderHoverColor =
                match.matchNumber === 16
                  ? "hover:border-[#f59e0b]/70 hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]"
                  : match.matchNumber === 14
                  ? "hover:border-[#ff2d55]/70 hover:shadow-[0_0_25px_rgba(255,45,85,0.2)]"
                  : match.matchNumber >= 13
                  ? "hover:border-[#7c3aed]/70 hover:shadow-[0_0_25px_rgba(124,58,237,0.2)]"
                  : "hover:border-[#06b6d4]/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]";

              return (
                <Link
                  key={match.id}
                  href={`/tournament/matches/${encodeURIComponent(match.id)}`}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[#1e1e3a] bg-[#0c0c18]/90 p-4 backdrop-blur-xl transition hover:-translate-y-0.5 ${borderHoverColor}`}
                >
                  {/* Subtle Map Splash Backdrop Texture */}
                  {mapSplash && (
                    <div
                      className="pointer-events-none absolute inset-0 opacity-15 transition-opacity duration-300 group-hover:opacity-25"
                      style={{
                        backgroundImage: `url("${mapSplash}")`,
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                      }}
                    />
                  )}

                  {/* Gradient mask to keep readability crisp */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0c0c18] via-[#0c0c18]/80 to-[#0c0c18]" />

                  {/* Card Content Top Strip: Match ID, Stage, Map, Status */}
                  <div className="relative z-10 flex items-center justify-between gap-2 border-b border-[#1e1e3a]/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 items-center justify-center rounded border border-[#1e1e3a] bg-[#080812]/90 px-2 text-[10px] font-black tracking-wider text-white">
                        M{String(match.matchNumber).padStart(2, "0")}
                      </span>

                      <span
                        className={`rounded border px-2 py-0.5 text-[8px] font-black uppercase tracking-wider ${stageColor}`}
                      >
                        {match.stage}
                      </span>

                      <span className="rounded border border-[#1e1e3a] bg-[#080812]/80 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-[#94a3b8]">
                        🗺️ {match.map || "TBD"} • BO{match.bestOf}
                      </span>
                    </div>

                    <StatusBadge status={match.status} />
                  </div>

                  {/* Match Clash Body */}
                  <div className="relative z-10 my-3 flex items-center justify-between gap-2">
                    {/* Team 1 (Left) */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#1e1e3a] bg-[#080812] shadow-inner">
                        {slot1.logo ? (
                          <Image
                            src={slot1.logo}
                            alt={slot1.name}
                            width={40}
                            height={40}
                            unoptimized
                            className="h-full w-full object-contain p-1"
                          />
                        ) : slot1.isPlaceholder ? (
                          <span className="text-lg">
                            {match.matchNumber === 16 ? "🏆" : match.matchNumber === 14 ? "⚔️" : "★"}
                          </span>
                        ) : (
                          <span className="text-xs font-black text-[#06b6d4]">
                            {slot1.tag.slice(1, 4) || "TBD"}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-xs sm:text-sm font-black uppercase tracking-tight ${
                            isTeam1Winner
                              ? "text-[#34d399]"
                              : slot1.isPlaceholder
                              ? "text-[#cbd5e1]"
                              : "text-[#f1f5f9]"
                          }`}
                        >
                          {slot1.name}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className="rounded bg-[#1e1e3a] px-1.5 py-0.5 text-[8px] font-bold uppercase text-[#94a3b8]">
                            {slot1.tag}
                          </span>
                          {slot1.seed && !slot1.isPlaceholder && (
                            <span className="text-[9px] font-bold text-[#64748b]">
                              {slot1.seed}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Center Score / VS */}
                    <div className="shrink-0 px-2 text-center">
                      {isCompleted ? (
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1.5 text-base sm:text-lg font-black tracking-tight text-white">
                            <span className={isTeam1Winner ? "text-[#34d399]" : "text-[#64748b]"}>
                              {match.team1Score}
                            </span>
                            <span className="text-xs text-[#475569]">:</span>
                            <span className={isTeam2Winner ? "text-[#34d399]" : "text-[#64748b]"}>
                              {match.team2Score}
                            </span>
                          </div>
                        </div>
                      ) : match.status === "Live" ? (
                        <div className="flex flex-col items-center animate-pulse">
                          <div className="flex items-center gap-1.5 text-base font-black text-white">
                            <span>{match.team1Score}</span>
                            <span className="text-[#ff2d55]">:</span>
                            <span>{match.team2Score}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="rounded-lg border border-[#7c3aed]/40 bg-[#7c3aed]/10 px-2.5 py-0.5 text-[10px] font-black tracking-wider text-[#a78bfa] shadow-[0_0_10px_rgba(124,58,237,0.2)]">
                            VS
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Team 2 (Right) */}
                    <div className="flex items-center gap-3 min-w-0 flex-1 flex-row-reverse text-right">
                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#1e1e3a] bg-[#080812] shadow-inner">
                        {slot2.logo ? (
                          <Image
                            src={slot2.logo}
                            alt={slot2.name}
                            width={40}
                            height={40}
                            unoptimized
                            className="h-full w-full object-contain p-1"
                          />
                        ) : slot2.isPlaceholder ? (
                          <span className="text-lg">
                            {match.matchNumber === 16 ? "🏆" : match.matchNumber === 14 ? "⚔️" : "★"}
                          </span>
                        ) : (
                          <span className="text-xs font-black text-[#7c3aed]">
                            {slot2.tag.slice(1, 4) || "TBD"}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-xs sm:text-sm font-black uppercase tracking-tight ${
                            isTeam2Winner
                              ? "text-[#34d399]"
                              : slot2.isPlaceholder
                              ? "text-[#cbd5e1]"
                              : "text-[#f1f5f9]"
                          }`}
                        >
                          {slot2.name}
                        </p>
                        <div className="mt-0.5 flex items-center justify-end gap-1.5">
                          {slot2.seed && !slot2.isPlaceholder && (
                            <span className="text-[9px] font-bold text-[#64748b]">
                              {slot2.seed}
                            </span>
                          )}
                          <span className="rounded bg-[#1e1e3a] px-1.5 py-0.5 text-[8px] font-bold uppercase text-[#94a3b8]">
                            {slot2.tag}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Strip */}
                  <div className="relative z-10 flex items-center justify-between border-t border-[#1e1e3a]/60 pt-2 text-[10px]">
                    <span className="font-semibold text-[#64748b]">
                      🕒 {formatDate(match.scheduledAt)}
                    </span>
                    <span className="font-black uppercase tracking-wider text-[#22d3ee] group-hover:text-white transition flex items-center gap-1">
                      <span>DETAILS</span>
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
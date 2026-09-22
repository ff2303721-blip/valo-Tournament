"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getGameDefinition } from "@/lib/games/registry";

type Team = {
  id: string;
  name: string;
  tag: string;
  seed: number;
  logo?: string;
  wins: number;
  losses: number;
  captainRank?: string;
  players: Player[];
};

type Player = {
  id: string;
  name: string;
  role?: string;
};

type PlayerStat = {
  playerId: string;
  playerName: string;
  teamId: string;
  kills: number;
  deaths: number;
  assists: number;
  acs: number;
  adr: number;
  kast: number;
};

type Match = {
  id: string;
  matchNumber: number;
  stage: string;
  team1Id: string;
  team2Id: string;
  scheduledAt: string;
  map: string;
  bestOf: number;
  team1Score: number;
  team2Score: number;
  status: "Scheduled" | "Live" | "Completed" | "Cancelled";
  winnerId?: string;
  mvpPlayerId?: string;
  topFraggerPlayerId?: string;
  playerStats: PlayerStat[];
  createdAt: string;
};

type EditableStat = PlayerStat;

function formatDate(value: string) {
  if (!value) return "Schedule TBD";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function MatchResultRecorderPage() {
  const params = useParams<{ id: string }>();
  const matchId = params?.id;

  const [match, setMatch] = useState<Match | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [stats, setStats] = useState<EditableStat[]>([]);

  const [selectedMvp, setSelectedMvp] = useState("");
  const [selectedTopFragger, setSelectedTopFragger] = useState("");

  const [ocrText, setOcrText] = useState("");
  const [ocrRunning, setOcrRunning] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);

  const [winnerId, setWinnerId] = useState("");

  // Game and Ingestion State
  const [gameId, setGameId] = useState<string>("valorant");
  const activeGame = useMemo(() => getGameDefinition(gameId), [gameId]);

  const [ingestionMethod, setIngestionMethod] = useState<"riot" | "ocr">("riot");
  const [riotPlayerInput, setRiotPlayerInput] = useState("");
  const [riotRegion, setRiotRegion] = useState("ap");
  const [fetchingRiot, setFetchingRiot] = useState(false);
  const [riotFetchError, setRiotFetchError] = useState("");
  const [riotFetchSuccess, setRiotFetchSuccess] = useState("");

  const teamById = useMemo(() => {
    const map = new Map<string, Team>();
    for (const team of teams) {
      map.set(team.id, team);
    }
    return map;
  }, [teams]);

  const team1 = match ? teamById.get(match.team1Id) : undefined;
  const team2 = match ? teamById.get(match.team2Id) : undefined;

  const playerOptions = useMemo(() => {
    const players = [...stats];
    return players.sort((a, b) => {
      const teamA = teamById.get(a.teamId)?.name ?? "";
      const teamB = teamById.get(b.teamId)?.name ?? "";
      return (
        teamA.localeCompare(teamB) ||
        a.playerName.localeCompare(b.playerName)
      );
    });
  }, [stats, teamById]);

  useEffect(() => {
    if (!matchId) return;

    let mounted = true;

    async function loadData() {
      try {
        const [matchResponse, teamsResponse] = await Promise.all([
          fetch(`/api/matches/${encodeURIComponent(matchId)}`, {
            cache: "no-store",
          }),
          fetch("/api/teams?lite=1", {
            cache: "no-store",
          }),
        ]);

        if (!matchResponse.ok) {
          throw new Error("Unable to load match.");
        }

        if (!teamsResponse.ok) {
          throw new Error("Unable to load teams.");
        }

        const matchData: Match = await matchResponse.json();
        const teamsData: Team[] = await teamsResponse.json();

        if (!mounted) {
          setLoading(false);
          return;
        }

        setMatch(matchData);
        setTeams(teamsData);

        const incomingStats = Array.isArray(matchData.playerStats)
          ? matchData.playerStats
          : [];

        setStats(
          incomingStats.map((player) => ({
            playerId: player.playerId ?? "",
            playerName: player.playerName ?? "",
            teamId: player.teamId ?? "",
            kills: Number(player.kills ?? 0),
            deaths: Number(player.deaths ?? 0),
            assists: Number(player.assists ?? 0),
            acs: Number(player.acs ?? 0),
            adr: Number(player.adr ?? 0),
            kast: Number(player.kast ?? 0),
          })),
        );

        setTeam1Score(Number(matchData.team1Score ?? 0));
        setTeam2Score(Number(matchData.team2Score ?? 0));
        setWinnerId(matchData.winnerId ?? "");
        setSelectedMvp(matchData.mvpPlayerId ?? "");
        setSelectedTopFragger(matchData.topFraggerPlayerId ?? "");

        try {
          const settingsRes = await fetch("/api/settings", { cache: "no-store" });
          if (settingsRes.ok) {
            const sData = await settingsRes.json();
            if (sData?.gameId) {
              setGameId(sData.gameId);
              const g = getGameDefinition(sData.gameId);
              if (!g.supportsRiotApi) {
                setIngestionMethod("ocr");
              }
            }
          }
        } catch {
          // Keep default
        }
      } catch (loadError) {
        if (!mounted) {
          setLoading(false);
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load match.",
        );
      } finally {
        setLoading(false);
      }
    }

    if (typeof window !== "undefined") {
      const savedRegion = localStorage.getItem("valorant_region") || "ap";
      setRiotRegion(savedRegion);
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [matchId]);

  async function handleFetchFromRiot() {
    if (!riotPlayerInput.trim()) {
      setRiotFetchError("Please enter a player's Riot ID (e.g. PlayerName#TAG) or Match UUID.");
      return;
    }

    setFetchingRiot(true);
    setRiotFetchError("");
    setRiotFetchSuccess("");
    setError("");

    try {
      const apiKey = typeof window !== "undefined" ? localStorage.getItem("valorant_henrik_key") || "" : "";

      const payload: any = {
        region: riotRegion,
        apiKey: apiKey || undefined,
        team1Id: match?.team1Id,
        team2Id: match?.team2Id,
        team1Players: team1?.players?.map((p) => ({ id: p.id, name: p.name })) || [],
        team2Players: team2?.players?.map((p) => ({ id: p.id, name: p.name })) || [],
      };

      if (riotPlayerInput.includes("-") && riotPlayerInput.length > 25) {
        payload.matchId = riotPlayerInput.trim();
      } else {
        payload.riotId = riotPlayerInput.trim();
      }

      const res = await fetch("/api/riot/fetch-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data?.error || "Failed to fetch match from Riot.");
      }

      // Apply fetched scores
      setTeam1Score(Number(data.team1Score ?? 0));
      setTeam2Score(Number(data.team2Score ?? 0));

      const fetchedMap =
        typeof data.map === "object" && data.map !== null
          ? (data.map.name || data.map.id || "Bind")
          : String(data.map || "Bind");

      if (data.map && match) {
        setMatch((prev) => (prev ? { ...prev, map: fetchedMap } : prev));
      }

      // Apply player stats
      if (Array.isArray(data.stats) && data.stats.length > 0) {
        const norm = (s: string) => (s || "").split("#")[0].toLowerCase().replace(/[^a-z0-9]/g, "");

        setStats(
          data.stats.map((s: any) => {
            const pName = typeof s.playerName === "object" ? (s.playerName?.name || "Unknown") : String(s.playerName || "Unknown");
            let pid = s.playerId || "";

            if (!pid) {
              for (const t of teams) {
                const found = t.players?.find((p) => {
                  const pn = norm(p.name);
                  const sn = norm(pName);
                  return pn === sn || (pn.length >= 3 && sn.length >= 3 && (pn.includes(sn) || sn.includes(pn)));
                });
                if (found) {
                  pid = found.id;
                  break;
                }
              }
            }

            return {
              playerId: pid,
              playerName: pName,
              teamId: s.teamId || "",
              kills: Number(s.kills || 0),
              deaths: Number(s.deaths || 0),
              assists: Number(s.assists || 0),
              acs: Number(s.acs || 0),
              adr: Number(s.adr || 0),
              kast: Number(s.kast || 0),
            };
          }),
        );
      }

      // Apply winner & accolades
      if (data.winnerId) {
        setWinnerId(data.winnerId);
      }
      if (data.mvpPlayerId) {
        setSelectedMvp(data.mvpPlayerId);
      }
      if (data.topFraggerPlayerId) {
        setSelectedTopFragger(data.topFraggerPlayerId);
      }

      setRiotFetchSuccess(
        `⚡ Riot Match synced! Map: ${fetchedMap.toUpperCase()} • Score: ${data.team1Score} - ${data.team2Score} • ${data.stats?.length || 0} players loaded.`,
      );
    } catch (err: any) {
      setRiotFetchError(err?.message || "Failed to fetch from Riot.");
    } finally {
      setFetchingRiot(false);
    }
  }

  function updateStat(
    index: number,
    field: keyof EditableStat,
    value: string,
  ) {
    setStats((current) =>
      current.map((stat, statIndex) => {
        if (statIndex !== index) {
          return stat;
        }

        if (field === "playerName" || field === "playerId" || field === "teamId") {
          return {
            ...stat,
            [field]: value,
          };
        }

        return {
          ...stat,
          [field]: numberValue(value),
        };
      }),
    );
  }

  function addPlayer() {
    if (!match) return;

    const defaultTeamId = match.team1Id || match.team2Id || "";

    setStats((current) => [
      ...current,
      {
        playerId: "",
        playerName: "",
        teamId: defaultTeamId,
        kills: 0,
        deaths: 0,
        assists: 0,
        acs: 0,
        adr: 0,
        kast: 0,
      },
    ]);
  }

  function removePlayer(index: number) {
    setStats((current) =>
      current.filter((_, statIndex) => statIndex !== index),
    );
  }

  async function handleScreenshot(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setOcrRunning(true);
    setError("");
    setMessage("");
    setOcrText("");

    try {
      const Tesseract = await import("tesseract.js");

      const result = await Tesseract.recognize(file, "eng", {
        logger: (info) => {
          if (
            info.status === "recognizing text" &&
            typeof info.progress === "number"
          ) {
            setMessage(`OCR Recognition in progress: ${Math.round(info.progress * 100)}%`);
          }
        },
      });

      setOcrText(result.data.text);
      setMessage("OCR text extraction completed. Review the parsed values and adjust the scoreboard rows below.");
    } catch (ocrError) {
      setError(
        ocrError instanceof Error
          ? ocrError.message
          : "OCR processing failed.",
      );
    } finally {
      setOcrRunning(false);
    }
  }

  function determineWinner() {
    if (!match) {
      return "";
    }

    if (team1Score > team2Score) {
      return match.team1Id;
    }

    if (team2Score > team1Score) {
      return match.team2Id;
    }

    return winnerId;
  }

  async function saveResult() {
    if (!match) return;

    setSaving(true);
    setError("");
    setMessage("");

    const calculatedWinner = determineWinner();

    if (!calculatedWinner) {
      setError("Please set a winning score or select a winning team.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/matches/${encodeURIComponent(match.id)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            matchNumber: match.matchNumber,
            stage: match.stage,
            team1Id: match.team1Id || null,
            team2Id: match.team2Id || null,
            scheduledAt: match.scheduledAt || null,
            map: typeof match.map === "object" ? ((match.map as any)?.name || "Bind") : String(match.map || "TBD"),
            bestOf: match.bestOf,
            team1Score,
            team2Score,
            status: "Completed",
            winnerId: calculatedWinner,
            mvpPlayerId: (() => {
              if (selectedMvp) return selectedMvp;
              const norm = (s: string) => (s || "").split("#")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
              const winnerStats = stats.filter((s) => s.teamId === calculatedWinner);
              const pool = winnerStats.length > 0 ? winnerStats : stats;
              const top = [...pool].sort((a, b) => Number(b.acs || 0) - Number(a.acs || 0))[0];
              if (!top) return null;
              if (top.playerId) return top.playerId;
              for (const t of teams) {
                const found = t.players?.find((p) => norm(p.name) === norm(top.playerName));
                if (found) return found.id;
              }
              return null;
            })(),
            topFraggerPlayerId: (() => {
              if (selectedTopFragger) return selectedTopFragger;
              const norm = (s: string) => (s || "").split("#")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
              const top = [...stats].sort((a, b) => Number(b.kills || 0) - Number(a.kills || 0))[0];
              if (!top) return null;
              if (top.playerId) return top.playerId;
              for (const t of teams) {
                const found = t.players?.find((p) => norm(p.name) === norm(top.playerName));
                if (found) return found.id;
              }
              return null;
            })(),
            playerStats: stats.map((stat) => {
              let pid = stat.playerId || null;
              if (!pid) {
                const norm = (s: string) => (s || "").split("#")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
                for (const t of teams) {
                  const found = t.players?.find((p) => {
                    const pn = norm(p.name);
                    const sn = norm(stat.playerName);
                    return pn === sn || (pn.length >= 3 && sn.length >= 3 && (pn.includes(sn) || sn.includes(pn)));
                  });
                  if (found) {
                    pid = found.id;
                    break;
                  }
                }
              }
              return {
                playerId: pid,
                playerName: stat.playerName,
                teamId: stat.teamId || null,
                kills: Number(stat.kills) || 0,
                deaths: Number(stat.deaths) || 0,
                assists: Number(stat.assists) || 0,
                acs: Number(stat.acs) || 0,
                adr: Number(stat.adr) || 0,
                kast: Number(stat.kast) || 0,
              };
            }),
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Unable to save match result.");
      }

      setMatch(data);
      setStats(data.playerStats ?? []);
      setWinnerId(data.winnerId ?? calculatedWinner);
      setSelectedMvp(data.mvpPlayerId ?? selectedMvp);
      setSelectedTopFragger(data.topFraggerPlayerId ?? selectedTopFragger);
      setTeam1Score(Number(data.team1Score ?? team1Score));
      setTeam2Score(Number(data.team2Score ?? team2Score));

      setMessage("Official match result and player stats saved successfully.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save match result.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative min-h-screen text-[#f1f5f9] pb-24">
      {/* ── Ambient Neon Glow Orbs ────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#7c3aed]/12 blur-[180px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-[#ff2d55]/10 blur-[160px]" />
        <div className="absolute bottom-10 left-1/3 h-[500px] w-[500px] rounded-full bg-[#06b6d4]/8 blur-[160px]" />
      </div>

      {/* ── Command Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-[#1e1e3a] bg-[#030308]/85 px-4 py-3.5 backdrop-blur-2xl sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Link
              href="/matches"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ff2d55]/40 bg-[#ff2d55]/10 text-sm font-black text-[#ff2d55] transition hover:scale-105 hover:bg-[#ff2d55]/20"
            >
              ←
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight sm:text-lg">
                  RESULT RECORDER{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff2d55] to-[#7c3aed]">
                    // {match ? `M${String(match.matchNumber).padStart(2, "0")}` : "LOADING"}
                  </span>
                </h1>
                {match && (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-[#06b6d4]/30 bg-[#06b6d4]/10 px-2 py-0.5 text-[9px] font-black text-[#22d3ee]">
                    {match.stage}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#64748b]">
                Scoreboard Screenshot OCR & Telemetry Input Deck
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/matches"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#1e1e3a] bg-[#0c0c18]/90 px-3.5 py-2 text-[10px] font-black tracking-widest text-[#94a3b8] transition hover:border-[#7c3aed]/50 hover:text-white"
            >
              <span>← MATCH CENTER</span>
            </Link>

            {match && (
              <Link
                href={`/tournament/matches/${match.id}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#06b6d4]/40 bg-[#06b6d4]/10 px-3.5 py-2 text-[10px] font-black tracking-widest text-[#22d3ee] transition hover:bg-[#06b6d4]/20 hover:shadow-[0_0_18px_rgba(6,182,212,0.25)]"
              >
                <span>PUBLIC PAGE</span>
                <span className="text-xs">↗</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Workspace ─────────────────────────────────────────────────── */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 pt-8 sm:px-8">
        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-44 rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85" />
            <div className="h-64 rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85" />
          </div>
        ) : !match ? (
          <div className="rounded-2xl border border-[#ff2d55]/40 bg-[#ff2d55]/10 p-12 text-center backdrop-blur-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ff4d6a]">
              Error
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase text-white">
              Match Not Found
            </h1>
            <p className="mt-3 text-sm text-[#94a3b8]">
              {error || "The requested match does not exist in the database."}
            </p>
            <Link
              href="/matches"
              className="mt-6 inline-flex rounded-xl border border-[#ff2d55]/40 bg-[#ff2d55]/15 px-6 py-3 text-xs font-black uppercase tracking-wider text-[#ff4d6a]"
            >
              ← Back to Match Center
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 rounded-xl border border-[#ff2d55]/40 bg-[#ff2d55]/10 p-4 text-sm font-semibold text-[#ff4d6a] shadow-[0_0_20px_rgba(255,45,85,0.15)]">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ff2d55]/20 text-xs font-black">!</span>
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="flex items-center gap-3 rounded-xl border border-[#10b981]/40 bg-[#10b981]/10 p-4 text-sm font-semibold text-[#34d399] shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#10b981]/20 text-xs font-black">✓</span>
                <span>{message}</span>
              </div>
            )}

            {/* Top Match Score & Outcome Card */}
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              {/* Score Input Card */}
              <section className="relative overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-6 backdrop-blur-xl sm:p-8">
                <div className="flex items-center justify-between border-b border-[#1e1e3a] pb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#06b6d4]">
                      OFFICIAL SCOREBOARD
                    </p>
                    <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-[#f1f5f9]">
                      Round Scores
                    </h2>
                  </div>
                  <span className="rounded-full border border-[#06b6d4]/30 bg-[#06b6d4]/10 px-3 py-1 text-[9px] font-black text-[#22d3ee]">
                    {typeof match.map === "object" ? ((match.map as any)?.name || "Bind") : (match.map || "TBD")} • BO{match.bestOf}
                  </span>
                </div>

                <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  {/* Team 1 Score */}
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#06b6d4]">
                      Team 1
                    </p>
                    <h3 className="mt-1 text-xl font-black uppercase tracking-tight text-[#f1f5f9]">
                      {team1?.name ?? match.team1Id ?? "TBD"}
                    </h3>
                    <p className="text-xs font-bold text-[#64748b]">
                      {team1?.tag ? `[${team1.tag}]` : "Team 1"}
                    </p>
                  </div>

                  {/* Inputs */}
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <input
                        type="number"
                        min={0}
                        value={team1Score}
                        onChange={(e) =>
                          setTeam1Score(Math.max(0, numberValue(e.target.value)))
                        }
                        className="w-24 rounded-2xl border border-[#06b6d4]/40 bg-[#080812] py-4 text-center text-3xl font-black text-[#22d3ee] outline-none shadow-[0_0_20px_rgba(6,182,212,0.15)] focus:border-[#06b6d4]"
                      />
                      <span className="mt-1 block text-[9px] font-black uppercase tracking-wider text-[#64748b]">
                        ROUNDS
                      </span>
                    </div>

                    <span className="text-2xl font-black text-[#475569]">:</span>

                    <div className="text-center">
                      <input
                        type="number"
                        min={0}
                        value={team2Score}
                        onChange={(e) =>
                          setTeam2Score(Math.max(0, numberValue(e.target.value)))
                        }
                        className="w-24 rounded-2xl border border-[#7c3aed]/40 bg-[#080812] py-4 text-center text-3xl font-black text-[#a78bfa] outline-none shadow-[0_0_20px_rgba(124,58,237,0.15)] focus:border-[#7c3aed]"
                      />
                      <span className="mt-1 block text-[9px] font-black uppercase tracking-wider text-[#64748b]">
                        ROUNDS
                      </span>
                    </div>
                  </div>

                  {/* Team 2 Score */}
                  <div className="flex-1 text-left sm:text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#7c3aed]">
                      Team 2
                    </p>
                    <h3 className="mt-1 text-xl font-black uppercase tracking-tight text-[#f1f5f9]">
                      {team2?.name ?? match.team2Id ?? "TBD"}
                    </h3>
                    <p className="text-xs font-bold text-[#64748b]">
                      {team2?.tag ? `[${team2.tag}]` : "Team 2"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#1e1e3a] pt-4 text-xs font-semibold text-[#64748b]">
                  <span>{formatDate(match.scheduledAt)}</span>
                  <span>Match ID: <strong className="text-white">{match.id}</strong></span>
                </div>
              </section>

              {/* Match Outcome Card */}
              <section className="relative overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-6 backdrop-blur-xl sm:p-8">
                <div className="border-b border-[#1e1e3a] pb-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#f59e0b]">
                    HONORS & OUTCOME
                  </p>
                  <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-[#f1f5f9]">
                    Match Resolution
                  </h2>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#64748b]">
                      Official Winner
                    </label>
                    <select
                      value={winnerId}
                      onChange={(e) => setWinnerId(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-[#1e1e3a] bg-[#080812] px-4 py-3 text-sm font-semibold text-[#f1f5f9] outline-none transition focus:border-[#10b981]"
                    >
                      <option value="" className="bg-[#0c0c18]">Auto-calculate from round scores</option>
                      {team1 && <option value={team1.id} className="bg-[#0c0c18]">{team1.name} [{team1.tag}]</option>}
                      {team2 && <option value={team2.id} className="bg-[#0c0c18]">{team2.name} [{team2.tag}]</option>}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#64748b]">
                      Match MVP Award
                    </label>
                    <select
                      value={selectedMvp}
                      onChange={(e) => setSelectedMvp(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-[#1e1e3a] bg-[#080812] px-4 py-3 text-sm font-semibold text-[#f1f5f9] outline-none transition focus:border-[#f59e0b]"
                    >
                      <option value="" className="bg-[#0c0c18]">Select MVP Player</option>
                      {playerOptions.map((player) => (
                        <option
                          key={`mvp-${player.playerId}-${player.playerName}`}
                          value={player.playerId}
                          className="bg-[#0c0c18]"
                        >
                          {player.playerName} ({teamById.get(player.teamId)?.tag ?? "Team"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#64748b]">
                      Top Fragger Award
                    </label>
                    <select
                      value={selectedTopFragger}
                      onChange={(e) => setSelectedTopFragger(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-[#1e1e3a] bg-[#080812] px-4 py-3 text-sm font-semibold text-[#f1f5f9] outline-none transition focus:border-[#ff2d55]"
                    >
                      <option value="" className="bg-[#0c0c18]">Select Top Fragger</option>
                      {playerOptions.map((player) => (
                        <option
                          key={`fragger-${player.playerId}-${player.playerName}`}
                          value={player.playerId}
                          className="bg-[#0c0c18]"
                        >
                          {player.playerName} ({teamById.get(player.teamId)?.tag ?? "Team"})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>
            </div>

            {/* ── Dual Ingestion Engine: Riot API & Screenshot OCR ────────────────── */}
            <section className="relative overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-6 backdrop-blur-xl sm:p-8">
              {/* Tab Selector Header */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#1e1e3a] pb-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#06b6d4]">
                    DATA INGESTION ENGINE
                  </p>
                  <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-[#f1f5f9]">
                    Scoreboard & Roster Stats Importer
                  </h2>
                </div>

                <div className="inline-flex rounded-xl border border-[#1e1e3a] bg-[#080812] p-1">
                  {activeGame.supportsRiotApi && (
                    <button
                      type="button"
                      onClick={() => setIngestionMethod("riot")}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wider transition ${
                        ingestionMethod === "riot"
                          ? "border border-[#06b6d4]/50 bg-[#06b6d4]/20 text-[#22d3ee] shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                          : "text-[#64748b] hover:text-[#f1f5f9]"
                      }`}
                    >
                      <span>⚡ Auto-Fetch (Riot API)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIngestionMethod("ocr")}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wider transition ${
                      ingestionMethod === "ocr"
                        ? "border border-[#f59e0b]/50 bg-[#f59e0b]/20 text-[#fbbf24] shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                        : "text-[#64748b] hover:text-[#f1f5f9]"
                    }`}
                  >
                    <span>📷 Screenshot OCR (Scoreboard)</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: RIOT API AUTO-FETCH */}
              {activeGame.supportsRiotApi && ingestionMethod === "riot" && (
                <div className="mt-6 space-y-6">
                  <p className="text-xs text-[#94a3b8]">
                    Enter any participant or captain's <strong>Riot ID (Name#TAG)</strong> or paste the match UUID. Official rounds, ACS, combat score, and kills/deaths will auto-populate with 100% precision.
                  </p>

                  {/* Quick Player Suggestion Chips */}
                  {(team1 || team2) && (
                    <div className="rounded-xl border border-[#1e1e3a] bg-[#080812]/70 p-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#64748b] block mb-2">
                        Quick Select Participant from Lineups:
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {team1?.players?.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setRiotPlayerInput(p.name)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#06b6d4]/30 bg-[#06b6d4]/10 px-2.5 py-1 text-[11px] font-bold text-[#67e8f9] transition hover:bg-[#06b6d4]/25 hover:border-[#06b6d4]"
                          >
                            <span className="text-[9px] text-[#06b6d4]">[{team1.tag}]</span>
                            <span>{p.name}</span>
                          </button>
                        ))}
                        {team2?.players?.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setRiotPlayerInput(p.name)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#7c3aed]/30 bg-[#7c3aed]/10 px-2.5 py-1 text-[11px] font-bold text-[#c084fc] transition hover:bg-[#7c3aed]/25 hover:border-[#7c3aed]"
                          >
                            <span className="text-[9px] text-[#a78bfa]">[{team2.tag}]</span>
                            <span>{p.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input row */}
                  <div className="grid gap-4 sm:grid-cols-12 items-end">
                    <div className="sm:col-span-6">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#64748b]">
                        Player Riot ID or Match UUID
                      </label>
                      <input
                        type="text"
                        value={riotPlayerInput}
                        onChange={(e) => setRiotPlayerInput(e.target.value)}
                        placeholder="e.g. Nishku#VAL or 714838f4-5011-..."
                        className="mt-1.5 w-full rounded-xl border border-[#1e1e3a] bg-[#080812] px-4 py-3 text-sm font-semibold text-[#f1f5f9] outline-none transition focus:border-[#06b6d4]"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#64748b]">
                        Server Cluster
                      </label>
                      <select
                        value={riotRegion}
                        onChange={(e) => setRiotRegion(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-[#1e1e3a] bg-[#080812] px-3 py-3 text-sm font-semibold text-[#f1f5f9] outline-none transition focus:border-[#06b6d4]"
                      >
                        <option value="ap" className="bg-[#0c0c18]">AP (Mumbai / Asia)</option>
                        <option value="eu" className="bg-[#0c0c18]">EU (Europe)</option>
                        <option value="na" className="bg-[#0c0c18]">NA (North America)</option>
                        <option value="kr" className="bg-[#0c0c18]">KR (Korea)</option>
                        <option value="latam" className="bg-[#0c0c18]">LATAM</option>
                        <option value="br" className="bg-[#0c0c18]">BR (Brazil)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <button
                        type="button"
                        onClick={handleFetchFromRiot}
                        disabled={fetchingRiot || !riotPlayerInput.trim()}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#06b6d4]/50 bg-gradient-to-r from-[#06b6d4] to-[#7c3aed] px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-[0_0_20px_rgba(6,182,212,0.25)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {fetchingRiot ? (
                          <>
                            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            <span>Fetching...</span>
                          </>
                        ) : (
                          <span>⚡ Fetch Match</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Feedback Messages */}
                  {riotFetchSuccess && (
                    <div className="rounded-xl border border-[#10b981]/40 bg-[#10b981]/10 p-3.5 text-xs font-bold text-[#34d399] flex items-center gap-2">
                      <span>✓</span>
                      <span>{riotFetchSuccess}</span>
                    </div>
                  )}

                  {riotFetchError && (
                    <div className="rounded-xl border border-[#ff2d55]/40 bg-[#ff2d55]/10 p-3.5 text-xs font-bold text-[#ff4d6a] flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{riotFetchError}</span>
                      </div>
                      <p className="text-[10px] text-[#94a3b8]">
                        Need an API key? Configure it in <Link href="/admin/settings" className="text-[#22d3ee] underline font-bold">Admin Settings</Link> or switch to the Screenshot OCR tab above.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: SCREENSHOT OCR */}
              {ingestionMethod === "ocr" && (
                <div className="mt-6 space-y-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-[#94a3b8]">
                        Upload the end-game scoreboard to parse player names, ACS, and combat stats automatically via OCR.
                      </p>
                    </div>

                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-5 py-3 text-xs font-black uppercase tracking-widest text-[#fbbf24] transition hover:bg-[#f59e0b]/20 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                      {ocrRunning ? (
                        <>
                          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#fbbf24] border-t-transparent" />
                          <span>Parsing Screenshot...</span>
                        </>
                      ) : (
                        <span>Upload Screenshot 📷</span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshot}
                        disabled={ocrRunning}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {ocrText && (
                    <div className="mt-5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#64748b]">
                        Extracted Raw Text Output
                      </label>
                      <textarea
                        value={ocrText}
                        onChange={(e) => setOcrText(e.target.value)}
                        rows={4}
                        className="mt-1.5 w-full rounded-xl border border-[#1e1e3a] bg-[#080812] p-4 font-mono text-xs text-[#94a3b8] outline-none focus:border-[#f59e0b]"
                      />
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Player Stats Editor Table */}
            <section className="relative overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-6 backdrop-blur-xl sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#1e1e3a] pb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#10b981]">
                    ROSTER STATS
                  </p>
                  <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-[#f1f5f9]">
                    Player Performance Records ({stats.length})
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={addPlayer}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#10b981]/40 bg-[#10b981]/10 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-[#34d399] transition hover:bg-[#10b981]/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  + Add Player
                </button>
              </div>

              <div className="mt-6 overflow-x-auto rounded-xl border border-[#1e1e3a]">
                <table className="min-w-[980px] w-full text-left">
                  <thead>
                    <tr className="border-b border-[#1e1e3a] bg-[#080812] text-[10px] font-black uppercase tracking-widest text-[#64748b]">
                      <th className="px-4 py-3">Player Name</th>
                      <th className="px-4 py-3">Assigned Team</th>
                      <th className="px-3 py-3 text-center">K</th>
                      <th className="px-3 py-3 text-center">D</th>
                      <th className="px-3 py-3 text-center">A</th>
                      <th className="px-3 py-3 text-center">ACS</th>
                      <th className="px-3 py-3 text-center">ADR</th>
                      <th className="px-3 py-3 text-center">KAST%</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e1e3a] text-sm">
                    {stats.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-10 text-center text-xs text-[#64748b]">
                          No player stats registered. Click "+ Add Player" or upload a scoreboard screenshot.
                        </td>
                      </tr>
                    ) : (
                      stats.map((stat, index) => (
                        <tr key={index} className="hover:bg-[#080812]/50">
                          <td className="px-4 py-3">
                            <input
                              value={stat.playerName}
                              onChange={(e) => updateStat(index, "playerName", e.target.value)}
                              placeholder="Player IGN"
                              className="w-36 rounded-lg border border-[#1e1e3a] bg-[#080812] px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#06b6d4]"
                            />
                          </td>

                          <td className="px-4 py-3">
                            <select
                              value={stat.teamId}
                              onChange={(e) => updateStat(index, "teamId", e.target.value)}
                              className="w-40 rounded-lg border border-[#1e1e3a] bg-[#080812] px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#7c3aed]"
                            >
                              <option value="" className="bg-[#0c0c18]">Select team</option>
                              {teams.map((t) => (
                                <option key={t.id} value={t.id} className="bg-[#0c0c18]">
                                  {t.name} [{t.tag}]
                                </option>
                              ))}
                            </select>
                          </td>

                          {(["kills", "deaths", "assists", "acs", "adr", "kast"] as const).map(
                            (field) => (
                              <td key={field} className="px-3 py-3 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  step={field === "adr" || field === "kast" ? "0.1" : "1"}
                                  value={String(stat[field])}
                                  onChange={(e) => updateStat(index, field, e.target.value)}
                                  className="w-16 rounded-lg border border-[#1e1e3a] bg-[#080812] px-2 py-2 text-center text-xs font-bold text-white outline-none focus:border-[#06b6d4]"
                                />
                              </td>
                            ),
                          )}

                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => removePlayer(index)}
                              className="rounded-lg border border-[#ff2d55]/30 bg-[#ff2d55]/10 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#ff4d6a] transition hover:bg-[#ff2d55]/20"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Final Save Card */}
            <div className="flex flex-col gap-4 rounded-2xl border border-[#ff2d55]/30 bg-[#0c0c18]/85 p-6 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ff4d6a]">
                  PUBLISH OFFICIAL RESULT
                </p>
                <h3 className="text-lg font-black uppercase text-white">
                  Save & Conclude Match
                </h3>
                <p className="text-xs text-[#64748b]">
                  Commits final score, sets match to Completed, and triggers bracket progression.
                </p>
              </div>

              <button
                type="button"
                onClick={saveResult}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#ff2d55]/50 bg-gradient-to-r from-[#ff2d55] to-[#7c3aed] px-8 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-[0_0_25px_rgba(255,45,85,0.3)] transition hover:opacity-95 hover:shadow-[0_0_35px_rgba(255,45,85,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Saving Result...</span>
                  </>
                ) : (
                  <span>Commit Official Result ✓</span>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
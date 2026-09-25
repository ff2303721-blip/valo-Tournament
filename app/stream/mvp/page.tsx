"use client";

import { useEffect, useMemo, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Match, PlayerStat, Team } from "@/lib/types";
import { formatStartingSide } from "@/lib/types";
import { getPlayerCardInfo, getPlayerCardUrl } from "@/lib/player-cards";

type BackgroundMode = "cinematic" | "transparent" | "greenscreen";

function StreamMvpContent() {
  const searchParams = useSearchParams();
  const initialMatchId = searchParams.get("matchId") || "";
  const obsParam = searchParams.get("obs") === "1" || searchParams.get("clean") === "1";
  const bgParam = (searchParams.get("bg") as BackgroundMode) || (obsParam ? "cinematic" : "cinematic");

  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>(initialMatchId);
  const [isObsMode, setIsObsMode] = useState<boolean>(obsParam);
  const [bgMode, setBgMode] = useState<BackgroundMode>(bgParam);
  const [cardFocusMode, setCardFocusMode] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  // Sync initial query param if changed
  useEffect(() => {
    if (initialMatchId) {
      setSelectedMatchId(initialMatchId);
    }
  }, [initialMatchId]);

  const loadData = useCallback(async () => {
    try {
      const [matchRes, teamRes] = await Promise.all([
        fetch("/api/matches"),
        fetch("/api/teams?lite=1"),
      ]);

      if (matchRes.ok) {
        const mData = await matchRes.json();
        setMatches(Array.isArray(mData) ? mData : mData?.matches ?? []);
      }

      if (teamRes.ok) {
        const tData = await teamRes.json();
        setTeams(Array.isArray(tData) ? tData : tData?.teams ?? []);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.warn("Stream MVP polling error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch matches & teams with polling (every 30s for live casters)
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [loadData]);

  // Keyboard shortcuts: H (hide toolbar), O (OBS mode), B (toggle background), C (card focus), R (refresh)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "h" || e.key.toLowerCase() === "o") {
        setIsObsMode((prev) => !prev);
      } else if (e.key.toLowerCase() === "b") {
        setBgMode((prev) =>
          prev === "cinematic"
            ? "transparent"
            : prev === "transparent"
            ? "greenscreen"
            : "cinematic",
        );
      } else if (e.key.toLowerCase() === "c") {
        setCardFocusMode((prev) => !prev);
      } else if (e.key.toLowerCase() === "r") {
        loadData();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loadData]);

  // Active match resolution:
  // 1. Explicitly selected match
  // 2. Or the latest completed match that has an MVP
  // 3. Or the latest live / completed match
  const activeMatch = useMemo(() => {
    if (selectedMatchId) {
      const found = matches.find(
        (m) =>
          m.id === selectedMatchId ||
          String(m.matchNumber) === selectedMatchId ||
          `M${m.matchNumber}` === selectedMatchId,
      );
      if (found) return found;
    }

    // Auto find match with MVP
    const withMvp = [...matches]
      .filter((m) => m.mvpPlayerId)
      .sort((a, b) => b.matchNumber - a.matchNumber);
    if (withMvp.length > 0) return withMvp[0];

    // Fallback to latest completed or live match
    const liveOrDone = [...matches]
      .filter((m) => m.status === "Completed" || m.status === "Live")
      .sort((a, b) => b.matchNumber - a.matchNumber);
    if (liveOrDone.length > 0) return liveOrDone[0];

    return matches[0] || null;
  }, [matches, selectedMatchId]);

  // Teams lookup
  const team1 = useMemo(
    () => (activeMatch ? teams.find((t) => t.id === activeMatch.team1Id) : null),
    [teams, activeMatch],
  );
  const team2 = useMemo(
    () => (activeMatch ? teams.find((t) => t.id === activeMatch.team2Id) : null),
    [teams, activeMatch],
  );

  // MVP Player Stat Resolution
  const mvpDetails = useMemo(() => {
    if (!activeMatch) return null;

    const stats = activeMatch.playerStats ?? [];
    let mvpStat: PlayerStat | null = null;

    // 1. Check by explicit mvpPlayerId
    if (activeMatch.mvpPlayerId) {
      mvpStat =
        stats.find(
          (s) =>
            s.playerId === activeMatch.mvpPlayerId ||
            s.playerName.toLowerCase() === activeMatch.mvpPlayerId?.toLowerCase(),
        ) ?? null;
    }

    // 2. If not found in playerStats, search team roster players
    let resolvedPlayerName = mvpStat?.playerName || "";
    let resolvedTeamId = mvpStat?.teamId || "";

    if (!mvpStat && activeMatch.mvpPlayerId) {
      for (const team of teams) {
        const found = team.players?.find(
          (p) =>
            p.id === activeMatch.mvpPlayerId ||
            p.name.toLowerCase() === activeMatch.mvpPlayerId?.toLowerCase(),
        );
        if (found) {
          resolvedPlayerName = found.name;
          resolvedTeamId = team.id;
          break;
        }
      }
    }

    // 3. Fallback to player with highest ACS in the match
    if (!mvpStat && stats.length > 0) {
      const sortedByAcs = [...stats].sort(
        (a, b) => Number(b.acs || 0) - Number(a.acs || 0),
      );
      mvpStat = sortedByAcs[0];
      resolvedPlayerName = mvpStat.playerName;
      resolvedTeamId = mvpStat.teamId;
    }

    if (!mvpStat && !resolvedPlayerName) {
      return null;
    }

    // Parse IGN & Tag (e.g. "TenZ#123" -> ign: "TenZ", tag: "#123")
    const fullName = resolvedPlayerName || mvpStat?.playerName || "Player";
    const parts = fullName.split("#");
    const ign = parts[0] || fullName;
    const tag = parts[1] ? `#${parts[1]}` : "";

    const team = teams.find((t) => t.id === resolvedTeamId) || null;

    // Stats calculations
    const kills = Number(mvpStat?.kills ?? 0);
    const deaths = Number(mvpStat?.deaths ?? 0);
    const assists = Number(mvpStat?.assists ?? 0);
    const acs = Number(mvpStat?.acs ?? 0);
    const adr = Number(mvpStat?.adr ?? 0);
    const kast = Number(mvpStat?.kast ?? 0);
    const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);

    // Resolve official Valorant player card
    const cardInfo = getPlayerCardInfo(resolvedPlayerName || activeMatch.mvpPlayerId || ign);
    const cardUrl = cardInfo?.url || null;

    return {
      ign,
      tag,
      team,
      kills,
      deaths,
      assists,
      acs,
      adr,
      kast,
      kd,
      isFallback: !activeMatch.mvpPlayerId,
      cardInfo,
      cardUrl,
    };
  }, [activeMatch, teams]);

  function copyObsUrl() {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    const url = `${origin}/stream/mvp?matchId=${encodeURIComponent(
      activeMatch?.id || "",
    )}&obs=1`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyFeedback("OBS URL Copied to Clipboard!");
      setTimeout(() => setCopyFeedback(""), 3000);
    });
  }

  // Background style
  const bgClass =
    bgMode === "transparent"
      ? "bg-transparent"
      : bgMode === "greenscreen"
      ? "bg-[#00ff00]"
      : "bg-[#030308]";

  return (
    <div
      className={`relative min-h-screen w-full select-none overflow-hidden ${bgClass} text-[#f1f5f9]`}
      style={{
        width: "100vw",
        height: "100vh",
      }}
    >
      {/* ── Caster / Streamer Control Bar (Hover / Toggle) ──────────────────── */}
      {!isObsMode && (
        <header className="absolute left-0 right-0 top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-[#1e1e3a] bg-[#0c0c18]/95 px-6 py-2.5 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-4">
            <Link
              href="/matches"
              className="text-xs font-black uppercase text-[#94a3b8] transition hover:text-white"
            >
              ← Match Center
            </Link>

            <span className="h-4 w-px bg-[#1e1e3a]" />

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#64748b]">
                Select Match:
              </span>
              <select
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="rounded-lg border border-[#1e1e3a] bg-[#080812] px-3 py-1 text-xs font-bold text-white outline-none focus:border-[#f59e0b]"
              >
                <option value="">Auto (Latest Active)</option>
                {matches.map((m) => (
                  <option key={m.id} value={m.id}>
                    M{String(m.matchNumber).padStart(2, "0")}:{" "}
                    {teams.find((t) => t.id === m.team1Id)?.tag || "T1"} vs{" "}
                    {teams.find((t) => t.id === m.team2Id)?.tag || "T2"}{" "}
                    {m.mvpPlayerId ? "★ (MVP Ready)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Sync Indicator */}
            <button
              type="button"
              onClick={() => loadData()}
              title="Click to refresh immediately (or press R)"
              className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              <span>LIVE SYNC (30s)</span>
            </button>

            {/* Background switcher */}
            <button
              type="button"
              onClick={() =>
                setBgMode((prev) =>
                  prev === "cinematic"
                    ? "transparent"
                    : prev === "transparent"
                    ? "greenscreen"
                    : "cinematic",
                )
              }
              className="rounded-lg border border-[#1e1e3a] bg-[#080812] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#94a3b8] transition hover:border-[#7c3aed] hover:text-white"
            >
              BG: {bgMode.toUpperCase()}
            </button>

            {/* Player Card Focus Mode */}
            <button
              type="button"
              onClick={() => setCardFocusMode((prev) => !prev)}
              title="Toggle Card Spotlight View (Press C)"
              className={`rounded-lg border px-3 py-1 text-[10px] font-black uppercase tracking-wider transition ${
                cardFocusMode
                  ? "border-amber-400 bg-amber-400/20 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  : "border-[#1e1e3a] bg-[#080812] text-[#94a3b8] hover:border-amber-400/50 hover:text-white"
              }`}
            >
              🎴 CARD: {cardFocusMode ? "SPOTLIGHT" : "SPLIT"}
            </button>

            {/* Copy OBS Link */}
            <button
              type="button"
              onClick={copyObsUrl}
              className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)] transition hover:bg-cyan-500/20"
            >
              {copyFeedback || "📋 COPY OBS URL"}
            </button>

            {/* Go OBS Clean Screen */}
            <button
              type="button"
              onClick={() => setIsObsMode(true)}
              title="Hide controls for OBS (Press H or O to restore)"
              className="rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300 transition hover:bg-amber-500/25"
            >
              📺 HIDE CONTROLS (OBS)
            </button>
          </div>
        </header>
      )}

      {/* Floating Restore Button when in OBS Mode (shows on hover top right) */}
      {isObsMode && (
        <button
          type="button"
          onClick={() => setIsObsMode(false)}
          title="Press O or click to restore controls"
          className="absolute right-4 top-4 z-50 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white/50 opacity-0 backdrop-blur-md transition-opacity hover:opacity-100"
        >
          ⚙ CONTROLS (ESC/O)
        </button>
      )}

      {/* ── Cinematic Arena FX (Only in Cinematic BG mode) ──────────────────── */}
      {bgMode === "cinematic" && (
        <div className="pointer-events-none absolute inset-0">
          {/* Subtle Map Backdrop */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at center, transparent 30%, #030308 90%), url('https://images5.alphacoders.com/120/thumb-1920-1202339.png')",
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}
          />

          {/* Ambient Volumetric Orbs */}
          <div className="absolute -left-48 top-1/4 h-[650px] w-[650px] rounded-full bg-[#ff2d55]/18 blur-[180px]" />
          <div className="absolute -right-48 top-1/4 h-[700px] w-[700px] rounded-full bg-[#7c3aed]/22 blur-[190px]" />
          <div className="absolute bottom-0 left-1/3 h-[400px] w-[600px] rounded-full bg-[#f59e0b]/10 blur-[160px]" />

          {/* Tactical Cyber Grid Lines */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                "linear-gradient(rgba(124, 58, 237, 0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 45, 85, 0.25) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />

          {/* Diagonal Laser Slices */}
          <div
            className="absolute left-[-20%] top-[-20%] h-[150%] w-1 opacity-40 shadow-[0_0_25px_#ff2d55]"
            style={{
              background:
                "linear-gradient(180deg, transparent, #ff2d55 50%, transparent)",
              transform: "rotate(32deg)",
            }}
          />
          <div
            className="absolute right-[-20%] top-[-20%] h-[150%] w-1 opacity-40 shadow-[0_0_25px_#7c3aed]"
            style={{
              background:
                "linear-gradient(180deg, transparent, #7c3aed 50%, transparent)",
              transform: "rotate(-32deg)",
            }}
          />
        </div>
      )}

      {/* ── Main Full-Screen Broadcast Stage (1920x1080 Centerpiece) ────────── */}
      <main className="relative z-10 flex h-full min-h-screen w-full flex-col items-center justify-center p-6 sm:p-12">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
            <p className="text-xs font-black uppercase tracking-widest text-[#94a3b8]">
              Loading Official Broadcast Telemetry...
            </p>
          </div>
        ) : !activeMatch ? (
          <div className="rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/90 p-12 text-center backdrop-blur-2xl">
            <p className="text-xs font-black uppercase tracking-widest text-[#ff4d6a]">
              No Matches Available
            </p>
            <p className="mt-2 text-sm text-[#64748b]">
              Please create matches in the Match Center to activate stream overlays.
            </p>
          </div>
        ) : (
          <div className="flex w-full max-w-5xl flex-col items-center animate-in fade-in zoom-in-95 duration-500">
            {/* Top Match Clash Strip */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/80 px-6 py-3 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.6)] w-full">
              {/* Left: Tournament Identity */}
              <div className="flex items-center gap-3">
                <span className="flex h-7 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 text-xs font-black text-amber-300">
                  M{String(activeMatch.matchNumber).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ff2d55]">
                    XMD FAMILY VALORANT TOURNAMENT
                  </p>
                  <p className="text-xs font-black uppercase tracking-wider text-white">
                    {activeMatch.stage} // MAP: {activeMatch.map || "TBD"}
                  </p>
                </div>
              </div>

              {/* Right: Clash Score Pill */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-black uppercase ${
                      activeMatch.winnerId === activeMatch.team1Id
                        ? "text-[#34d399]"
                        : "text-[#f1f5f9]"
                    }`}
                  >
                    {team1?.name ?? "T1"}
                  </span>
                  <span className="rounded bg-[#1e1e3a] px-1.5 py-0.5 text-[9px] font-bold text-[#94a3b8]">
                    [{team1?.tag ?? "T1"}]
                  </span>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#080812] px-3.5 py-1 text-base font-black tracking-tight text-white">
                  <span
                    className={
                      activeMatch.winnerId === activeMatch.team1Id
                        ? "text-[#34d399]"
                        : "text-[#94a3b8]"
                    }
                  >
                    {activeMatch.team1Score}
                  </span>
                  <span className="text-xs text-[#475569]">:</span>
                  <span
                    className={
                      activeMatch.winnerId === activeMatch.team2Id
                        ? "text-[#34d399]"
                        : "text-[#94a3b8]"
                    }
                  >
                    {activeMatch.team2Score}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded bg-[#1e1e3a] px-1.5 py-0.5 text-[9px] font-bold text-[#94a3b8]">
                    [{team2?.tag ?? "T2"}]
                  </span>
                  <span
                    className={`text-sm font-black uppercase ${
                      activeMatch.winnerId === activeMatch.team2Id
                        ? "text-[#34d399]"
                        : "text-[#f1f5f9]"
                    }`}
                  >
                    {team2?.name ?? "T2"}
                  </span>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                MAIN MVP BROADCAST CARD
            ══════════════════════════════════════════════════════════════════ */}
            <div className="relative w-full overflow-hidden rounded-3xl border-2 border-amber-500/40 bg-gradient-to-b from-[#0c0c18]/95 via-[#080812]/95 to-[#030308]/95 p-6 sm:p-10 backdrop-blur-2xl shadow-[0_0_80px_rgba(245,158,11,0.2),0_25px_60px_rgba(0,0,0,0.9)]">
              {/* Corner Tactical Brackets */}
              <div className="pointer-events-none absolute left-4 top-4 h-6 w-6 border-l-2 border-t-2 border-amber-400" />
              <div className="pointer-events-none absolute right-4 top-4 h-6 w-6 border-r-2 border-t-2 border-amber-400" />
              <div className="pointer-events-none absolute bottom-4 left-4 h-6 w-6 border-b-2 border-l-2 border-amber-400" />
              <div className="pointer-events-none absolute bottom-4 right-4 h-6 w-6 border-b-2 border-r-2 border-amber-400" />

              {/* Glowing Top Trophy Crest */}
              <div className="flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-2.5 rounded-full border border-amber-400/60 bg-gradient-to-r from-amber-500/25 via-amber-400/35 to-amber-500/25 px-6 py-1.5 text-xs sm:text-sm font-black uppercase tracking-[0.3em] text-amber-300 shadow-[0_0_35px_rgba(245,158,11,0.5)]">
                  <span className="text-base">★</span>
                  <span>OFFICIAL MATCH MVP</span>
                  <span className="text-base">★</span>
                </div>

                <p className="mt-2 text-[11px] font-black uppercase tracking-[0.4em] text-[#64748b]">
                  PERFORMANCE ACCOLADE // MOST VALUABLE PLAYER
                </p>
              </div>

              {/* Center Content: Two Columns (Player Card + Telemetry Stats) */}
              <div className="my-6 grid items-center gap-8 lg:grid-cols-12 border-y border-[#1e1e3a]/80 py-6">
                {/* ── Left Column: Official Valorant Player Card (5 cols) ── */}
                <div className="flex flex-col items-center justify-center lg:col-span-5">
                  <div className="group relative w-full max-w-[280px] sm:max-w-[320px] transition duration-500 hover:scale-[1.02]">
                    {/* Ambient Glow behind card */}
                    <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-amber-500/40 via-purple-500/30 to-cyan-500/40 opacity-75 blur-xl group-hover:opacity-100 transition duration-500" />

                    <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400/70 bg-[#080812] shadow-[0_0_50px_rgba(245,158,11,0.35)]">
                      {mvpDetails?.cardUrl ? (
                        <div className="relative aspect-[1024/1536] w-full">
                          <Image
                            src={mvpDetails.cardUrl}
                            alt={`${mvpDetails.ign} Official Player Card`}
                            fill
                            sizes="(max-width: 768px) 320px, 340px"
                            priority
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex aspect-[1024/1536] w-full flex-col items-center justify-center bg-gradient-to-b from-[#131326] to-[#080812] p-6 text-center">
                          {mvpDetails?.team?.logo && (
                            <Image
                              src={mvpDetails.team.logo}
                              alt={mvpDetails.team.name}
                              width={96}
                              height={96}
                              unoptimized
                              className="mb-4 object-contain opacity-80"
                            />
                          )}
                          <p className="text-xl font-black uppercase text-amber-400">
                            {mvpDetails?.ign || "MVP Player"}
                          </p>
                          <p className="mt-1 text-xs text-[#64748b]">
                            {mvpDetails?.team?.name}
                          </p>
                        </div>
                      )}

                      {/* Card Overlay Header Bar */}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-8">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-amber-300">
                          <span>{mvpDetails?.cardInfo?.cardName || mvpDetails?.ign}</span>
                          <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[9px] text-amber-300 border border-amber-400/40">
                            OFFICIAL CARD
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Right Column: Player Identity & 4-Stat Podium (7 cols) ── */}
                <div className="flex flex-col justify-between gap-6 lg:col-span-7">
                  {/* Identity Row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="rounded-lg border border-amber-500/50 bg-amber-500/15 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-amber-300">
                          [{mvpDetails?.team?.tag || "TEAM"}]
                        </span>
                        <span className="text-xs font-black uppercase tracking-wider text-[#94a3b8]">
                          {mvpDetails?.team?.name || "Official Squad"}
                        </span>
                        {mvpDetails?.isFallback && (
                          <span className="rounded bg-cyan-500/15 px-2 py-0.5 text-[9px] font-bold text-cyan-300 border border-cyan-500/30">
                            TOP ACS PERFORMER
                          </span>
                        )}
                      </div>

                      {/* Massive Player IGN */}
                      <h1 className="mt-2 text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white drop-shadow-[0_0_35px_rgba(255,255,255,0.35)]">
                        {mvpDetails?.ign || "MVP Player"}
                        {mvpDetails?.tag && (
                          <span className="ml-2 text-2xl sm:text-3xl font-bold text-[#64748b]">
                            {mvpDetails.tag}
                          </span>
                        )}
                      </h1>

                      <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#22d3ee]">
                        MATCH WINNER // SQUAD IMPACT RATING: S+
                      </p>
                    </div>

                    {/* Right: Map & Match Stamp */}
                    <div className="shrink-0 text-left sm:text-right">
                      <div className="rounded-2xl border border-white/10 bg-[#080812]/80 p-3.5 px-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#64748b]">
                          MAP / FORMAT
                        </p>
                        <p className="text-lg font-black uppercase text-amber-300">
                          {activeMatch.map || "TBD"}
                        </p>
                        <p className="text-[10px] font-bold text-[#94a3b8]">
                          BO{activeMatch.bestOf} MATCHPLAY
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 4-Stat Podium */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
                    {/* 1. ACS */}
                    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-cyan-500/15 to-[#080812] p-4 text-center shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#22d3ee]">
                        COMBAT SCORE
                      </p>
                      <p className="mt-1 text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]">
                        {mvpDetails?.acs || "—"}
                      </p>
                      <span className="mt-0.5 inline-block text-[9px] font-bold text-[#94a3b8]">
                        ACS RATING
                      </span>
                    </div>

                    {/* 2. K / D / A */}
                    <div className="relative overflow-hidden rounded-2xl border border-[#1e1e3a] bg-gradient-to-b from-[#131326] to-[#080812] p-4 text-center shadow-[0_0_25px_rgba(0,0,0,0.5)]">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#94a3b8]">
                        K / D / A
                      </p>
                      <p className="mt-1 text-3xl sm:text-4xl font-black tracking-tight text-white">
                        {mvpDetails
                          ? `${mvpDetails.kills}/${mvpDetails.deaths}/${mvpDetails.assists}`
                          : "—"}
                      </p>
                      <span className="mt-0.5 inline-block text-[9px] font-bold text-[#64748b]">
                        ELIMINATIONS
                      </span>
                    </div>

                    {/* 3. K/D RATIO */}
                    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-emerald-500/15 to-[#080812] p-4 text-center shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#34d399]">
                        K/D RATIO
                      </p>
                      <p className="mt-1 text-3xl sm:text-4xl font-black tracking-tight text-emerald-300 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                        {mvpDetails?.kd || "—"}
                      </p>
                      <span className="mt-0.5 inline-block text-[9px] font-bold text-[#94a3b8]">
                        KILL RATIO
                      </span>
                    </div>

                    {/* 4. ADR / KAST */}
                    <div className="relative overflow-hidden rounded-2xl border border-purple-500/40 bg-gradient-to-b from-purple-500/15 to-[#080812] p-4 text-center shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a78bfa]">
                        DAMAGE / RD
                      </p>
                      <p className="mt-1 text-3xl sm:text-4xl font-black tracking-tight text-purple-300 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                        {mvpDetails?.adr || "—"}
                      </p>
                      <span className="mt-0.5 inline-block text-[9px] font-bold text-[#94a3b8]">
                        {mvpDetails?.kast ? `${mvpDetails.kast}% KAST` : "ADR"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Streamer Footer */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[#1e1e3a]/80 pt-3 text-[10px] font-mono text-[#64748b]">
                <span>
                  BROADCAST ID: {activeMatch.id} // VCT CHAMPIONSHIP SPEC
                </span>
                <span className="text-amber-400 font-bold">
                  ONE GAME ONE SQUAD XMD FAMILY
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function StreamMvpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#030308] text-white">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      }
    >
      <StreamMvpContent />
    </Suspense>
  );
}

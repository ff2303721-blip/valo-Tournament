"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getAllGames, getGameDefinition } from "@/lib/games/registry";
import { TOURNAMENT_STATUS_LIST } from "@/lib/tournament-status";
import type { TournamentStatusId } from "@/lib/types";

type Settings = {
  tournamentName: string;
  tagline: string;
  organizerName: string;
  prizePool: string;
  startDate: string;
  endDate: string;
  tournamentStatus: TournamentStatusId;
  announcement: string;
  logoUrl: string;
  bannerUrl: string;
  liveStreamUrl: string;
  gameId: string;
  gameCustomName: string;
  gameCustomMaps: string[];
};

type DateTimeParts = {
  date: string;
  hour: string;
  minute: string;
  meridiem: "AM" | "PM";
};

const EMPTY_DATE_TIME: DateTimeParts = {
  date: "",
  hour: "12",
  minute: "00",
  meridiem: "AM",
};

const HOURS = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);

const MINUTES = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0"),
);

function toDateTimeParts(value: string | null | undefined): DateTimeParts {
  if (!value) return EMPTY_DATE_TIME;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return EMPTY_DATE_TIME;
  }

  const hours = date.getHours();

  return {
    date: [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-"),
    hour: String(hours % 12 || 12).padStart(2, "0"),
    minute: String(date.getMinutes()).padStart(2, "0"),
    meridiem: hours >= 12 ? "PM" : "AM",
  };
}

function partsToIso(parts: DateTimeParts) {
  if (!parts.date) return "";

  const [year, month, day] = parts.date.split("-").map(Number);

  let hour = Number(parts.hour);

  if (parts.meridiem === "AM") {
    if (hour === 12) hour = 0;
  } else if (hour !== 12) {
    hour += 12;
  }

  const date = new Date(
    year,
    month - 1,
    day,
    hour,
    Number(parts.minute),
  );

  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function formatDatePreview(parts: DateTimeParts) {
  const iso = partsToIso(parts);

  if (!iso) return "Not set";

  return new Date(iso).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const EMPTY_SETTINGS: Settings = {
  tournamentName: "",
  tagline: "",
  organizerName: "",
  prizePool: "",
  startDate: "",
  endDate: "",
  tournamentStatus: "upcoming",
  announcement: "",
  logoUrl: "",
  bannerUrl: "",
  liveStreamUrl: "",
  gameId: "valorant",
  gameCustomName: "",
  gameCustomMaps: [],
};

function toDateInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

export default function TournamentSettingsPage() {
  const [settings, setSettings] = useState<Settings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [startDateTime, setStartDateTime] =
    useState<DateTimeParts>(EMPTY_DATE_TIME);

  const [endDateTime, setEndDateTime] =
    useState<DateTimeParts>(EMPTY_DATE_TIME);

  const [henrikApiKey, setHenrikApiKey] = useState("");
  const [valorantRegion, setValorantRegion] = useState("ap");
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("valorant_henrik_key") || "";
      const savedRegion = localStorage.getItem("valorant_region") || "ap";
      setHenrikApiKey(savedKey);
      setValorantRegion(savedRegion);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Unable to load settings.");
        }

        if (!mounted) {
          setLoading(false);
          return;
        }

        setSettings({
          tournamentName: data.tournamentName ?? "",
          tagline: data.tagline ?? "",
          organizerName: data.organizerName ?? "",
          prizePool: data.prizePool ?? "",
          startDate: toDateInput(data.startDate),
          endDate: toDateInput(data.endDate),
          tournamentStatus: data.tournamentStatus ?? "upcoming",
          announcement: data.announcement ?? "",
          logoUrl: data.logoUrl ?? "",
          bannerUrl: data.bannerUrl ?? "",
          liveStreamUrl: data.liveStreamUrl ?? "",
          gameId: data.gameId || "valorant",
          gameCustomName: data.gameCustomName || "",
          gameCustomMaps: data.gameCustomMaps || [],
        });

        setStartDateTime(toDateTimeParts(data.startDate));
        setEndDateTime(toDateTimeParts(data.endDate));
      } catch (loadError) {
        if (!mounted) {
          setLoading(false);
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load settings.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          startDate: partsToIso(startDateTime),
          endDate: partsToIso(endDateTime),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to save settings.");
      }

      setSettings({
        tournamentName: data.tournamentName ?? "",
        tagline: data.tagline ?? "",
        organizerName: data.organizerName ?? "",
        prizePool: data.prizePool ?? "",
        startDate: toDateInput(data.startDate),
        endDate: toDateInput(data.endDate),
        tournamentStatus: data.tournamentStatus ?? "upcoming",
        announcement: data.announcement ?? "",
        logoUrl: data.logoUrl ?? "",
        bannerUrl: data.bannerUrl ?? "",
        liveStreamUrl: data.liveStreamUrl ?? "",
        gameId: data.gameId || "valorant",
        gameCustomName: data.gameCustomName || "",
        gameCustomMaps: data.gameCustomMaps || [],
      });

      setStartDateTime(toDateTimeParts(data.startDate));
      setEndDateTime(toDateTimeParts(data.endDate));

      if (typeof window !== "undefined") {
        localStorage.setItem("valorant_henrik_key", henrikApiKey.trim());
        localStorage.setItem("valorant_region", valorantRegion.trim().toLowerCase());
      }

      setMessage("Tournament settings and Riot API configurations saved successfully.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-2.5 w-full rounded-xl border border-[#1e1e3a] bg-[#080812]/90 px-4 py-3.5 text-sm font-semibold text-[#f1f5f9] outline-none transition placeholder:text-[#475569] focus:border-[#94a3b8] focus:shadow-[0_0_15px_rgba(148,163,184,0.2)] disabled:opacity-50";

  return (
    <div className="relative min-h-screen text-[#f1f5f9] pb-20">
      {/* ── Ambient Neon Glow Orbs ────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#94a3b8]/12 blur-[180px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-[#ff2d55]/10 blur-[160px]" />
        <div className="absolute bottom-10 left-1/3 h-[500px] w-[500px] rounded-full bg-[#94a3b8]/8 blur-[160px]" />
      </div>

      {/* ── Modern Command Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#030308]/85 px-4 py-3 backdrop-blur-2xl sm:px-8 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Link
              href="/admin"
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] text-sm font-black text-amber-400 shadow-inner transition hover:scale-105 hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-300"
              title="Return to Admin Hub"
            >
              <span className="drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">←</span>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight sm:text-lg text-white">
                  TOURNAMENT{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-[#94a3b8]">
                    // SETTINGS
                  </span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-mono font-bold tracking-wider text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  CONFIGURATION
                </span>
              </div>
              <p className="text-[12px] text-slate-400">
                Identity, Multi-Game Discipline & Schedule Customization
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[13px] font-bold tracking-wider text-slate-300 backdrop-blur-xl transition hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-300 hover:scale-[1.02]"
            >
              <span>← ADMIN HUB</span>
            </Link>

            <Link
              href="/matches"
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-gradient-to-r from-rose-600/25 to-rose-600/15 px-4 py-1.5 text-[13px] font-bold tracking-wider text-rose-300 backdrop-blur-xl transition hover:border-rose-400 hover:bg-rose-600/35 hover:text-white hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:scale-[1.02]"
            >
              <span>MATCH CENTRE</span>
              <span className="text-sm">↗</span>
            </Link>

            <Link
              href="/teams"
              className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-gradient-to-r from-purple-600/25 to-purple-600/15 px-4 py-1.5 text-[13px] font-bold tracking-wider text-purple-300 backdrop-blur-xl transition hover:border-purple-400 hover:bg-purple-600/35 hover:text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:scale-[1.02]"
            >
              <span>TEAMS & ROSTERS</span>
              <span className="text-sm">↗</span>
            </Link>

            <Link
              href="/tournament"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-1.5 text-[13px] font-bold tracking-wider text-cyan-300 backdrop-blur-xl transition hover:border-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(148,163,184,0.3)] hover:scale-[1.02]"
            >
              <span>PUBLIC SITE</span>
              <span className="text-sm">↗</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Form Container ───────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-8 sm:px-8">
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#ff2d55]/40 bg-[#ff2d55]/10 p-4 text-sm font-semibold text-[#ff4d6a] shadow-[0_0_20px_rgba(255,45,85,0.15)]">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ff2d55]/20 text-sm font-black">!</span>
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#10b981]/40 bg-[#10b981]/10 p-4 text-sm font-semibold text-[#34d399] shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#10b981]/20 text-sm font-black">✓</span>
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={saveSettings} className="space-y-6">
          {/* Section 0: Tournament Game & Discipline */}
          <section className="relative overflow-hidden rounded-2xl border border-[#94a3b8]/50 bg-[#0c0c18]/90 p-6 backdrop-blur-xl transition hover:border-[#94a3b8] hover:shadow-[0_0_40px_rgba(148,163,184,0.12)] sm:p-8">
            <div className="flex items-center justify-between border-b border-[#1e1e3a] pb-4">
              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#f1f5f9]">
                  TOURNAMENT DISCIPLINE
                </p>
                <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-white">
                  Active Esports Game
                </h2>
              </div>
              <span className="rounded-full border border-[#94a3b8]/40 bg-[#94a3b8]/15 px-3 py-1 text-[11px] font-black text-[#f1f5f9]">
                MULTI-GAME ENGINE
              </span>
            </div>

            <p className="mt-3 text-sm text-[#94a3b8]">
              Select the esports discipline for this tournament. Wallpapers, official map pools, scoring format, and leaderboard statistics adapt automatically.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {getAllGames().map((g) => {
                const isSelected = (settings.gameId || "valorant") === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => update("gameId", g.id)}
                    className={`relative flex flex-col items-start rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-[#94a3b8] bg-[#94a3b8]/15 shadow-[0_0_20px_rgba(148,163,184,0.25)]"
                        : "border-[#1e1e3a] bg-[#080812] hover:border-[#94a3b8]/50 hover:bg-[#0c0c18]"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#94a3b8] text-[11px] font-black text-white">
                        ✓
                      </span>
                    )}
                    <span className="text-2xl">{g.icon}</span>
                    <span className="mt-2 text-sm font-black uppercase tracking-tight text-white">
                      {g.name}
                    </span>
                    <span className="mt-0.5 text-[12px] font-semibold text-[#64748b]">
                      {g.scoringType.toUpperCase()} • {g.defaultTeamSize}v{g.defaultTeamSize}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Game Specs Preview */}
            {(() => {
              const activeGame = getGameDefinition(settings.gameId);
              return (
                <div className="mt-5 rounded-xl border border-[#1e1e3a] bg-[#080812]/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e1e3a] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{activeGame.icon}</span>
                      <div>
                        <span className="text-sm font-black uppercase text-white">{activeGame.name}</span>
                        <p className="text-[12px] text-[#64748b]">{activeGame.tagline}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#1e1e3a] px-2 py-0.5 text-[11px] font-bold uppercase text-[#94a3b8]">
                        Scoring: {activeGame.scoreLabel}
                      </span>
                      <span className="rounded bg-[#94a3b8]/20 px-2 py-0.5 text-[11px] font-bold uppercase text-[#f1f5f9]">
                        Team: {activeGame.defaultTeamSize}v{activeGame.defaultTeamSize}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="text-[12px] font-black uppercase tracking-wider text-[#64748b]">
                      Official Map Rotation ({activeGame.maps.length} Maps):
                    </span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {activeGame.maps.map((m) => (
                        <span
                          key={m.id}
                          className="rounded border border-[#1e1e3a] bg-[#0c0c18] px-2 py-0.5 text-[12px] font-bold text-[#f1f5f9]"
                        >
                          🗺️ {m.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {settings.gameId === "custom" && (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 border-t border-[#1e1e3a] pt-3">
                      <div>
                        <label className="text-[12px] font-black uppercase tracking-wider text-[#64748b]">
                          Custom Game Name
                        </label>
                        <input
                          type="text"
                          value={settings.gameCustomName || ""}
                          onChange={(e) => update("gameCustomName", e.target.value)}
                          placeholder="e.g. Apex Legends, Tekken 8, Halo"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="text-[12px] font-black uppercase tracking-wider text-[#64748b]">
                          Custom Maps (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={(settings.gameCustomMaps || []).join(", ")}
                          onChange={(e) =>
                            update(
                              "gameCustomMaps",
                              e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            )
                          }
                          placeholder="Map Alpha, Map Beta, Coliseum"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </section>

          {/* Section 1: Public Identity */}
          <section className="relative overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-6 backdrop-blur-xl transition hover:border-[#94a3b8]/40 hover:shadow-[0_0_35px_rgba(148,163,184,0.06)] sm:p-8">
            <div className="flex items-center justify-between border-b border-[#1e1e3a] pb-4">
              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#94a3b8]">
                  PUBLIC IDENTITY
                </p>
                <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-[#f1f5f9]">
                  Tournament Branding
                </h2>
              </div>
              <span className="rounded-full border border-[#94a3b8]/30 bg-[#94a3b8]/10 px-3 py-1 text-[11px] font-black text-[#f1f5f9]">
                IDENTITY
              </span>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="tournamentName" className="text-[12px] font-black uppercase tracking-[0.2em] text-[#64748b]">
                    Tournament Name *
                  </label>
                  <span className="text-[12px] font-bold text-[#475569]">
                    {settings.tournamentName.length}/100
                  </span>
                </div>
                <input
                  id="tournamentName"
                  type="text"
                  maxLength={100}
                  value={settings.tournamentName}
                  onChange={(e) => update("tournamentName", e.target.value)}
                  disabled={loading || saving}
                  placeholder="VALORANT TOURNAMENT"
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="tagline" className="text-[12px] font-black uppercase tracking-[0.2em] text-[#64748b]">
                    Tagline
                  </label>
                  <span className="text-[12px] font-bold text-[#475569]">
                    {settings.tagline.length}/160
                  </span>
                </div>
                <input
                  id="tagline"
                  type="text"
                  maxLength={160}
                  value={settings.tagline}
                  onChange={(e) => update("tagline", e.target.value)}
                  disabled={loading || saving}
                  placeholder="COMPETITIVE VALORANT"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="organizerName" className="text-[12px] font-black uppercase tracking-[0.2em] text-[#64748b]">
                  Organizer Name
                </label>
                <input
                  id="organizerName"
                  type="text"
                  maxLength={100}
                  value={settings.organizerName}
                  onChange={(e) => update("organizerName", e.target.value)}
                  disabled={loading || saving}
                  placeholder="e.g. Riot Games Community"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="prizePool" className="text-[12px] font-black uppercase tracking-[0.2em] text-[#64748b]">
                  Prize Pool
                </label>
                <input
                  id="prizePool"
                  type="text"
                  maxLength={100}
                  value={settings.prizePool}
                  onChange={(e) => update("prizePool", e.target.value)}
                  disabled={loading || saving}
                  placeholder="e.g. ₹10,000 or $5,000"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Section 2: Tournament Schedule */}
          <section className="relative overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-6 backdrop-blur-xl transition hover:border-[#94a3b8]/40 hover:shadow-[0_0_35px_rgba(148,163,184,0.06)] sm:p-8">
            <div className="flex items-center justify-between border-b border-[#1e1e3a] pb-4">
              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#f1f5f9]">
                  SCHEDULE & LIFECYCLE
                </p>
                <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-[#f1f5f9]">
                  Dates & Tournament Status
                </h2>
              </div>
              <span className="rounded-full border border-[#94a3b8]/30 bg-[#94a3b8]/10 px-3 py-1 text-[11px] font-black text-[#f1f5f9]">
                SCHEDULE
              </span>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {/* Start Date & Time */}
              <div className="rounded-xl border border-[#1e1e3a] bg-[#080812]/50 p-4">
                <label className="text-[12px] font-black uppercase tracking-[0.2em] text-[#64748b]">
                  Start Date & Time
                </label>

                <input
                  type="date"
                  value={startDateTime.date}
                  onChange={(e) =>
                    setStartDateTime((current) => ({
                      ...current,
                      date: e.target.value,
                    }))
                  }
                  disabled={loading || saving}
                  className={inputClass}
                />

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <select
                    value={startDateTime.hour}
                    onChange={(e) =>
                      setStartDateTime((current) => ({
                        ...current,
                        hour: e.target.value,
                      }))
                    }
                    disabled={loading || saving}
                    className={inputClass}
                  >
                    {HOURS.map((hour) => (
                      <option key={hour} value={hour} className="bg-[#0c0c18]">
                        {hour}
                      </option>
                    ))}
                  </select>

                  <select
                    value={startDateTime.minute}
                    onChange={(e) =>
                      setStartDateTime((current) => ({
                        ...current,
                        minute: e.target.value,
                      }))
                    }
                    disabled={loading || saving}
                    className={inputClass}
                  >
                    {MINUTES.map((minute) => (
                      <option key={minute} value={minute} className="bg-[#0c0c18]">
                        {minute}
                      </option>
                    ))}
                  </select>

                  <select
                    value={startDateTime.meridiem}
                    onChange={(e) =>
                      setStartDateTime((current) => ({
                        ...current,
                        meridiem: e.target.value as "AM" | "PM",
                      }))
                    }
                    disabled={loading || saving}
                    className={inputClass}
                  >
                    <option value="AM" className="bg-[#0c0c18]">AM</option>
                    <option value="PM" className="bg-[#0c0c18]">PM</option>
                  </select>
                </div>

                <p className="mt-2.5 flex items-center gap-1.5 text-[12px] font-bold text-[#64748b]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#94a3b8]" />
                  <span>Preview: {formatDatePreview(startDateTime)}</span>
                </p>
              </div>

              {/* End Date & Time */}
              <div className="rounded-xl border border-[#1e1e3a] bg-[#080812]/50 p-4">
                <label className="text-[12px] font-black uppercase tracking-[0.2em] text-[#64748b]">
                  End Date & Time
                </label>

                <input
                  type="date"
                  value={endDateTime.date}
                  onChange={(e) =>
                    setEndDateTime((current) => ({
                      ...current,
                      date: e.target.value,
                    }))
                  }
                  disabled={loading || saving}
                  className={inputClass}
                />

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <select
                    value={endDateTime.hour}
                    onChange={(e) =>
                      setEndDateTime((current) => ({
                        ...current,
                        hour: e.target.value,
                      }))
                    }
                    disabled={loading || saving}
                    className={inputClass}
                  >
                    {HOURS.map((hour) => (
                      <option key={hour} value={hour} className="bg-[#0c0c18]">
                        {hour}
                      </option>
                    ))}
                  </select>

                  <select
                    value={endDateTime.minute}
                    onChange={(e) =>
                      setEndDateTime((current) => ({
                        ...current,
                        minute: e.target.value,
                      }))
                    }
                    disabled={loading || saving}
                    className={inputClass}
                  >
                    {MINUTES.map((minute) => (
                      <option key={minute} value={minute} className="bg-[#0c0c18]">
                        {minute}
                      </option>
                    ))}
                  </select>

                  <select
                    value={endDateTime.meridiem}
                    onChange={(e) =>
                      setEndDateTime((current) => ({
                        ...current,
                        meridiem: e.target.value as "AM" | "PM",
                      }))
                    }
                    disabled={loading || saving}
                    className={inputClass}
                  >
                    <option value="AM" className="bg-[#0c0c18]">AM</option>
                    <option value="PM" className="bg-[#0c0c18]">PM</option>
                  </select>
                </div>

                <p className="mt-2.5 flex items-center gap-1.5 text-[12px] font-bold text-[#64748b]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#94a3b8]" />
                  <span>Preview: {formatDatePreview(endDateTime)}</span>
                </p>
              </div>

              {/* Tournament Status Dropdown */}
              <div className="sm:col-span-2">
                <label htmlFor="tournamentStatus" className="text-[12px] font-black uppercase tracking-[0.2em] text-[#64748b]">
                  Tournament Status Badge
                </label>
                <select
                  id="tournamentStatus"
                  value={settings.tournamentStatus}
                  onChange={(e) =>
                    update(
                      "tournamentStatus",
                      e.target.value as Settings["tournamentStatus"],
                    )
                  }
                  disabled={loading || saving}
                  className={inputClass}
                >
                  {TOURNAMENT_STATUS_LIST.map((status) => (
                    <option key={status.id} value={status.id} className="bg-[#0c0c18]">
                      {status.sublabel ? `${status.label} (${status.sublabel})` : status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Section 3: Public Announcement */}
          <section className="relative overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-6 backdrop-blur-xl transition hover:border-[#f59e0b]/40 hover:shadow-[0_0_35px_rgba(245,158,11,0.06)] sm:p-8">
            <div className="flex items-center justify-between border-b border-[#1e1e3a] pb-4">
              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#f59e0b]">
                  BROADCAST TICKER
                </p>
                <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-[#f1f5f9]">
                  Public Announcement
                </h2>
              </div>
              <span className="rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-3 py-1 text-[11px] font-black text-[#fbbf24]">
                BROADCAST
              </span>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <label htmlFor="announcement" className="text-[12px] font-black uppercase tracking-[0.2em] text-[#64748b]">
                  Banner Message (Displayed on public overview)
                </label>
                <span className="text-[12px] font-bold text-[#475569]">
                  {settings.announcement.length}/500
                </span>
              </div>
              <textarea
                id="announcement"
                maxLength={500}
                rows={4}
                value={settings.announcement}
                onChange={(e) => update("announcement", e.target.value)}
                disabled={loading || saving}
                placeholder="Enter an official announcement, server IP, rules reminder, or broadcast link..."
                className={inputClass + " resize-y leading-6"}
              />
            </div>
          </section>

          {/* Section 3b: Live Stream */}
          <section className="relative overflow-hidden rounded-2xl border border-[#ff2d55]/40 bg-[#0c0c18]/85 p-6 backdrop-blur-xl transition hover:border-[#ff2d55]/60 hover:shadow-[0_0_35px_rgba(255,45,85,0.1)] sm:p-8">
            <div className="flex items-center justify-between border-b border-[#1e1e3a] pb-4">
              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#ff4d6a]">
                  LIVE BROADCAST
                </p>
                <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-[#f1f5f9]">
                  Live Stream Link
                </h2>
              </div>
              <span className="rounded-full border border-[#ff2d55]/30 bg-[#ff2d55]/10 px-3 py-1 text-[11px] font-black text-[#ff4d6a]">
                YOUTUBE
              </span>
            </div>

            <div className="mt-6">
              <label htmlFor="liveStreamUrl" className="text-[12px] font-black uppercase tracking-[0.2em] text-[#64748b]">
                YouTube Live / Video Link
              </label>
              <input
                id="liveStreamUrl"
                type="url"
                value={settings.liveStreamUrl}
                onChange={(e) => update("liveStreamUrl", e.target.value)}
                disabled={loading || saving}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                className={inputClass}
              />
              <p className="mt-2.5 text-[12px] text-[#64748b]">
                Paste the YouTube link when a match goes live and the public overview page will
                automatically embed the stream under the hero. Leave empty to hide it.
              </p>
            </div>
          </section>

          {/* Section 4: Media URLs */}
          <section className="relative overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-6 backdrop-blur-xl transition hover:border-[#ff2d55]/40 hover:shadow-[0_0_35px_rgba(255,45,85,0.06)] sm:p-8">
            <div className="flex items-center justify-between border-b border-[#1e1e3a] pb-4">
              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#ff4d6a]">
                  ASSETS & MEDIA
                </p>
                <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-[#f1f5f9]">
                  Logo & Header Banner
                </h2>
              </div>
              <span className="rounded-full border border-[#ff2d55]/30 bg-[#ff2d55]/10 px-3 py-1 text-[11px] font-black text-[#ff4d6a]">
                MEDIA
              </span>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="logoUrl" className="text-[12px] font-black uppercase tracking-[0.2em] text-[#64748b]">
                  Tournament Logo URL
                </label>
                <input
                  id="logoUrl"
                  type="url"
                  value={settings.logoUrl}
                  onChange={(e) => update("logoUrl", e.target.value)}
                  disabled={loading || saving}
                  placeholder="https://images.unsplash.com/..."
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="bannerUrl" className="text-[12px] font-black uppercase tracking-[0.2em] text-[#64748b]">
                  Tournament Banner URL
                </label>
                <input
                  id="bannerUrl"
                  type="url"
                  value={settings.bannerUrl}
                  onChange={(e) => update("bannerUrl", e.target.value)}
                  disabled={loading || saving}
                  placeholder="https://images.unsplash.com/..."
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Section 5: Riot Games & HenrikDev API Automation (Valorant Only) */}
          {(settings.gameId || "valorant") === "valorant" && (
            <section className="relative overflow-hidden rounded-2xl border border-[#94a3b8]/40 bg-[#0c0c18]/85 p-6 backdrop-blur-xl transition hover:border-[#94a3b8]/60 hover:shadow-[0_0_35px_rgba(148,163,184,0.12)] sm:p-8">
              <div className="flex items-center justify-between border-b border-[#1e1e3a] pb-4">
                <div>
                  <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#94a3b8]">
                    RIOT API AUTOMATION
                  </p>
                  <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-[#f1f5f9]">
                    Direct Match Result Ingestion
                  </h2>
                </div>
                <span className="rounded-full border border-[#94a3b8]/30 bg-[#94a3b8]/10 px-3 py-1 text-[11px] font-black text-[#f1f5f9]">
                  HENRIKDEV API
                </span>
              </div>

              <p className="mt-4 text-sm text-[#94a3b8] leading-relaxed">
                Connect the free HenrikDev Valorant API to enable 1-click automatic match score and player stat extraction from Riot servers right as custom games conclude.
              </p>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="henrikApiKey" className="text-[12px] font-black uppercase tracking-[0.2em] text-[#64748b]">
                      HenrikDev API Key
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-[11px] font-bold text-[#94a3b8] hover:underline"
                    >
                      {showApiKey ? "Hide Key" : "Show Key"}
                    </button>
                  </div>
                  <input
                    id="henrikApiKey"
                    type={showApiKey ? "text" : "password"}
                    value={henrikApiKey}
                    onChange={(e) => setHenrikApiKey(e.target.value)}
                    disabled={loading || saving}
                    placeholder="HDEV-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className={inputClass}
                  />
                  <p className="mt-2 text-[12px] text-[#64748b]">
                    Get your free API key at{" "}
                    <a
                      href="https://api.henrikdev.xyz/dashboard/"
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-[#f1f5f9] underline hover:text-white"
                    >
                      api.henrikdev.xyz/dashboard ↗
                    </a>
                  </p>
                </div>

                <div>
                  <label htmlFor="valorantRegion" className="text-[12px] font-black uppercase tracking-[0.2em] text-[#64748b]">
                    Default Valorant Server Region
                  </label>
                  <select
                    id="valorantRegion"
                    value={valorantRegion}
                    onChange={(e) => setValorantRegion(e.target.value)}
                    disabled={loading || saving}
                    className={inputClass}
                  >
                    <option value="ap" className="bg-[#0c0c18]">AP — Asia-Pacific (Mumbai / Singapore / Tokyo) [Default]</option>
                    <option value="eu" className="bg-[#0c0c18]">EU — Europe (Frankfurt / London / Bahrain)</option>
                    <option value="na" className="bg-[#0c0c18]">NA — North America</option>
                    <option value="kr" className="bg-[#0c0c18]">KR — Korea</option>
                    <option value="latam" className="bg-[#0c0c18]">LATAM — Latin America</option>
                    <option value="br" className="bg-[#0c0c18]">BR — Brazil</option>
                  </select>
                  <p className="mt-2 text-[12px] text-[#64748b]">
                    India / Mumbai matches are located in the <strong className="text-white">AP</strong> cluster.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Action Bar */}
          <div className="flex flex-col gap-4 rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-6 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/admin"
              className="text-center text-sm font-black uppercase tracking-widest text-[#64748b] transition hover:text-[#f1f5f9]"
            >
              ← Cancel & Discard
            </Link>

            <button
              type="submit"
              disabled={loading || saving || !settings.tournamentName.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#94a3b8]/40 bg-gradient-to-r from-[#94a3b8] to-[#94a3b8] px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-[0_0_25px_rgba(148,163,184,0.3)] transition hover:opacity-95 hover:shadow-[0_0_35px_rgba(148,163,184,0.4)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Save Tournament Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

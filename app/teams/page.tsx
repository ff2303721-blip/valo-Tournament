"use client";

import Link from "next/link";
import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

type Player = {
  id: string;
  name: string;
  role?: string;
};

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

const EMPTY_PLAYER = (): Player => ({
  id: crypto.randomUUID(),
  name: "",
  role: "",
});

const EMPTY_TEAM = (): Team => ({
  id: "",
  name: "",
  tag: "",
  seed: 1,
  logo: "",
  wins: 0,
  losses: 0,
  captainRank: "",
  players: [
    EMPTY_PLAYER(),
    EMPTY_PLAYER(),
    EMPTY_PLAYER(),
    EMPTY_PLAYER(),
    EMPTY_PLAYER(),
    EMPTY_PLAYER(),
  ],
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeTeam(team: Team): Team {
  return {
    id: team.id,
    name: team.name,
    tag: team.tag,
    seed: Number(team.seed),
    logo: team.logo ?? "",
    wins: Number(team.wins ?? 0),
    losses: Number(team.losses ?? 0),
    captainRank: team.captainRank ?? "",
    players: Array.isArray(team.players)
      ? team.players.map((player) => ({
          id: player.id || crypto.randomUUID(),
          name: player.name ?? "",
          role: player.role ?? "",
        }))
      : [],
  };
}

export default function TeamsAdminPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Team>(EMPTY_TEAM());
  const [isFormOpen, setIsFormOpen] = useState(true);

  const filteredTeams = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return teams;

    return teams.filter(
      (team) =>
        team.name.toLowerCase().includes(query) ||
        team.tag.toLowerCase().includes(query) ||
        team.id.toLowerCase().includes(query)
    );
  }, [teams, search]);

  async function loadTeams(isRefresh = false) {
    if (isRefresh) setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/teams", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load teams.");
      }

      setTeams(Array.isArray(data) ? data.map(normalizeTeam) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load teams.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function initialFetch() {
      try {
        const response = await fetch("/api/teams", { cache: "no-store" });
        const data = response.ok ? await response.json() : null;

        if (!mounted) {
          setLoading(false);
          return;
        }

        if (Array.isArray(data) && data.length > 0) {
          setTeams(data.map(normalizeTeam));
        } else {
          setTeams([]);
        }
      } catch (err) {
        if (!mounted) {
          setLoading(false);
          return;
        }
        setTeams([]);
        setError(err instanceof Error ? err.message : "Failed to load teams.");
      } finally {
        setLoading(false);
      }
    }

    initialFetch();

    return () => {
      mounted = false;
    };
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm(EMPTY_TEAM());
    setNotice("");
    setError("");
    setIsFormOpen(true);
  }

  function startEdit(team: Team) {
    setEditingId(team.id);
    setForm(normalizeTeam(team));
    setNotice("");
    setError("");
    setIsFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function updatePlayer(index: number, field: keyof Player, value: string) {
    setForm((current) => {
      const players = [...current.players];
      players[index] = {
        ...players[index],
        [field]: value,
      };
      return {
        ...current,
        players,
      };
    });
  }

  function parsePlayerName(rawName: string): { ign: string; tag: string } {
    if (!rawName) return { ign: "", tag: "" };
    const parts = rawName.split("#");
    return {
      ign: parts[0] || "",
      tag: parts.length > 1 ? parts.slice(1).join("#") : "",
    };
  }

  function formatPlayerName(ign: string, tag: string): string {
    const cleanIgn = ign.trim();
    const cleanTag = tag.replace(/^#/, "").trim();
    if (!cleanTag) return cleanIgn;
    return `${cleanIgn}#${cleanTag}`;
  }

  function updatePlayerIgn(index: number, ign: string) {
    const current = form.players[index];
    const { tag } = parsePlayerName(current?.name || "");
    updatePlayer(index, "name", formatPlayerName(ign, tag));
  }

  function updatePlayerTag(index: number, tag: string) {
    const current = form.players[index];
    const { ign } = parsePlayerName(current?.name || "");
    updatePlayer(index, "name", formatPlayerName(ign, tag));
  }

  function addPlayer() {
    setForm((current) => ({
      ...current,
      players: [...current.players, EMPTY_PLAYER()],
    }));
  }

  function removePlayer(index: number) {
    setForm((current) => ({
      ...current,
      players: current.players.filter((_, i) => i !== index),
    }));
  }

  async function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setForm((current) => ({
          ...current,
          logo: reader.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
  }

  async function saveTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const name = form.name.trim();
    const tag = form.tag.trim().toUpperCase();
    const id = (form.id.trim() || slugify(name)).toLowerCase();

    if (!name) {
      setError("Team name is required.");
      return;
    }

    if (!tag) {
      setError("Team tag is required.");
      return;
    }

    if (!id) {
      setError("Team ID could not be generated. Enter a valid ID.");
      return;
    }

    const cleanPlayers = form.players
      .map((player) => ({
        id: player.id || crypto.randomUUID(),
        name: player.name.trim(),
        role: player.role?.trim() || "",
      }))
      .filter((player) => player.name);

    const payload: Team = {
      ...form,
      id,
      name,
      tag,
      seed: Number(form.seed) || 1,
      wins: Number(form.wins) || 0,
      losses: Number(form.losses) || 0,
      captainRank: form.captainRank?.trim() || "",
      players: cleanPlayers,
    };

    setSaving(true);

    try {
      const response = await fetch(
        editingId
          ? `/api/teams/${encodeURIComponent(editingId)}`
          : "/api/teams",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save team.");
      }

      await loadTeams();
      setNotice(
        editingId
          ? `${payload.name} updated successfully.`
          : `${payload.name} registered successfully.`
      );

      startCreate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save team.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTeam(team: Team) {
    const confirmed = window.confirm(
      `Delete team ${team.name}? This will remove their roster.`
    );
    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/teams/${encodeURIComponent(team.id)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete team.");
      }

      await loadTeams();
      setNotice(`${team.name} deleted.`);

      if (editingId === team.id) {
        startCreate();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete team.");
    }
  }

  function exportCsv() {
    const headers = [
      "team_id",
      "team_name",
      "tag",
      "seed",
      "captain_rank",
      "player_1",
      "player_2",
      "player_3",
      "player_4",
      "player_5",
      "player_6",
    ];

    const rows = [
      headers,
      ...teams.map((team) => [
        team.id,
        team.name,
        team.tag,
        team.seed,
        team.captainRank ?? "",
        team.players[0]?.name ?? "",
        team.players[1]?.name ?? "",
        team.players[2]?.name ?? "",
        team.players[3]?.name ?? "",
        team.players[4]?.name ?? "",
        team.players[5]?.name ?? "",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "valorant-teams.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function parseCsvLine(line: string) {
    const values: string[] = [];
    let current = "";
    let quoted = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
        continue;
      }

      if (char === '"') {
        quoted = !quoted;
        continue;
      }

      if (char === "," && !quoted) {
        values.push(current.trim());
        current = "";
        continue;
      }

      current += char;
    }

    values.push(current.trim());
    return values;
  }

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setNotice("");

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim());

      if (lines.length < 2) {
        throw new Error("CSV must contain a header and at least one team.");
      }

      const headers = parseCsvLine(lines[0]).map((header) =>
        header.toLowerCase().trim()
      );

      const findIndex = (names: string[]) =>
        names
          .map((name) => headers.indexOf(name))
          .find((index) => index !== -1) ?? -1;

      const idIndex = findIndex(["team_id", "id"]);
      const nameIndex = findIndex(["team_name", "name"]);
      const tagIndex = findIndex(["tag"]);
      const seedIndex = findIndex(["seed"]);
      const captainIndex = findIndex(["captain_rank", "captainrank"]);

      if (nameIndex === -1 || tagIndex === -1) {
        throw new Error("CSV must contain team_name/name and tag columns.");
      }

      const importedTeams = lines
        .slice(1)
        .map((line) => parseCsvLine(line))
        .filter((row) => row[nameIndex]?.trim())
        .map((row, rowIndex) => {
          const name = row[nameIndex].trim();
          const id = (idIndex !== -1 ? row[idIndex] : "")?.trim() || slugify(name);
          const players = Array.from({ length: 6 }, (_, index) => ({
            id: crypto.randomUUID(),
            name: row[captainIndex + 1 + index]?.trim() || "",
            role: "",
          })).filter((player) => player.name);

          return {
            id,
            name,
            tag: row[tagIndex]?.trim() || name,
            seed: Number(row[seedIndex]) || rowIndex + 1,
            logo: "",
            wins: 0,
            losses: 0,
            captainRank: captainIndex !== -1 ? row[captainIndex]?.trim() || "" : "",
            players,
          };
        });

      for (const team of importedTeams) {
        const existing = teams.find((item) => item.id === team.id);

        const response = await fetch(
          existing
            ? `/api/teams/${encodeURIComponent(team.id)}`
            : "/api/teams",
          {
            method: existing ? "PUT" : "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(team),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Failed to import ${team.name}.`);
        }
      }

      await loadTeams();
      setNotice(`${importedTeams.length} team(s) imported successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import CSV.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <main className="relative min-h-screen text-[#f1f5f9] pb-16">
      {/* ── Ambient Neon Glow Orbs ────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#94a3b8]/12 blur-[180px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-[#94a3b8]/10 blur-[160px]" />
        <div className="absolute bottom-10 left-1/3 h-[500px] w-[500px] rounded-full bg-[#ff2d55]/8 blur-[160px]" />
      </div>

      {/* ── Modern Command Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#030308]/85 px-4 py-3 backdrop-blur-2xl sm:px-6 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <Link
              href="/admin"
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] text-sm font-black text-cyan-400 shadow-inner transition hover:scale-105 hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-300"
              title="Return to Admin Hub"
            >
              <span className="drop-shadow-[0_0_8px_rgba(148,163,184,0.4)]">←</span>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight sm:text-lg text-white">
                  TEAMS & ROSTERS{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#94a3b8] to-[#94a3b8]">
                    // MANAGEMENT
                  </span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-mono font-bold tracking-wider text-cyan-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  {teams.length} REGISTERED
                </span>
              </div>
              <p className="text-[12px] text-slate-400">
                Roster Builder • Seed Configuration • Database Sync
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[13px] font-bold tracking-wider text-slate-300 backdrop-blur-xl transition hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-300 hover:scale-[1.02]"
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
              href="/admin/settings"
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-gradient-to-r from-amber-600/25 to-amber-600/15 px-4 py-1.5 text-[13px] font-bold tracking-wider text-amber-300 backdrop-blur-xl transition hover:border-amber-400 hover:bg-amber-600/35 hover:text-white hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:scale-[1.02]"
            >
              <span>SETTINGS</span>
              <span className="text-sm">⚙</span>
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

      {/* ── Main Content Container ───────────────────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-[1440px] px-4 py-5 sm:px-6 space-y-5">
        {/* Error notification */}
        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-[#ff2d55]/40 bg-[#ff2d55]/10 p-3 text-sm font-bold text-[#ff4d6a]">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ff2d55]/20 text-[12px] font-black">!</span>
            <span>{error}</span>
          </div>
        )}

        {/* Success notification */}
        {notice && (
          <div className="flex items-center gap-2.5 rounded-xl border border-[#10b981]/40 bg-[#10b981]/10 p-3 text-sm font-bold text-[#34d399]">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#10b981]/20 text-[12px] font-black">✓</span>
            <span>{notice}</span>
          </div>
        )}

        {/* ── Form Section: Compact Split Roster Builder ─────────────────── */}
        <section className="overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-5 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          {/* Form Header with Minimize / Expand toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e1e3a] pb-3">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-[#94a3b8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#94a3b8] animate-pulse" />
                {editingId ? "MODIFYING RECORD" : "TEAM REGISTRATION DECK"}
              </div>

              <h2 className="mt-0.5 text-lg font-black tracking-tight text-white">
                {editingId ? form.name || "Edit Team" : "Add Tournament Team"}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={startCreate}
                  className="rounded-lg border border-[#ff2d55]/40 bg-[#ff2d55]/10 px-3 py-1 text-[12px] font-black tracking-widest text-[#ff4d6a] transition hover:bg-[#ff2d55]/20"
                >
                  CANCEL EDIT ✕
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsFormOpen((prev) => !prev)}
                className="rounded-lg border border-[#1e1e3a] bg-[#080812] px-3 py-1 text-[12px] font-black tracking-widest text-[#94a3b8] transition hover:text-white"
              >
                {isFormOpen ? "− COLLAPSE FORM" : "+ OPEN BUILDER"}
              </button>
            </div>
          </div>

          {isFormOpen && (
            <form onSubmit={saveTeam} className="mt-4 space-y-4">
              {/* 2-Column Split: Left = Team Setup, Right = Roster Builder */}
              <div className="grid gap-5 lg:grid-cols-[1fr_1.15fr]">
                {/* ── Left Column: Team Identity & Config ────────────── */}
                <div className="space-y-3 rounded-xl border border-[#1e1e3a] bg-[#080812]/50 p-4">
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#94a3b8] border-b border-[#1e1e3a] pb-1.5">
                    1. FRANCHISE IDENTITY
                  </div>

                  {/* Team Name & Tag */}
                  <div className="grid grid-cols-[1fr_95px] gap-2.5">
                    <div>
                      <label className="mb-1 block text-[11px] font-black uppercase tracking-wider text-[#64748b]">
                        TEAM NAME *
                      </label>
                      <input
                        value={form.name}
                        onChange={(e) =>
                          setForm((curr) => ({
                            ...curr,
                            name: e.target.value,
                            id: editingId ? curr.id : curr.id || slugify(e.target.value),
                          }))
                        }
                        placeholder="e.g. Sentinels"
                        className="w-full rounded-lg border border-[#1e1e3a] bg-[#030308] px-3 py-1.5 text-sm text-white placeholder:text-[#334155] outline-none transition focus:border-[#94a3b8]"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-black uppercase tracking-wider text-[#64748b]">
                        TAG (3-5) *
                      </label>
                      <input
                        value={form.tag}
                        onChange={(e) => setForm((curr) => ({ ...curr, tag: e.target.value.toUpperCase() }))}
                        placeholder="SEN"
                        maxLength={5}
                        className="w-full rounded-lg border border-[#1e1e3a] bg-[#030308] px-3 py-1.5 text-sm font-black uppercase text-white placeholder:text-[#334155] outline-none transition focus:border-[#94a3b8]"
                      />
                    </div>
                  </div>

                  {/* Team ID & Seed Number */}
                  <div className="grid grid-cols-[1fr_80px] gap-2.5">
                    <div>
                      <label className="mb-1 block text-[11px] font-black uppercase tracking-wider text-[#64748b]">
                        SLUG ID
                      </label>
                      <input
                        value={form.id}
                        onChange={(e) => setForm((curr) => ({ ...curr, id: e.target.value }))}
                        disabled={Boolean(editingId)}
                        placeholder="sentinels"
                        className="w-full rounded-lg border border-[#1e1e3a] bg-[#030308] px-3 py-1.5 text-sm text-[#94a3b8] outline-none disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-black uppercase tracking-wider text-[#64748b]">
                        SEED #
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={form.seed}
                        onChange={(e) => setForm((curr) => ({ ...curr, seed: Number(e.target.value) }))}
                        className="w-full rounded-lg border border-[#1e1e3a] bg-[#030308] px-3 py-1.5 text-sm font-bold text-white outline-none focus:border-[#94a3b8]"
                      />
                    </div>
                  </div>

                  {/* Captain & Rank */}
                  <div>
                    <label className="mb-1 block text-[11px] font-black uppercase tracking-wider text-[#64748b]">
                      CAPTAIN / IN-GAME LEAD & RANK
                    </label>
                    <input
                      value={form.captainRank ?? ""}
                      onChange={(e) => setForm((curr) => ({ ...curr, captainRank: e.target.value }))}
                      placeholder="e.g. TenZ — Radiant"
                      className="w-full rounded-lg border border-[#1e1e3a] bg-[#030308] px-3 py-1.5 text-sm text-white placeholder:text-[#334155] outline-none focus:border-[#94a3b8]"
                    />
                  </div>

                  {/* Standings Wins / Losses */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="mb-1 block text-[11px] font-black uppercase tracking-wider text-[#64748b]">
                        WINS (STANDINGS)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={form.wins}
                        onChange={(e) => setForm((curr) => ({ ...curr, wins: Number(e.target.value) }))}
                        className="w-full rounded-lg border border-[#1e1e3a] bg-[#030308] px-3 py-1.5 text-sm font-black text-[#34d399] outline-none focus:border-[#10b981]"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-black uppercase tracking-wider text-[#64748b]">
                        LOSSES (STANDINGS)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={form.losses}
                        onChange={(e) => setForm((curr) => ({ ...curr, losses: Number(e.target.value) }))}
                        className="w-full rounded-lg border border-[#1e1e3a] bg-[#030308] px-3 py-1.5 text-sm font-black text-[#ff4d6a] outline-none focus:border-[#ff2d55]"
                      />
                    </div>
                  </div>

                  {/* Inline Team Logo */}
                  <div className="flex items-center justify-between gap-3 border-t border-[#1e1e3a] pt-2.5">
                    <div className="flex items-center gap-2.5">
                      {form.logo ? (
                        <Image
                          src={form.logo}
                          alt=""
                          width={38}
                          height={38}
                          unoptimized
                          className="h-9 w-9 rounded-lg border border-[#94a3b8]/50 bg-[#0c0c18] object-contain p-1"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-dashed border-[#1e1e3a] bg-[#0c0c18] text-sm">
                          🛡️
                        </div>
                      )}
                      <div>
                        <p className="text-[12px] font-black uppercase tracking-wider text-white">
                          TEAM LOGO
                        </p>
                        <p className="text-[11px] text-[#64748b]">
                          {form.logo ? "Logo attached" : "PNG / JPG < 2MB"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer rounded-lg border border-[#94a3b8]/40 bg-[#94a3b8]/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#f1f5f9] hover:bg-[#94a3b8]/20">
                        <span>{form.logo ? "CHANGE" : "UPLOAD"} ↑</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>

                      {form.logo && (
                        <button
                          type="button"
                          onClick={() => setForm((curr) => ({ ...curr, logo: "" }))}
                          className="rounded-lg border border-[#ff2d55]/30 bg-[#ff2d55]/10 px-2 py-1.5 text-[11px] font-black text-[#ff4d6a] hover:bg-[#ff2d55]/20"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Right Column: Compact Roster Lineup ────────────── */}
                <div className="space-y-2.5 rounded-xl border border-[#1e1e3a] bg-[#080812]/50 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-[#1e1e3a] pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#94a3b8]">
                          2. ROSTER LINEUP ({form.players.length} PLAYERS)
                        </span>
                        <span className="rounded border border-[#94a3b8]/40 bg-[#94a3b8]/10 px-1.5 py-0.5 text-[10px] font-black uppercase text-[#f1f5f9]">
                          ⚡ RIOT ID (#TAG) SUPPORT
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={addPlayer}
                        className="inline-flex items-center gap-1 rounded-md border border-[#94a3b8]/40 bg-[#94a3b8]/10 px-2 py-0.5 text-[11px] font-black text-[#f1f5f9] hover:bg-[#94a3b8]/20"
                      >
                        + ADD PLAYER
                      </button>
                    </div>

                    {/* Compact Player Rows with Dedicated IGN & #TAG Inputs */}
                    <div className="mt-2.5 space-y-1.5">
                      {form.players.map((player, index) => {
                        const { ign, tag } = parsePlayerName(player.name);
                        return (
                          <div
                            key={player.id}
                            className="flex items-center gap-2 rounded-lg border border-[#1e1e3a] bg-[#0c0c18] px-2.5 py-1.5 transition hover:border-[#94a3b8]/40"
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#030308] text-[11px] font-black text-[#94a3b8]">
                              P{index + 1}
                            </span>

                            {/* In-Game Name */}
                            <input
                              value={ign}
                              onChange={(e) => updatePlayerIgn(index, e.target.value)}
                              placeholder={`Player ${index + 1} IGN`}
                              className="flex-1 min-w-[110px] rounded border border-[#1e1e3a] bg-[#030308] px-2.5 py-1 text-sm text-white placeholder:text-[#334155] outline-none focus:border-[#94a3b8]"
                            />

                            {/* Dedicated Riot #TAG field */}
                            <div className="relative w-24 shrink-0">
                              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[13px] font-black text-[#94a3b8]">
                                #
                              </span>
                              <input
                                value={tag}
                                onChange={(e) => updatePlayerTag(index, e.target.value)}
                                placeholder="TAG"
                                maxLength={6}
                                className="w-full rounded border border-[#94a3b8]/40 bg-[#030308] pl-5 pr-1.5 py-1 text-sm font-black uppercase text-[#f1f5f9] placeholder:text-[#334155] outline-none focus:border-[#94a3b8]"
                                title="Riot ID Tag (e.g. VAL, 001, IND)"
                              />
                            </div>

                            {/* Role */}
                            <input
                              value={player.role ?? ""}
                              onChange={(e) => updatePlayer(index, "role", e.target.value)}
                              placeholder="Role (Duelist...)"
                              className="w-28 shrink-0 rounded border border-[#1e1e3a] bg-[#030308] px-2.5 py-1 text-sm text-white placeholder:text-[#334155] outline-none focus:border-[#94a3b8]"
                            />

                            <button
                              type="button"
                              onClick={() => removePlayer(index)}
                              className="shrink-0 rounded p-1 text-[12px] font-black text-[#ff4d6a] hover:bg-[#ff2d55]/20"
                              title="Remove player"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Form Action Buttons */}
                  <div className="flex items-center gap-2.5 pt-3 border-t border-[#1e1e3a]">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 rounded-xl bg-gradient-to-r from-[#94a3b8] to-[#94a3b8] py-2.5 text-sm font-black uppercase tracking-wider text-white shadow-[0_0_15px_rgba(148,163,184,0.3)] transition hover:opacity-95 disabled:opacity-50"
                    >
                      {saving ? "SAVING..." : editingId ? "UPDATE TEAM DATA" : "REGISTER TEAM →"}
                    </button>

                    <button
                      type="button"
                      onClick={startCreate}
                      className="rounded-xl border border-[#1e1e3a] bg-[#030308] px-4 py-2.5 text-sm font-black uppercase tracking-wider text-[#64748b] hover:text-white"
                    >
                      RESET
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </section>

        {/* ── Registered Teams Database Deck ─────────────────────────────── */}
        <section className="overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          {/* Deck Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e1e3a] p-4 sm:p-5">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.25em] text-[#64748b]">
                DATABASE REPOSITORY
              </div>
              <h2 className="mt-0.5 text-lg font-black tracking-tight text-white">
                Tournament Teams ({filteredTeams.length})
              </h2>
            </div>

            {/* Search and Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search teams or players..."
                className="w-48 rounded-xl border border-[#1e1e3a] bg-[#030308] px-3 py-1.5 text-sm text-white placeholder:text-[#334155] outline-none transition focus:border-[#94a3b8]"
              />

              <label className="cursor-pointer inline-flex items-center gap-1 rounded-xl border border-[#1e1e3a] bg-[#030308] px-3 py-1.5 text-[11px] font-black tracking-widest text-[#94a3b8] hover:border-[#94a3b8]/50 hover:text-[#f1f5f9]">
                <span>IMPORT CSV</span>
                <span>↑</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={importCsv}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center gap-1 rounded-xl border border-[#1e1e3a] bg-[#030308] px-3 py-1.5 text-[11px] font-black tracking-widest text-[#94a3b8] hover:border-[#f59e0b]/50 hover:text-[#fbbf24]"
              >
                <span>EXPORT CSV</span>
                <span>↓</span>
              </button>

              <button
                type="button"
                onClick={() => loadTeams(true)}
                className="inline-flex items-center gap-1 rounded-xl border border-[#1e1e3a] bg-[#030308] px-3 py-1.5 text-[11px] font-black tracking-widest text-[#94a3b8] hover:border-[#10b981]/50 hover:text-[#34d399]"
              >
                <span>REFRESH</span>
                <span>⟳</span>
              </button>
            </div>
          </div>

          {/* Teams Grid */}
          {loading ? (
            <div className="p-10 text-center text-sm font-bold text-[#64748b]">
              Loading teams from database...
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-base font-black text-white">No teams registered yet</div>
              <p className="mt-1 text-sm text-[#64748b]">
                Use the registration deck above or import from CSV to populate tournament teams.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2">
              {filteredTeams.map((team) => (
                <article
                  key={team.id}
                  className="group relative overflow-hidden rounded-xl border border-[#1e1e3a] bg-[#030308]/70 p-4 transition-all hover:border-[#94a3b8]/50 hover:shadow-[0_0_20px_rgba(148,163,184,0.12)]"
                >
                  {/* Team Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {/* Logo Avatar */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#1e1e3a] bg-[#0c0c18] p-1.5 group-hover:border-[#94a3b8]/40">
                        {team.logo ? (
                          <Image
                            src={team.logo}
                            alt={`${team.name} logo`}
                            width={48}
                            height={48}
                            unoptimized
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <span className="text-sm font-black text-[#94a3b8]">
                            {team.tag.slice(0, 3).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="inline-flex items-center gap-1 rounded border border-[#94a3b8]/30 bg-[#94a3b8]/10 px-2 py-0.5 text-[10px] font-black text-[#f1f5f9] mb-0.5">
                          SEED #{team.seed}
                        </div>

                        <h3 className="truncate text-base font-black text-white group-hover:text-[#f1f5f9] transition-colors">
                          {team.name}
                        </h3>

                        <div className="text-[12px] font-bold text-[#64748b]">
                          {team.tag} • {team.captainRank || "Rank unassigned"}
                        </div>
                      </div>
                    </div>

                    {/* Win / Loss pill */}
                    <div className="flex items-center gap-1.5 rounded-lg border border-[#1e1e3a] bg-[#0c0c18] px-2.5 py-1 text-sm font-black">
                      <span className="text-[#34d399]">{team.wins}W</span>
                      <span className="text-[#334155]">-</span>
                      <span className="text-[#ff4d6a]">{team.losses}L</span>
                    </div>
                  </div>

                  {/* Roster Chips */}
                  <div className="mt-3.5 border-t border-[#1e1e3a] pt-3">
                    <div className="mb-2.5 flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-[#64748b]">
                      <span>ROSTER LINEUP</span>
                      <span>{team.players.length} PLAYERS</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {team.players.map((player, idx) => {
                        const captainClean = (team.captainRank || "").toLowerCase().trim();
                        const isCaptain =
                          Boolean(
                            captainClean &&
                              player.name &&
                              (captainClean.includes(player.name.toLowerCase()) ||
                                player.name.toLowerCase().includes(captainClean))
                          ) || (player.role ? /captain|igl/i.test(player.role) : false);

                        return (
                          <div
                            key={player.id || idx}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm transition ${
                              isCaptain
                                ? "border-[#f59e0b]/50 bg-[#f59e0b]/10 text-[#fbbf24] shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                                : "border-[#1e1e3a] bg-[#0c0c18] text-[#f1f5f9] hover:border-[#2e2e5a]"
                            }`}
                          >
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-black ${
                                isCaptain
                                  ? "bg-[#f59e0b]/20 text-[#f59e0b]"
                                  : "bg-[#030308] text-[#64748b]"
                              }`}
                            >
                              {idx + 1}
                            </span>

                            <span className="font-bold text-[13px] tracking-tight uppercase">
                              {player.name}
                            </span>

                            {isCaptain ? (
                              <span className="rounded bg-[#f59e0b]/20 px-1 py-0.5 text-[10px] font-black uppercase text-[#fbbf24]">
                                ★ CPT
                              </span>
                            ) : player.role ? (
                              <span className="rounded bg-[#1e1e3a] px-1 py-0.5 text-[10px] font-black uppercase text-[#94a3b8]">
                                {player.role}
                              </span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-2 border-t border-[#1e1e3a]/60 pt-3">
                    <button
                      type="button"
                      onClick={() => startEdit(team)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#94a3b8]/40 bg-[#94a3b8]/10 py-1.5 text-sm font-black tracking-widest text-[#f1f5f9] transition hover:bg-[#94a3b8]/20 hover:shadow-[0_0_12px_rgba(148,163,184,0.15)]"
                    >
                      <span>✎ EDIT ROSTER</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteTeam(team)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#ff2d55]/30 bg-[#ff2d55]/8 px-4 py-1.5 text-sm font-black tracking-widest text-[#ff4d6a] transition hover:bg-[#ff2d55]/20"
                    >
                      <span>🗑 DELETE</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

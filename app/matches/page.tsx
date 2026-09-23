"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Match, MatchStatus, Team } from "@/lib/types";
import { getGameDefinition } from "@/lib/games/registry";

const GROUP_FIXTURES = [
  { matchNumber: 1, team1Seed: 1, team2Seed: 2, map: "Lotus" },
  { matchNumber: 2, team1Seed: 1, team2Seed: 3, map: "Sunset" },
  { matchNumber: 3, team1Seed: 1, team2Seed: 4, map: "Haven" },
  { matchNumber: 4, team1Seed: 2, team2Seed: 3, map: "Split" },
  { matchNumber: 5, team1Seed: 2, team2Seed: 4, map: "Ascent" },
  { matchNumber: 6, team1Seed: 3, team2Seed: 4, map: "Bind" },
  { matchNumber: 7, team1Seed: 2, team2Seed: 1, map: "Breeze" },
  { matchNumber: 8, team1Seed: 3, team2Seed: 1, map: "Bind" },
  { matchNumber: 9, team1Seed: 4, team2Seed: 1, map: "Lotus" },
  { matchNumber: 10, team1Seed: 3, team2Seed: 2, map: "Sunset" },
  { matchNumber: 11, team1Seed: 4, team2Seed: 2, map: "Haven" },
  { matchNumber: 12, team1Seed: 4, team2Seed: 3, map: "Ascent" },
];

const PHASE2 = {
  13: "Q1",
  14: "ELIM",
  15: "Q2",
  16: "GF",
} as const;

type EditorState = {
  id: string;
  matchNumber: string;
  stage: string;
  team1Id: string;
  team2Id: string;
  scheduledAt: string;
  map: string;
  bestOf: string;
  team1Score: string;
  team2Score: string;
  status: MatchStatus;
};

const emptyEditor: EditorState = {
  id: "",
  matchNumber: "",
  stage: "Group Stage",
  team1Id: "",
  team2Id: "",
  scheduledAt: "",
  map: "TBD",
  bestOf: "1",
  team1Score: "0",
  team2Score: "0",
  status: "Scheduled",
};

function normalizeMatch(match: Match): Match {
  return {
    ...match,
    team1Id: match.team1Id ?? "",
    team2Id: match.team2Id ?? "",
    scheduledAt: match.scheduledAt ?? "",
    playerStats: match.playerStats ?? [],
  };
}

function matchLabel(matchNumber: number) {
  if (matchNumber <= 12) {
    return `M${String(matchNumber).padStart(2, "0")}`;
  }
  return `M${matchNumber}`;
}

function phaseLabel(matchNumber: number) {
  return PHASE2[matchNumber as keyof typeof PHASE2] ?? "GROUP";
}

function calculateStandings(teams: Team[], matches: Match[]) {
  const table = teams.map((team) => ({
    team,
    played: 0,
    wins: 0,
    losses: 0,
    roundDiff: 0,
    points: 0,
  }));

  const byId = new Map(table.map((row) => [row.team.id, row]));

  for (const match of matches) {
    if (
      match.stage !== "Group Stage" ||
      match.matchNumber > 12 ||
      match.status !== "Completed"
    ) {
      continue;
    }

    if (!match.team1Id || !match.team2Id) continue;

    const team1 = byId.get(match.team1Id);
    const team2 = byId.get(match.team2Id);

    if (!team1 || !team2) continue;

    const score1 = Number(match.team1Score ?? 0);
    const score2 = Number(match.team2Score ?? 0);

    team1.played += 1;
    team2.played += 1;

    team1.roundDiff += score1 - score2;
    team2.roundDiff += score2 - score1;

    if (score1 > score2) {
      team1.wins += 1;
      team2.losses += 1;
      team1.points += 3;
    } else if (score2 > score1) {
      team2.wins += 1;
      team1.losses += 1;
      team2.points += 3;
    }
  }

  return table.sort(
    (a, b) =>
      b.points - a.points ||
      b.roundDiff - a.roundDiff ||
      b.wins - a.wins ||
      a.team.seed - b.team.seed,
  );
}

function toDateTimeLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (number: number) => String(number).padStart(2, "0");

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
}

export default function MatchCenterPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [editor, setEditor] = useState<EditorState>(emptyEditor);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");

  const [activeSection, setActiveSection] = useState<"group" | "phase2">("group");
  const [gameId, setGameId] = useState<string>("valorant");

  const activeGame = useMemo(() => getGameDefinition(gameId), [gameId]);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setLoading(true);
      }
      setError("");

      const [teamsResponse, matchesResponse, settingsResponse] = await Promise.all([
        fetch("/api/teams?lite=1", { cache: "no-store" }),
        fetch("/api/matches", { cache: "no-store" }),
        fetch("/api/settings", { cache: "no-store" }).catch(() => null),
      ]);

      const teamsData = teamsResponse.ok ? await teamsResponse.json() : null;
      const matchesData = matchesResponse.ok ? await matchesResponse.json() : null;
      if (settingsResponse && settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        if (settingsData?.gameId) setGameId(settingsData.gameId);
      }

      const teamList = Array.isArray(teamsData)
        ? teamsData
        : (teamsData?.teams ?? []);
      const matchList = Array.isArray(matchesData)
        ? matchesData
        : (matchesData?.matches ?? []);

      setTeams(teamList);
      setMatches(matchList.map(normalizeMatch));
    } catch (err) {
      console.warn("Failed to load live tournament data:", err);
      setTeams([]);
      setMatches([]);
      setError(
        err instanceof Error ? err.message : "Failed to load tournament data.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        const [teamsResponse, matchesResponse] = await Promise.all([
          fetch("/api/teams?lite=1", { cache: "no-store" }),
          fetch("/api/matches", { cache: "no-store" }),
        ]);

        const teamsData = teamsResponse.ok ? await teamsResponse.json() : null;
        const matchesData = matchesResponse.ok ? await matchesResponse.json() : null;

        if (!mounted) {
          setLoading(false);
          return;
        }

        const teamList = Array.isArray(teamsData)
          ? teamsData
          : (teamsData?.teams ?? []);
        const matchList = Array.isArray(matchesData)
          ? matchesData
          : (matchesData?.matches ?? []);

        setTeams(teamList);
        setMatches(matchList.map(normalizeMatch));
      } catch (err) {
        if (!mounted) {
          setLoading(false);
          return;
        }
        console.warn("Failed to load live tournament data:", err);
        setTeams((prev) => (prev.length > 0 ? prev : []));
        setMatches((prev) => (prev.length > 0 ? prev : []));
        setError(
          err instanceof Error ? err.message : "Failed to load tournament data.",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  const sortedTeams = useMemo(
    () => [...teams].sort((a, b) => a.seed - b.seed),
    [teams],
  );

  const standings = useMemo(
    () => calculateStandings(sortedTeams, matches),
    [sortedTeams, matches],
  );

  const groupMatches = useMemo(
    () =>
      matches
        .filter(
          (match) =>
            match.stage === "Group Stage" &&
            match.matchNumber >= 1 &&
            match.matchNumber <= 12,
        )
        .sort((a, b) => a.matchNumber - b.matchNumber),
    [matches],
  );

  const phase2Matches = useMemo(
    () =>
      matches
        .filter((match) => match.matchNumber >= 13)
        .sort((a, b) => a.matchNumber - b.matchNumber),
    [matches],
  );

  const completedGroupMatches = groupMatches.filter(
    (match) => match.status === "Completed",
  ).length;

  const groupStageComplete =
    teams.length === 4 && completedGroupMatches === 12;

  const filteredMatches = useMemo(() => {
    const source = activeSection === "group" ? groupMatches : phase2Matches;

    return source.filter((match) => {
      const query = search.trim().toLowerCase();

      const team1 = teams.find((t) => t.id === match.team1Id)?.name ?? "TBD";
      const team2 = teams.find((t) => t.id === match.team2Id)?.name ?? "TBD";

      const matchesSearch =
        !query ||
        match.id.toLowerCase().includes(query) ||
        team1.toLowerCase().includes(query) ||
        team2.toLowerCase().includes(query) ||
        match.map.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || match.status === statusFilter;

      const matchesStage =
        stageFilter === "All" || match.stage === stageFilter;

      return matchesSearch && matchesStatus && matchesStage;
    });
  }, [
    activeSection,
    groupMatches,
    phase2Matches,
    search,
    statusFilter,
    stageFilter,
    teams,
  ]);

  function getTeamName(teamId?: string) {
    if (!teamId) return "TBD";
    return teams.find((team) => team.id === teamId)?.name ?? "TBD";
  }

  function resetEditor() {
    setEditor(emptyEditor);
    setMessage("");
    setError("");
  }

  function closeEditor() {
    resetEditor();
    setIsEditorOpen(false);
  }

  function startNewGroupMatch() {
    const nextFixture = GROUP_FIXTURES.find(
      (fixture) =>
        !matches.some((match) => match.matchNumber === fixture.matchNumber),
    );

    if (!nextFixture) {
      setError(
        "All 12 Group Stage matches already exist. Phase 2 is automatic.",
      );
      return;
    }

    const team1 = teams.find((team) => team.seed === nextFixture.team1Seed);
    const team2 = teams.find((team) => team.seed === nextFixture.team2Seed);

    setEditor({
      id: `M${String(nextFixture.matchNumber).padStart(2, "0")}`,
      matchNumber: String(nextFixture.matchNumber),
      stage: "Group Stage",
      team1Id: team1?.id ?? "",
      team2Id: team2?.id ?? "",
      scheduledAt: "",
      map: nextFixture.map,
      bestOf: "1",
      team1Score: "0",
      team2Score: "0",
      status: "Scheduled",
    });

    setActiveSection("group");
    setIsEditorOpen(true);
    setMessage("");
    setError("");
  }

  function editMatch(match: Match) {
    if (match.matchNumber > 12) {
      setError(
        "M13–M16 are automatic tournament matches and cannot be manually edited here.",
      );
      return;
    }

    setEditor({
      id: match.id,
      matchNumber: String(match.matchNumber),
      stage: "Group Stage",
      team1Id: match.team1Id,
      team2Id: match.team2Id,
      scheduledAt: toDateTimeLocal(match.scheduledAt),
      map: match.map,
      bestOf: String(match.bestOf),
      team1Score: String(match.team1Score),
      team2Score: String(match.team2Score),
      status: match.status,
    });

    setActiveSection("group");
    setIsEditorOpen(true);
    setMessage("");
    setError("");
  }

  async function saveGroupMatch() {
    setError("");
    setMessage("");

    const matchNumber = Number(editor.matchNumber);

    if (
      !Number.isInteger(matchNumber) ||
      matchNumber < 1 ||
      matchNumber > 12
    ) {
      setError(
        "Only Group Stage matches M01–M12 can be created or edited manually.",
      );
      return;
    }

    if (!editor.team1Id || !editor.team2Id) {
      setError("Select both teams.");
      return;
    }

    if (editor.team1Id === editor.team2Id) {
      setError("A team cannot play against itself.");
      return;
    }

    const score1 = Number(editor.team1Score);
    const score2 = Number(editor.team2Score);

    if (
      !Number.isInteger(score1) ||
      !Number.isInteger(score2) ||
      score1 < 0 ||
      score2 < 0
    ) {
      setError("Scores must be valid non-negative numbers.");
      return;
    }

    if (editor.status === "Completed" && score1 === score2) {
      setError("A completed Valorant match cannot have a tied final score.");
      return;
    }

    const existing = matches.find((match) => match.matchNumber === matchNumber);

    if (existing && editor.id !== existing.id) {
      setError(`M${String(matchNumber).padStart(2, "0")} already exists.`);
      return;
    }

    const payload = {
      id: editor.id || `M${String(matchNumber).padStart(2, "0")}`,
      matchNumber,
      stage: "Group Stage",
      team1Id: editor.team1Id,
      team2Id: editor.team2Id,
      scheduledAt: editor.scheduledAt
        ? new Date(editor.scheduledAt).toISOString()
        : "",
      map: editor.map || "TBD",
      bestOf: Number(editor.bestOf),
      team1Score: score1,
      team2Score: score2,
      status: editor.status,
      winnerId:
        editor.status === "Completed"
          ? score1 > score2
            ? editor.team1Id
            : editor.team2Id
          : undefined,
      playerStats: existing?.playerStats ?? [],
    };

    try {
      setSaving(true);

      const response = existing
        ? await fetch(`/api/matches/${encodeURIComponent(existing.id)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/matches", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save match.");
      }

      setMessage(
        existing
          ? `${payload.id} updated successfully.`
          : `${payload.id} created successfully.`,
      );

      resetEditor();
      setIsEditorOpen(false);

      await loadData();
      await generateAutomaticPhase2();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save match.");
    } finally {
      setSaving(false);
    }
  }

  async function createAutomaticMatch(
    matchNumber: number,
    stage: string,
    team1Id: string,
    team2Id: string,
    existingMatch?: Match,
  ) {
    const id = `M${matchNumber}`;

    if (
      existingMatch &&
      existingMatch.team1Id === team1Id &&
      existingMatch.team2Id === team2Id
    ) {
      return;
    }

    const payload = {
      id,
      matchNumber,
      stage,
      team1Id,
      team2Id,
      scheduledAt: existingMatch?.scheduledAt ?? "",
      map: existingMatch?.map ?? "TBD",
      bestOf: matchNumber === 16 ? 3 : 1,
      team1Score: existingMatch?.team1Score ?? 0,
      team2Score: existingMatch?.team2Score ?? 0,
      status: existingMatch?.status ?? "Scheduled",
      winnerId: existingMatch?.winnerId,
      playerStats: existingMatch?.playerStats ?? [],
    };

    const response = existingMatch
      ? await fetch(`/api/matches/${encodeURIComponent(existingMatch.id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || `Failed to create automatic match ${id}.`,
      );
    }
  }

  async function generateAutomaticPhase2() {
    try {
      setGenerating(true);

      const [teamsResponse, matchesResponse] = await Promise.all([
        fetch("/api/teams?lite=1", { cache: "no-store" }),
        fetch("/api/matches", { cache: "no-store" }),
      ]);

      const teamsData = await teamsResponse.json();
      const matchesData = await matchesResponse.json();

      if (!teamsResponse.ok || !matchesResponse.ok) {
        throw new Error("Unable to check tournament status.");
      }

      const currentTeams: Team[] = (
        Array.isArray(teamsData) ? teamsData : (teamsData?.teams ?? [])
      ).sort((a: Team, b: Team) => a.seed - b.seed);

      const currentMatches: Match[] = (
        Array.isArray(matchesData)
          ? matchesData
          : (matchesData?.matches ?? [])
      ).map(normalizeMatch);

      if (currentTeams.length !== 4) {
        return;
      }

      const completedGroups = currentMatches.filter(
        (match) =>
          match.stage === "Group Stage" &&
          match.matchNumber >= 1 &&
          match.matchNumber <= 12 &&
          match.status === "Completed",
      );

      if (completedGroups.length < 12) {
        return;
      }

      const calculatedStandings = calculateStandings(
        currentTeams,
        currentMatches,
      );

      const [first, second, third, fourth] = calculatedStandings.map(
        (row) => row.team.id,
      );

      if (!first || !second || !third || !fourth) {
        return;
      }

      const m13 = currentMatches.find((match) => match.matchNumber === 13);
      const m14 = currentMatches.find((match) => match.matchNumber === 14);

      await createAutomaticMatch(13, "Qualifiers", first, second, m13);
      await createAutomaticMatch(14, "Qualifiers", third, fourth, m14);

      const refreshedResponse = await fetch("/api/matches", {
        cache: "no-store",
      });
      const refreshedData = await refreshedResponse.json();

      if (!refreshedResponse.ok) {
        throw new Error(
          refreshedData.error || "Failed to refresh playoff matches.",
        );
      }

      const refreshedMatches: Match[] = (
        refreshedData.matches ?? []
      ).map(normalizeMatch);

      const qualifier1 = refreshedMatches.find(
        (match) => match.matchNumber === 13,
      );
      const elimination = refreshedMatches.find(
        (match) => match.matchNumber === 14,
      );

      if (
        qualifier1?.status === "Completed" &&
        elimination?.status === "Completed" &&
        qualifier1.winnerId &&
        elimination.winnerId
      ) {
        const loserOfM13 =
          qualifier1.winnerId === qualifier1.team1Id
            ? qualifier1.team2Id
            : qualifier1.team1Id;

        const winnerOfM14 = elimination.winnerId;

        if (loserOfM13 && winnerOfM14) {
          const m15 = refreshedMatches.find(
            (match) => match.matchNumber === 15,
          );

          await createAutomaticMatch(
            15,
            "Qualifiers",
            loserOfM13,
            winnerOfM14,
            m15,
          );
        }
      }

      const finalRefreshResponse = await fetch("/api/matches", {
        cache: "no-store",
      });
      const finalRefreshData = await finalRefreshResponse.json();

      if (!finalRefreshResponse.ok) {
        throw new Error(
          finalRefreshData.error || "Failed to refresh Grand Final progression.",
        );
      }

      const finalMatches: Match[] = (
        finalRefreshData.matches ?? []
      ).map(normalizeMatch);

      const finalM13 = finalMatches.find((match) => match.matchNumber === 13);
      const finalM15 = finalMatches.find((match) => match.matchNumber === 15);

      if (
        finalM13?.status === "Completed" &&
        finalM15?.status === "Completed" &&
        finalM13.winnerId &&
        finalM15.winnerId
      ) {
        const m16 = finalMatches.find((match) => match.matchNumber === 16);

        await createAutomaticMatch(
          16,
          "Grand Final",
          finalM13.winnerId,
          finalM15.winnerId,
          m16,
        );
      }

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Automatic Phase 2 generation failed.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function deleteGroupMatch(match: Match) {
    if (match.matchNumber > 12) {
      setError("Automatic Phase 2 matches cannot be deleted manually.");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${matchLabel(match.matchNumber)}? This cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/matches/${encodeURIComponent(match.id)}`,
        { method: "DELETE" },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete match.");
      }

      setMessage(`${matchLabel(match.matchNumber)} deleted successfully.`);

      if (editor.id === match.id) {
        resetEditor();
        setIsEditorOpen(false);
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete match.");
    }
  }

  async function refreshAndProgress() {
    setMessage("");
    setError("");
    await loadData();
    await generateAutomaticPhase2();
  }

  function statusBadge(status: MatchStatus) {
    switch (status) {
      case "Live":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff2d55]/40 bg-[#ff2d55]/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#ff4d6a]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff2d55] animate-pulse" />
            LIVE
          </span>
        );
      case "Completed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#10b981]/40 bg-[#10b981]/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#34d399]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
            COMPLETED
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#64748b]/40 bg-[#64748b]/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#94a3b8]">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f59e0b]/40 bg-[#f59e0b]/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#fbbf24]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#fbbf24]" />
            SCHEDULED
          </span>
        );
    }
  }

  return (
    <div className="relative min-h-screen text-[#f1f5f9] pb-24">
      {/* ── Ambient Neon Glow Orbs ────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#94a3b8]/12 blur-[180px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-[#ff2d55]/10 blur-[160px]" />
        <div className="absolute bottom-10 left-1/3 h-[500px] w-[500px] rounded-full bg-[#94a3b8]/8 blur-[160px]" />
      </div>

      {/* ── Modern Command Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#030308]/85 px-4 py-3 backdrop-blur-2xl sm:px-8 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Link
              href="/admin"
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] text-sm font-black text-rose-400 shadow-inner transition hover:scale-105 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300"
              title="Return to Admin Hub"
            >
              <span className="drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]">←</span>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight sm:text-lg text-white">
                  MATCH CENTRE{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff2d55] to-[#94a3b8]">
                    // FIXTURES & RESULTS
                  </span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-mono font-bold tracking-wider text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  12 GROUP + 4 PLAYOFF
                </span>
              </div>
              <p className="text-[12px] text-slate-400">
                {activeGame.name} Tournament Bracket & Live Schedule Orchestrator
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[13px] font-bold tracking-wider text-slate-300 backdrop-blur-xl transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300 hover:scale-[1.02]"
            >
              <span>← ADMIN HUB</span>
            </Link>

            <Link
              href="/teams"
              className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-gradient-to-r from-purple-600/25 to-purple-600/15 px-4 py-1.5 text-[13px] font-bold tracking-wider text-purple-300 backdrop-blur-xl transition hover:border-purple-400 hover:bg-purple-600/35 hover:text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:scale-[1.02]"
            >
              <span>TEAMS & ROSTERS</span>
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

      {/* ── Main Dashboard Workspace ───────────────────────────────────────── */}
      <main className="relative z-10 mx-auto max-w-[1680px] px-4 pt-8 sm:px-8">
        {/* Metric Cards Row */}
        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-5 backdrop-blur-xl transition hover:border-[#94a3b8]/40">
            <div className="text-[12px] font-black uppercase tracking-[0.2em] text-[#64748b]">
              TEAMS REGISTERED
            </div>
            <div className="mt-2 text-3xl font-black text-white">
              {teams.length}
            </div>
            <p className="mt-1 text-[12px] text-[#64748b]">4 seeded teams required</p>
          </div>

          <div className="rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-5 backdrop-blur-xl transition hover:border-[#94a3b8]/40">
            <div className="text-[12px] font-black uppercase tracking-[0.2em] text-[#94a3b8]">
              GROUP FIXTURES
            </div>
            <div className="mt-2 text-3xl font-black text-white">
              {groupMatches.length}
              <span className="ml-1 text-sm font-bold text-[#64748b]">/ 12</span>
            </div>
            <p className="mt-1 text-[12px] text-[#64748b]">Double round-robin</p>
          </div>

          <div className="rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-5 backdrop-blur-xl transition hover:border-[#10b981]/40">
            <div className="text-[12px] font-black uppercase tracking-[0.2em] text-[#34d399]">
              COMPLETED MATCHES
            </div>
            <div className="mt-2 text-3xl font-black text-[#34d399]">
              {completedGroupMatches}
              <span className="ml-1 text-sm font-bold text-[#64748b]">/ 12</span>
            </div>
            <p className="mt-1 text-[12px] text-[#64748b]">Official results verified</p>
          </div>

          <div className="rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-5 backdrop-blur-xl transition hover:border-[#f59e0b]/40">
            <div className="text-[12px] font-black uppercase tracking-[0.2em] text-[#fbbf24]">
              PLAYOFF BRACKET
            </div>
            <div className="mt-2 text-3xl font-black text-white">
              {phase2Matches.length}
              <span className="ml-1 text-sm font-bold text-[#64748b]">/ 4</span>
            </div>
            <p className="mt-1 text-[12px] text-[#64748b]">Q1, Elim, Q2, GF</p>
          </div>

          <div
            className={`rounded-2xl border p-5 backdrop-blur-xl ${
              groupStageComplete
                ? "border-[#10b981]/40 bg-[#10b981]/10 shadow-[0_0_25px_rgba(16,185,129,0.15)]"
                : "border-[#1e1e3a] bg-[#0c0c18]/85"
            }`}
          >
            <div className="text-[12px] font-black uppercase tracking-[0.2em] text-[#64748b]">
              STAGE STATUS
            </div>
            <div
              className={`mt-2 flex items-center gap-2 text-sm font-black uppercase ${
                groupStageComplete ? "text-[#34d399]" : "text-[#f1f5f9]"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  groupStageComplete ? "bg-[#34d399] animate-pulse" : "bg-[#94a3b8]"
                }`}
              />
              {groupStageComplete ? "PHASE 2 READY" : "GROUP STAGE ACTIVE"}
            </div>
            <p className="mt-1 text-[12px] text-[#64748b]">
              {groupStageComplete ? "Playoffs in progress" : "12 group games running"}
            </p>
          </div>
        </section>

        {/* Progression Stepper Card */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 backdrop-blur-xl">
          <div className="flex flex-col gap-3 border-b border-[#1e1e3a] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#94a3b8]">
                AUTOMATED IPL BRACKET SYSTEM
              </p>
              <h2 className="mt-0.5 text-lg font-black uppercase tracking-tight text-white">
                Tournament Stage Pipeline
              </h2>
            </div>

            <button
              type="button"
              onClick={refreshAndProgress}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-xl border border-[#94a3b8]/40 bg-[#94a3b8]/15 px-4 py-2 text-sm font-black uppercase tracking-widest text-[#f1f5f9] transition hover:bg-[#94a3b8]/25 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#f1f5f9] border-t-transparent" />
                  <span>Checking Progression...</span>
                </>
              ) : (
                <span>Check Auto Progression ⟳</span>
              )}
            </button>
          </div>

          <div className="grid gap-px bg-[#1e1e3a] sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                number: "01",
                title: "GROUP STAGE",
                text: "M01–M12 Double Round",
                active: !groupStageComplete,
              },
              {
                number: "02",
                title: "QUALIFIERS",
                text: "M13 (1v2) & M14 (3v4)",
                active: groupStageComplete && phase2Matches.length < 2,
              },
              {
                number: "03",
                title: "LOWER QUALIFIER",
                text: "M15 (Loser Q1 vs Winner Elim)",
                active:
                  phase2Matches.some(
                    (m) => m.matchNumber === 13 && m.status === "Completed",
                  ) &&
                  phase2Matches.some(
                    (m) => m.matchNumber === 14 && m.status === "Completed",
                  ),
              },
              {
                number: "04",
                title: "GRAND FINAL",
                text: "M16 (Winner Q1 vs Winner Q2)",
                active: phase2Matches.some(
                  (m) => m.matchNumber === 15 && m.status === "Completed",
                ),
              },
            ].map((step) => (
              <div key={step.number} className="bg-[#0c0c18] p-5">
                <span className="text-sm font-black text-[#ff2d55]">
                  {step.number}
                </span>
                <h3 className="mt-1 text-sm font-black uppercase text-white">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-[#64748b]">{step.text}</p>
                <div
                  className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider ${
                    step.active
                      ? "border border-[#94a3b8]/40 bg-[#94a3b8]/10 text-[#f1f5f9]"
                      : "border border-[#1e1e3a] bg-[#080812] text-[#64748b]"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      step.active ? "bg-[#f1f5f9] animate-pulse" : "bg-[#475569]"
                    }`}
                  />
                  {step.active ? "ACTIVE STAGE" : "STANDBY / DONE"}
                </div>
              </div>
            ))}
          </div>
        </section>

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

        {/* ── Two-Column Layout (Match Feed + Sidebar) ───────────────────────── */}
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          {/* Main Feed Column */}
          <section className="min-w-0 space-y-4">
            {/* Section Switcher & New Match CTA */}
            <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-[#0c0c18]/85 p-3.5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between shadow-[0_4px_25px_rgba(0,0,0,0.4)]">
              <div className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.03] p-1 backdrop-blur-xl">
                <button
                  type="button"
                  onClick={() => setActiveSection("group")}
                  className={`rounded-full px-4 py-2 text-sm font-black uppercase tracking-wider transition ${
                    activeSection === "group"
                      ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  GROUP STAGE (M01–M12)
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection("phase2")}
                  className={`rounded-full px-4 py-2 text-sm font-black uppercase tracking-wider transition ${
                    activeSection === "phase2"
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  AUTO PLAYOFFS (M13–M16)
                </button>
              </div>

              <button
                type="button"
                onClick={startNewGroupMatch}
                disabled={teams.length !== 4 || groupMatches.length >= 12}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-rose-500/40 bg-gradient-to-r from-rose-600 to-[#ff2d55] px-5 py-2.5 text-sm font-black uppercase tracking-widest text-white shadow-[0_0_20px_rgba(255,45,85,0.3)] transition hover:brightness-110 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                <span>+ NEW GROUP MATCH</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="grid gap-3 rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-4 backdrop-blur-xl md:grid-cols-[1fr_180px_180px]">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search match ID, team name or map..."
                className="w-full rounded-xl border border-[#1e1e3a] bg-[#080812] px-4 py-2.5 text-sm font-semibold text-white outline-none placeholder:text-[#475569] focus:border-[#94a3b8]"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-[#1e1e3a] bg-[#080812] px-3 py-2.5 text-sm font-semibold text-white outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Live">Live</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="w-full rounded-xl border border-[#1e1e3a] bg-[#080812] px-3 py-2.5 text-sm font-semibold text-white outline-none"
              >
                <option value="All">All Stages</option>
                <option value="Group Stage">Group Stage</option>
                <option value="Qualifiers">Qualifiers</option>
                <option value="Grand Final">Grand Final</option>
              </select>
            </div>

            {/* Match Cards List */}
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-32 animate-pulse rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85"
                    />
                  ))}
                </div>
              ) : filteredMatches.length === 0 ? (
                <div className="rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-12 text-center backdrop-blur-xl">
                  <p className="text-base font-black text-white">No matches found</p>
                  <p className="mt-1 text-sm text-[#64748b]">
                    {activeSection === "group"
                      ? "Create the Group Stage fixtures M01–M12 using '+ NEW GROUP MATCH'."
                      : "Phase 2 matches will appear automatically when Group Stage concludes."}
                  </p>
                </div>
              ) : (
                filteredMatches.map((match) => {
                  const isAutomatic = match.matchNumber >= 13;

                  return (
                    <div
                      key={match.id}
                      className="group relative overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-5 backdrop-blur-xl transition hover:border-[#94a3b8]/50 hover:shadow-[0_0_30px_rgba(148,163,184,0.08)] sm:p-6"
                    >
                      {/* Top Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e1e3a] pb-4">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 items-center justify-center rounded-lg border border-[#1e1e3a] bg-[#080812] px-2.5 text-sm font-black tracking-wider text-white">
                            {matchLabel(match.matchNumber)}
                          </span>

                          <span className="rounded-lg border border-[#ff2d55]/30 bg-[#ff2d55]/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#ff4d6a]">
                            {isAutomatic ? phaseLabel(match.matchNumber) : "GROUP STAGE"}
                          </span>

                          <span className="rounded-lg border border-[#1e1e3a] bg-[#080812] px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#94a3b8]">
                            {match.map || "TBD"} • BO{match.bestOf}
                          </span>

                          {isAutomatic && (
                            <span className="rounded-full border border-[#94a3b8]/40 bg-[#94a3b8]/15 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#f1f5f9]">
                              AUTO
                            </span>
                          )}
                        </div>

                        {statusBadge(match.status)}
                      </div>

                      {/* Versus Arena */}
                      <div className="mt-5 grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
                        <div className="rounded-xl border border-[#1e1e3a]/60 bg-[#080812]/70 p-4 md:text-right">
                          <p className="text-base font-black uppercase tracking-tight text-white">
                            {getTeamName(match.team1Id)}
                          </p>
                        </div>

                        <div className="text-center px-4">
                          <div className="text-3xl font-black tracking-tight text-white">
                            {match.team1Score}{" "}
                            <span className="text-[#475569]">:</span>{" "}
                            {match.team2Score}
                          </div>

                          {match.winnerId && (
                            <p className="mt-1 text-[11px] font-black uppercase tracking-wider text-[#34d399]">
                              WINNER: {getTeamName(match.winnerId)}
                            </p>
                          )}
                        </div>

                        <div className="rounded-xl border border-[#1e1e3a]/60 bg-[#080812]/70 p-4">
                          <p className="text-base font-black uppercase tracking-tight text-white">
                            {getTeamName(match.team2Id)}
                          </p>
                        </div>
                      </div>

                      {/* Actions Footer */}
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#1e1e3a] pt-4">
                        <span className="text-sm font-semibold text-[#64748b]">
                          {match.scheduledAt
                            ? new Date(match.scheduledAt).toLocaleString()
                            : "Schedule TBD"}
                        </span>

                        <div className="flex flex-wrap items-center gap-2">
                          {!isAutomatic ? (
                            <>
                              <button
                                type="button"
                                onClick={() => editMatch(match)}
                                className="rounded-xl border border-[#1e1e3a] bg-[#080812] px-3.5 py-2 text-[12px] font-black uppercase tracking-wider text-[#94a3b8] transition hover:border-white hover:text-white"
                              >
                                EDIT
                              </button>

                              <Link
                                href={`/matches/${encodeURIComponent(match.id)}`}
                                className="rounded-xl border border-[#ff2d55]/40 bg-[#ff2d55]/10 px-4 py-2 text-[12px] font-black uppercase tracking-wider text-[#ff4d6a] transition hover:bg-[#ff2d55]/20 hover:shadow-[0_0_15px_rgba(255,45,85,0.2)]"
                              >
                                RECORD RESULT ↗
                              </Link>

                              <button
                                type="button"
                                onClick={() => deleteGroupMatch(match)}
                                className="rounded-xl border border-[#ff2d55]/20 bg-[#ff2d55]/5 px-3 py-2 text-[12px] font-black uppercase tracking-wider text-[#ff4d6a]/80 transition hover:bg-[#ff2d55]/15"
                              >
                                DELETE
                              </button>
                            </>
                          ) : (
                            <Link
                              href={`/matches/${encodeURIComponent(match.id)}`}
                              className="rounded-xl border border-[#94a3b8]/40 bg-[#94a3b8]/15 px-4 py-2 text-[12px] font-black uppercase tracking-wider text-[#f1f5f9] transition hover:bg-[#94a3b8]/25"
                            >
                              VIEW / EDIT RESULT ↗
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Right Sidebar Column */}
          <aside className="space-y-6">
            {/* Live Standings Panel */}
            <section className="rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-[#1e1e3a] pb-4">
                <div>
                  <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#94a3b8]">
                    GROUP STAGE
                  </p>
                  <h3 className="mt-0.5 text-base font-black uppercase tracking-tight text-white">
                    Standings Table
                  </h3>
                </div>
                <span className="rounded-full border border-[#94a3b8]/30 bg-[#94a3b8]/10 px-2.5 py-0.5 text-[11px] font-black text-[#f1f5f9]">
                  LIVE
                </span>
              </div>

              <div className="mt-5 overflow-hidden rounded-xl border border-[#1e1e3a]">
                <div className="grid grid-cols-[28px_1fr_32px_32px_44px] gap-2 border-b border-[#1e1e3a] bg-[#080812] px-3 py-2.5 text-[11px] font-black tracking-wider text-[#64748b]">
                  <div>#</div>
                  <div>TEAM</div>
                  <div className="text-center">W</div>
                  <div className="text-center">L</div>
                  <div className="text-right">PTS</div>
                </div>

                {standings.map((row, index) => (
                  <div
                    key={row.team.id}
                    className="grid grid-cols-[28px_1fr_32px_32px_44px] items-center gap-2 border-b border-[#1e1e3a] px-3 py-3 last:border-b-0 hover:bg-[#080812]/50"
                  >
                    <div className="text-sm font-black text-[#64748b]">
                      {index + 1}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-black uppercase text-white">
                        {row.team.name}
                      </p>
                      <p className="text-[11px] font-bold text-[#64748b]">
                        RD {row.roundDiff >= 0 ? `+${row.roundDiff}` : row.roundDiff}
                      </p>
                    </div>

                    <div className="text-center text-sm font-black text-[#34d399]">
                      {row.wins}
                    </div>

                    <div className="text-center text-sm font-black text-[#ff4d6a]">
                      {row.losses}
                    </div>

                    <div className="text-right text-sm font-black text-white">
                      {row.points}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Playoff Auto Flow Rules */}
            <section className="rounded-2xl border border-[#94a3b8]/30 bg-[#0c0c18]/85 p-6 backdrop-blur-xl">
              <div className="border-b border-[#1e1e3a] pb-3">
                <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#f1f5f9]">
                  AUTOMATED SEEDING
                </p>
                <h3 className="mt-0.5 text-base font-black uppercase tracking-tight text-white">
                  Playoff Progression
                </h3>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-[#1e1e3a] bg-[#080812] p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#94a3b8]/20 text-sm font-black text-[#f1f5f9]">
                    13
                  </span>
                  <div>
                    <p className="text-sm font-black text-white">Q1 (Qualifier 1)</p>
                    <p className="text-[12px] text-[#64748b]">Group Rank #1 vs Group Rank #2</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-[#1e1e3a] bg-[#080812] p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#94a3b8]/20 text-sm font-black text-[#f1f5f9]">
                    14
                  </span>
                  <div>
                    <p className="text-sm font-black text-white">ELIM (Elimination)</p>
                    <p className="text-[12px] text-[#64748b]">Group Rank #3 vs Group Rank #4</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-[#1e1e3a] bg-[#080812] p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#94a3b8]/20 text-sm font-black text-[#f1f5f9]">
                    15
                  </span>
                  <div>
                    <p className="text-sm font-black text-white">Q2 (Qualifier 2)</p>
                    <p className="text-[12px] text-[#64748b]">Loser of M13 vs Winner of M14</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-[#ff2d55]/30 bg-[#ff2d55]/10 p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#ff2d55]/20 text-sm font-black text-[#ff4d6a]">
                    16
                  </span>
                  <div>
                    <p className="text-sm font-black text-white">GRAND FINAL (BO3)</p>
                    <p className="text-[12px] text-[#ff4d6a]">Winner of M13 vs Winner of M15</p>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>

        {/* ── Group Match Editor Modal ─────────────────────────────────────── */}
        {isEditorOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="group-match-editor-title"
            className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-md sm:p-8"
          >
            <div className="mx-auto w-full max-w-4xl rounded-2xl border border-[#1e1e3a] bg-[#0c0c18] p-6 shadow-[0_0_60px_rgba(0,0,0,0.8)] sm:p-8">
              <div className="flex items-center justify-between border-b border-[#1e1e3a] pb-4">
                <div>
                  <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#94a3b8]">
                    FIXTURE EDITOR
                  </p>
                  <h2 id="group-match-editor-title" className="mt-0.5 text-xl font-black uppercase tracking-tight text-white">
                    {editor.id ? `Edit ${editor.id}` : "Schedule New Group Match"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded-xl border border-[#1e1e3a] bg-[#080812] px-3.5 py-2 text-sm font-black uppercase text-[#94a3b8] hover:text-white"
                >
                  ✕ Close
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <label className="block">
                  <span className="mb-2 block text-[12px] font-black uppercase tracking-wider text-[#64748b]">
                    MATCH ID
                  </span>
                  <input
                    value={editor.id}
                    onChange={(e) =>
                      setEditor((curr) => ({ ...curr, id: e.target.value }))
                    }
                    disabled={Boolean(editor.id)}
                    placeholder="M01"
                    className="w-full rounded-xl border border-[#1e1e3a] bg-[#080812] px-3 py-2.5 text-sm font-bold text-white outline-none disabled:opacity-50"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[12px] font-black uppercase tracking-wider text-[#64748b]">
                    MATCH NUMBER
                  </span>
                  <select
                    value={editor.matchNumber}
                    onChange={(e) => {
                      const number = Number(e.target.value);
                      const fixture = GROUP_FIXTURES.find(
                        (item) => item.matchNumber === number,
                      );
                      const t1 = teams.find((t) => t.seed === fixture?.team1Seed);
                      const t2 = teams.find((t) => t.seed === fixture?.team2Seed);

                      setEditor((curr) => ({
                        ...curr,
                        id: curr.id || `M${String(number).padStart(2, "0")}`,
                        matchNumber: e.target.value,
                        team1Id: t1?.id ?? curr.team1Id,
                        team2Id: t2?.id ?? curr.team2Id,
                        map: fixture?.map ?? curr.map,
                      }));
                    }}
                    className="w-full rounded-xl border border-[#1e1e3a] bg-[#080812] px-3 py-2.5 text-sm font-bold text-white outline-none"
                  >
                    <option value="">Select Match</option>
                    {GROUP_FIXTURES.map((fixture) => (
                      <option key={fixture.matchNumber} value={fixture.matchNumber} className="bg-[#0c0c18]">
                        M{String(fixture.matchNumber).padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[12px] font-black uppercase tracking-wider text-[#64748b]">
                    MAP
                  </span>
                  <select
                    value={editor.map}
                    onChange={(e) =>
                      setEditor((curr) => ({ ...curr, map: e.target.value }))
                    }
                    className="w-full rounded-xl border border-[#1e1e3a] bg-[#080812] px-3 py-2.5 text-sm font-bold text-white outline-none"
                  >
                    {["TBD", ...activeGame.maps.map((m) => m.name)].map(
                      (mapName) => (
                        <option key={mapName} value={mapName} className="bg-[#0c0c18]">
                          {mapName}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[12px] font-black uppercase tracking-wider text-[#64748b]">
                    BEST OF
                  </span>
                  <select
                    value={editor.bestOf}
                    onChange={(e) =>
                      setEditor((curr) => ({ ...curr, bestOf: e.target.value }))
                    }
                    className="w-full rounded-xl border border-[#1e1e3a] bg-[#080812] px-3 py-2.5 text-sm font-bold text-white outline-none"
                  >
                    <option value="1" className="bg-[#0c0c18]">BO1</option>
                    <option value="3" className="bg-[#0c0c18]">BO3</option>
                    <option value="5" className="bg-[#0c0c18]">BO5</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[12px] font-black uppercase tracking-wider text-[#64748b]">
                    TEAM 1
                  </span>
                  <select
                    value={editor.team1Id}
                    onChange={(e) =>
                      setEditor((curr) => ({ ...curr, team1Id: e.target.value }))
                    }
                    className="w-full rounded-xl border border-[#1e1e3a] bg-[#080812] px-3 py-2.5 text-sm font-bold text-white outline-none"
                  >
                    <option value="" className="bg-[#0c0c18]">Select Team</option>
                    {sortedTeams.map((team) => (
                      <option key={team.id} value={team.id} className="bg-[#0c0c18]">
                        #{team.seed} {team.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[12px] font-black uppercase tracking-wider text-[#64748b]">
                    TEAM 2
                  </span>
                  <select
                    value={editor.team2Id}
                    onChange={(e) =>
                      setEditor((curr) => ({ ...curr, team2Id: e.target.value }))
                    }
                    className="w-full rounded-xl border border-[#1e1e3a] bg-[#080812] px-3 py-2.5 text-sm font-bold text-white outline-none"
                  >
                    <option value="" className="bg-[#0c0c18]">Select Team</option>
                    {sortedTeams.map((team) => (
                      <option key={team.id} value={team.id} className="bg-[#0c0c18]">
                        #{team.seed} {team.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[12px] font-black uppercase tracking-wider text-[#64748b]">
                    TEAM 1 SCORE
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={editor.team1Score}
                    onChange={(e) =>
                      setEditor((curr) => ({ ...curr, team1Score: e.target.value }))
                    }
                    className="w-full rounded-xl border border-[#1e1e3a] bg-[#080812] px-3 py-2.5 text-sm font-bold text-white outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[12px] font-black uppercase tracking-wider text-[#64748b]">
                    TEAM 2 SCORE
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={editor.team2Score}
                    onChange={(e) =>
                      setEditor((curr) => ({ ...curr, team2Score: e.target.value }))
                    }
                    className="w-full rounded-xl border border-[#1e1e3a] bg-[#080812] px-3 py-2.5 text-sm font-bold text-white outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[12px] font-black uppercase tracking-wider text-[#64748b]">
                    STATUS
                  </span>
                  <select
                    value={editor.status}
                    onChange={(e) =>
                      setEditor((curr) => ({
                        ...curr,
                        status: e.target.value as MatchStatus,
                      }))
                    }
                    className="w-full rounded-xl border border-[#1e1e3a] bg-[#080812] px-3 py-2.5 text-sm font-bold text-white outline-none"
                  >
                    <option value="Scheduled" className="bg-[#0c0c18]">Scheduled</option>
                    <option value="Live" className="bg-[#0c0c18]">Live</option>
                    <option value="Completed" className="bg-[#0c0c18]">Completed</option>
                    <option value="Cancelled" className="bg-[#0c0c18]">Cancelled</option>
                  </select>
                </label>

                <label className="block md:col-span-2 lg:col-span-3">
                  <span className="mb-2 block text-[12px] font-black uppercase tracking-wider text-[#64748b]">
                    SCHEDULE (DATE & TIME)
                  </span>
                  <input
                    type="datetime-local"
                    value={editor.scheduledAt}
                    onChange={(e) =>
                      setEditor((curr) => ({ ...curr, scheduledAt: e.target.value }))
                    }
                    className="w-full rounded-xl border border-[#1e1e3a] bg-[#080812] px-3 py-2.5 text-sm font-bold text-white outline-none"
                  />
                </label>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-[#1e1e3a] pt-5">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded-xl border border-[#1e1e3a] bg-[#080812] px-5 py-3 text-sm font-black uppercase tracking-wider text-[#94a3b8] hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveGroupMatch}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#ff2d55]/40 bg-[#ff2d55] px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-[0_0_20px_rgba(255,45,85,0.25)] transition hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Saving...</span>
                    </>
                  ) : editor.id ? (
                    "Update Group Match"
                  ) : (
                    "Create Group Match"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

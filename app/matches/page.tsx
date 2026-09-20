"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Match, MatchStatus } from "@/app/data/matches";
import type { Team } from "@/app/data/teams";

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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");

  const [activeSection, setActiveSection] = useState<
    "group" | "phase2"
  >("group");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [teamsResponse, matchesResponse] = await Promise.all([
        fetch("/api/teams", {
          cache: "no-store",
        }),
        fetch("/api/matches", {
          cache: "no-store",
        }),
      ]);

      const teamsData = await teamsResponse.json();
      const matchesData = await matchesResponse.json();

      if (!teamsResponse.ok) {
        throw new Error(
          teamsData.error || "Failed to load teams.",
        );
      }

      if (!matchesResponse.ok) {
        throw new Error(
          matchesData.error || "Failed to load matches.",
        );
      }

      setTeams(teamsData.teams ?? []);
      setMatches(
        (matchesData.matches ?? []).map(normalizeMatch),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load tournament data.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
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
    const source =
      activeSection === "group"
        ? groupMatches
        : phase2Matches;

    return source.filter((match) => {
      const query = search.trim().toLowerCase();

      const team1 =
        teams.find((team) => team.id === match.team1Id)
          ?.name ?? "TBD";

      const team2 =
        teams.find((team) => team.id === match.team2Id)
          ?.name ?? "TBD";

      const matchesSearch =
        !query ||
        match.id.toLowerCase().includes(query) ||
        team1.toLowerCase().includes(query) ||
        team2.toLowerCase().includes(query) ||
        match.map.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        match.status === statusFilter;

      const matchesStage =
        stageFilter === "All" ||
        match.stage === stageFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesStage
      );
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

    return (
      teams.find((team) => team.id === teamId)?.name ??
      "TBD"
    );
  }

  function resetEditor() {
    setEditor(emptyEditor);
    setMessage("");
    setError("");
  }

  function startNewGroupMatch() {
    const nextFixture = GROUP_FIXTURES.find(
      (fixture) =>
        !matches.some(
          (match) =>
            match.matchNumber === fixture.matchNumber,
        ),
    );

    if (!nextFixture) {
      setError(
        "All 12 Group Stage matches already exist. Phase 2 is automatic.",
      );
      return;
    }

    const team1 = teams.find(
      (team) => team.seed === nextFixture.team1Seed,
    );

    const team2 = teams.find(
      (team) => team.seed === nextFixture.team2Seed,
    );

    setEditor({
      id: `M${String(nextFixture.matchNumber).padStart(
        2,
        "0",
      )}`,
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
      scheduledAt: toDateTimeLocal(
        match.scheduledAt,
      ),
      map: match.map,
      bestOf: String(match.bestOf),
      team1Score: String(match.team1Score),
      team2Score: String(match.team2Score),
      status: match.status,
    });

    setActiveSection("group");
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

    if (
      editor.status === "Completed" &&
      score1 === score2
    ) {
      setError(
        "A completed Valorant match cannot have a tied final score.",
      );
      return;
    }

    const existing = matches.find(
      (match) =>
        match.matchNumber === matchNumber,
    );

    if (
      existing &&
      editor.id !== existing.id
    ) {
      setError(
        `M${String(matchNumber).padStart(
          2,
          "0",
        )} already exists.`,
      );
      return;
    }

    const payload = {
      id:
        editor.id ||
        `M${String(matchNumber).padStart(2, "0")}`,
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
      playerStats:
        existing?.playerStats ?? [],
    };

    try {
      setSaving(true);

      const response = existing
        ? await fetch(
            `/api/matches/${encodeURIComponent(
              existing.id,
            )}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            },
          )
        : await fetch("/api/matches", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to save match.",
        );
      }

      setMessage(
        existing
          ? `${payload.id} updated successfully.`
          : `${payload.id} created successfully.`,
      );

      resetEditor();

      await loadData();

      /*
       * Phase 2 is checked after every Group Stage save.
       * This makes progression automatic without requiring
       * the admin to manually create M13–M16.
       */
      await generateAutomaticPhase2();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save match.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function createAutomaticMatch(
    matchNumber: number,
    stage: string,
    team1Id: string,
    team2Id: string,
    existing?: Match,
  ) {
    if (!team1Id || !team2Id) {
      return;
    }

    const id =
      existing?.id ||
      `M${String(matchNumber).padStart(2, "0")}`;

    const payload = {
      id,
      matchNumber,
      stage,
      team1Id,
      team2Id,
      scheduledAt: existing?.scheduledAt || "",
      map: existing?.map || "TBD",
      bestOf: existing?.bestOf || 3,
      team1Score: existing?.team1Score || 0,
      team2Score: existing?.team2Score || 0,
      status: existing?.status || "Scheduled",
      winnerId: existing?.winnerId,
      mvpPlayerId: existing?.mvpPlayerId,
      topFraggerPlayerId:
        existing?.topFraggerPlayerId,
      playerStats: existing?.playerStats || [],
    };

    const response = existing
      ? await fetch(
          `/api/matches/${encodeURIComponent(existing.id)}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        )
      : await fetch("/api/matches", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          `Failed to create ${matchLabel(matchNumber)}.`,
      );
    }
  }

  async function generateAutomaticPhase2() {
    if (generating) return;

    try {
      setGenerating(true);
      setError("");

      const latestMatchesResponse =
        await fetch("/api/matches", {
          cache: "no-store",
        });

      const latestMatchesData =
        await latestMatchesResponse.json();

      if (!latestMatchesResponse.ok) {
        throw new Error(
          latestMatchesData.error ||
            "Failed to refresh matches.",
        );
      }

      const currentMatches: Match[] = (
        latestMatchesData.matches ?? []
      ).map(normalizeMatch);

      const currentGroupMatches =
        currentMatches.filter(
          (match) =>
            match.stage === "Group Stage" &&
            match.matchNumber >= 1 &&
            match.matchNumber <= 12,
        );

      const completed = currentGroupMatches.filter(
        (match) => match.status === "Completed",
      );

      /*
       * NOTHING in Phase 2 is generated until all
       * twelve Group Stage matches are completed.
       */
      if (
        teams.length !== 4 ||
        completed.length !== 12
      ) {
        return;
      }

      const currentStandings =
        calculateStandings(
          teams,
          currentMatches,
        );

      if (currentStandings.length !== 4) {
        return;
      }

      const first = currentStandings[0].team.id;
      const second = currentStandings[1].team.id;
      const third = currentStandings[2].team.id;
      const fourth = currentStandings[3].team.id;

      /*
       * M13 — Qualifier 1
       * #1 vs #2
       */
      const m13 = currentMatches.find(
        (match) => match.matchNumber === 13,
      );

      await createAutomaticMatch(
        13,
        "Qualifiers",
        first,
        second,
        m13,
      );

      /*
       * M14 — Elimination
       * #3 vs #4
       */
      const m14 = currentMatches.find(
        (match) => match.matchNumber === 14,
      );

      await createAutomaticMatch(
        14,
        "Qualifiers",
        third,
        fourth,
        m14,
      );

      /*
       * Refresh so we have the latest M13/M14
       * completion states.
       */
      const refreshedResponse =
        await fetch("/api/matches", {
          cache: "no-store",
        });

      const refreshedData =
        await refreshedResponse.json();

      if (!refreshedResponse.ok) {
        throw new Error(
          refreshedData.error ||
            "Failed to refresh Phase 2.",
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

      /*
       * M15 only exists after BOTH M13 and M14
       * have been completed.
       */
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

        const winnerOfM14 =
          elimination.winnerId;

        if (
          loserOfM13 &&
          winnerOfM14
        ) {
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

      /*
       * Refresh again to check whether M15
       * has completed.
       */
      const finalRefreshResponse =
        await fetch("/api/matches", {
          cache: "no-store",
        });

      const finalRefreshData =
        await finalRefreshResponse.json();

      if (!finalRefreshResponse.ok) {
        throw new Error(
          finalRefreshData.error ||
            "Failed to refresh Grand Final progression.",
        );
      }

      const finalMatches: Match[] = (
        finalRefreshData.matches ?? []
      ).map(normalizeMatch);

      const finalM13 = finalMatches.find(
        (match) => match.matchNumber === 13,
      );

      const finalM15 = finalMatches.find(
        (match) => match.matchNumber === 15,
      );

      /*
       * M16 — Grand Final
       *
       * Winner M13 vs Winner M15
       *
       * M16 is generated only after both
       * prerequisite matches are completed.
       */
      if (
        finalM13?.status === "Completed" &&
        finalM15?.status === "Completed" &&
        finalM13.winnerId &&
        finalM15.winnerId
      ) {
        const m16 = finalMatches.find(
          (match) => match.matchNumber === 16,
        );

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
      setError(
        "Automatic Phase 2 matches cannot be deleted manually.",
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete ${matchLabel(
        match.matchNumber,
      )}? This cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/matches/${encodeURIComponent(match.id)}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete match.",
        );
      }

      setMessage(
        `${matchLabel(
          match.matchNumber,
        )} deleted successfully.`,
      );

      if (editor.id === match.id) {
        resetEditor();
      }

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete match.",
      );
    }
  }

  async function refreshAndProgress() {
    setMessage("");
    setError("");

    await loadData();
    await generateAutomaticPhase2();
  }

  function statusClass(status: MatchStatus) {
    if (status === "Completed") {
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
    }

    if (status === "Live") {
      return "border-red-500/40 bg-red-500/10 text-red-300";
    }

    if (status === "Cancelled") {
      return "border-zinc-600 bg-zinc-800 text-zinc-400";
    }

    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050810] text-white"><div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(255,49,88,0.13),transparent_24%),radial-gradient(circle_at_90%_15%,rgba(39,217,255,0.11),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(139,92,246,0.11),transparent_35%)]" />
      <div className="relative mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="flex flex-col gap-4 border-b border-[#2b3d58] pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-[#52e2ff]">
                VALORANT TOURNAMENT
              </div>

              <h1 className="bg-gradient-to-r from-white via-[#ffdce4] to-[#ff5275] bg-clip-text text-3xl font-black text-white uppercase tracking-tight text-transparent sm:text-4xl">
                MATCH CENTER
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-[#8195b0]">
                Create and manage the 12 Group Stage
                fixtures. Qualifiers and the Grand Final
                are generated automatically from completed
                results.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin"
                className="rounded-xl border border-[#2b3d58] bg-[#0b1220] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#a9b8cc] transition hover:border-[#52e2ff]/50 hover:bg-[#52e2ff]/[0.06] hover:text-[#52e2ff]"
              >
                ADMIN HUB
              </Link>

              <Link
                href="/teams"
                className="rounded-xl border border-[#2b3d58] bg-[#0b1220] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#a9b8cc] transition hover:border-[#52e2ff]/50 hover:bg-[#52e2ff]/[0.06] hover:text-[#52e2ff]"
              >
                TEAMS
              </Link>

              <Link
                href="/tournament"
                className="rounded-xl border border-[#ff3158]/40 bg-[#ff3158]/10 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#ff6b86] transition hover:bg-[#ff3158]/20"
              >
                PUBLIC SITE ↗
              </Link>
            </div>
          </div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-[#263750] bg-gradient-to-br from-[#0d1522] via-[#0a1019] to-[#111020] p-5 shadow-[0_10px_35px_rgba(0,0,0,0.20)]">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#52e2ff]">
              TEAMS
            </div>
            <div className="mt-2 text-3xl font-black text-white">
              {teams.length}
            </div>
          </div>

          <div className="rounded-2xl border border-[#263750] bg-gradient-to-br from-[#0d1522] via-[#0a1019] to-[#111020] p-5 shadow-[0_10px_35px_rgba(0,0,0,0.20)]">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#52e2ff]">
              GROUP MATCHES
            </div>
            <div className="mt-2 text-3xl font-black text-white">
              {groupMatches.length}
              <span className="ml-2 text-sm text-[#7187a3]">
                / 12
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#263750] bg-gradient-to-br from-[#0d1522] via-[#0a1019] to-[#111020] p-5 shadow-[0_10px_35px_rgba(0,0,0,0.20)]">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#52e2ff]">
              GROUP COMPLETED
            </div>
            <div className="mt-2 text-3xl font-black text-white">
              {completedGroupMatches}
              <span className="ml-2 text-sm text-[#7187a3]">
                / 12
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#263750] bg-gradient-to-br from-[#0d1522] via-[#0a1019] to-[#111020] p-5 shadow-[0_10px_35px_rgba(0,0,0,0.20)]">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#52e2ff]">
              PHASE 2
            </div>
            <div className="mt-2 text-3xl font-black text-white">
              {phase2Matches.length}
              <span className="ml-2 text-sm text-[#7187a3]">
                / 4
              </span>
            </div>
          </div>

          <div
            className={`rounded-xl border p-5 ${
              groupStageComplete
                ? "border-emerald-400/30 bg-emerald-400/10"
                : "border-[#1d2a3b] bg-[#0d131d]"
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#52e2ff]">
              TOURNAMENT FLOW
            </div>
            <div
              className={`mt-2 text-sm font-black ${
                groupStageComplete
                  ? "text-emerald-300"
                  : "text-[#c8d3e1]"
              }`}
            >
              {groupStageComplete
                ? "PHASE 2 READY"
                : "GROUP STAGE ACTIVE"}
            </div>
          </div>
        </section>

        <section className="mb-6 overflow-hidden rounded-2xl border border-[#2b3d58] bg-gradient-to-br from-[#0d1522] via-[#0a1019] to-[#111020] shadow-[0_15px_50px_rgba(0,0,0,0.22)]">
          <div className="border-b border-white/[0.07] bg-white/[0.015] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-black uppercase">
                  TOURNAMENT PROGRESSION
                </h2>
                <p className="mt-1 text-xs text-[#8195b0]">
                  Phase 2 is controlled entirely by completed
                  results.
                </p>
              </div>

              <button
                type="button"
                onClick={refreshAndProgress}
                disabled={generating}
                className="rounded-xl border border-[#52e2ff]/30 bg-[#52e2ff]/[0.06] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#9eeeff] transition hover:border-[#52e2ff]/60 hover:bg-[#52e2ff]/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating
                  ? "CHECKING..."
                  : "CHECK AUTO PROGRESSION"}
              </button>
            </div>
          </div>

          <div className="grid gap-px bg-[#263750] sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                number: "01",
                title: "GROUP STAGE",
                text: "M01–M12",
                active: !groupStageComplete,
              },
              {
                number: "02",
                title: "QUALIFIERS",
                text: "M13–M14",
                active:
                  groupStageComplete &&
                  phase2Matches.length < 2,
              },
              {
                number: "03",
                title: "LOWER QUALIFIER",
                text: "M15",
                active:
                  phase2Matches.some(
                    (match) =>
                      match.matchNumber === 13 &&
                      match.status === "Completed",
                  ) &&
                  phase2Matches.some(
                    (match) =>
                      match.matchNumber === 14 &&
                      match.status === "Completed",
                  ),
              },
              {
                number: "04",
                title: "GRAND FINAL",
                text: "M16",
                active:
                  phase2Matches.some(
                    (match) =>
                      match.matchNumber === 15 &&
                      match.status === "Completed",
                  ),
              },
            ].map((step) => (
              <div
                key={step.number}
                className="bg-[#0b111a] p-5"
              >
                <div className="text-xs font-black text-[#ff5275]">
                  {step.number}
                </div>
                <div className="mt-2 text-sm font-black">
                  {step.title}
                </div>
                <div className="mt-1 text-xs text-[#8195b0]">
                  {step.text}
                </div>

                <div
                  className={`mt-4 inline-flex rounded-full border px-2 py-1 text-[9px] font-black tracking-wider ${
                    step.active
                      ? "border-[#ff3158]/35 bg-[#ff3158]/10 text-[#ff6b86]"
                      : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                  }`}
                >
                  {step.active
                    ? "ACTIVE"
                    : "READY / COMPLETE"}
                </div>
              </div>
            ))}
          </div>
        </section>

        {error && (
          <div className="mb-5 rounded-xl border border-[#ff3158]/30 bg-[#ff3158]/10 px-4 py-3 text-sm text-[#ff8da3] shadow-[0_0_25px_rgba(255,49,88,0.06)]">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
            {message}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
          <section className="min-w-0">
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-[#2b3d58] bg-gradient-to-r from-[#0d1522] to-[#101020] p-4 shadow-[0_10px_35px_rgba(0,0,0,0.18)] lg:flex-row lg:items-center lg:justify-between">
              <div className="flex rounded-xl border border-[#2b3d58] bg-[#060b14] p-1">
                <button
                  type="button"
                  onClick={() =>
                    setActiveSection("group")
                  }
                  className={`rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-wider ${
                    activeSection === "group"
                      ? "bg-gradient-to-r from-[#ff3158] to-[#ff5275] text-white shadow-[0_0_20px_rgba(255,49,88,0.18)]"
                      : "text-[#7d8ea5]"
                  }`}
                >
                  GROUP STAGE
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveSection("phase2")
                  }
                  className={`rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-wider ${
                    activeSection === "phase2"
                      ? "bg-gradient-to-r from-[#ff3158] to-[#ff5275] text-white shadow-[0_0_20px_rgba(255,49,88,0.18)]"
                      : "text-[#7d8ea5]"
                  }`}
                >
                  AUTO PHASE 2
                </button>
              </div>

              <button
                type="button"
                onClick={startNewGroupMatch}
                disabled={
                  teams.length !== 4 ||
                  groupMatches.length >= 12
                }
                className="rounded-xl bg-gradient-to-r from-[#ff3158] to-[#ff5275] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white shadow-[0_0_22px_rgba(255,49,88,0.18)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                + NEW GROUP MATCH
              </button>
            </div>

            <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_180px]">
              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search match, team or map..."
                className="rounded-xl border border-[#2b3d58] bg-[#060b14] px-4 py-3 text-sm text-white outline-none placeholder:text-[#53647b] transition focus:border-[#52e2ff]/60 focus:ring-1 focus:ring-[#52e2ff]/15"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="rounded-xl border border-[#2b3d58] bg-[#060b14] px-4 py-3 text-sm text-white outline-none transition focus:border-[#52e2ff]/60 focus:ring-1 focus:ring-[#52e2ff]/15"
              >
                <option value="All">
                  All Statuses
                </option>
                <option value="Scheduled">
                  Scheduled
                </option>
                <option value="Live">
                  Live
                </option>
                <option value="Completed">
                  Completed
                </option>
                <option value="Cancelled">
                  Cancelled
                </option>
              </select>

              <select
                value={stageFilter}
                onChange={(event) =>
                  setStageFilter(event.target.value)
                }
                className="rounded-xl border border-[#2b3d58] bg-[#060b14] px-4 py-3 text-sm text-white outline-none transition focus:border-[#52e2ff]/60 focus:ring-1 focus:ring-[#52e2ff]/15"
              >
                <option value="All">
                  All Stages
                </option>
                <option value="Group Stage">
                  Group Stage
                </option>
                <option value="Qualifiers">
                  Qualifiers
                </option>
                <option value="Grand Final">
                  Grand Final
                </option>
              </select>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="rounded-xl border border-[#1d2a3b] bg-[#0b111a] p-10 text-center text-sm text-[#71839a]">
                  Loading matches...
                </div>
              ) : filteredMatches.length === 0 ? (
                <div className="rounded-xl border border-[#1d2a3b] bg-[#0b111a] p-10 text-center">
                  <div className="text-sm font-black">
                    No matches found
                  </div>
                  <div className="mt-2 text-xs text-[#667991]">
                    {activeSection === "group"
                      ? "Create the Group Stage fixtures M01–M12."
                      : "Phase 2 matches will appear automatically."}
                  </div>
                </div>
              ) : (
                filteredMatches.map((match) => {
                  const isAutomatic =
                    match.matchNumber >= 13;

                  return (
                    <div
                      key={match.id}
                      className="rounded-2xl border border-[#263750] bg-gradient-to-br from-[#0d1522] to-[#0a1019] p-5 shadow-[0_10px_35px_rgba(0,0,0,0.18)]"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="min-w-[58px] rounded-xl border border-[#52e2ff]/25 bg-[#060b14] px-2 py-2 text-center shadow-[0_0_18px_rgba(39,217,255,0.06)]">
                            <div className="text-[9px] font-black uppercase tracking-wider text-[#52e2ff]">
                              MATCH
                            </div>
                            <div className="mt-1 text-sm font-black">
                              {matchLabel(
                                match.matchNumber,
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs font-black uppercase tracking-wider text-[#ff5275]">
                              {isAutomatic
                                ? phaseLabel(
                                    match.matchNumber,
                                  )
                                : "GROUP STAGE"}
                            </div>

                            <div className="mt-1 text-[11px] text-[#8195b0]">
                              {match.map} · BO{match.bestOf}
                            </div>
                          </div>

                          {isAutomatic && (
                            <span className="rounded-full border border-purple-400/35 bg-purple-500/10 px-2 py-1 text-[9px] font-black text-purple-300 text-purple-300">
                              AUTO
                            </span>
                          )}
                        </div>

                        <span
                          className={`w-fit rounded-full border px-3 py-1 text-[10px] font-black ${statusClass(
                            match.status,
                          )}`}
                        >
                          {match.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="mt-5 grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
                        <div className="rounded-lg border border-[#1d2a3b] bg-[#0e151f] p-4 md:text-right">
                          <div className="text-sm font-black">
                            {getTeamName(
                              match.team1Id,
                            )}
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-3xl font-black text-white tracking-wider">
                            {match.team1Score}
                            <span className="mx-2 text-[#45566e]">
                              :
                            </span>
                            {match.team2Score}
                          </div>

                          {match.winnerId && (
                            <div className="mt-1 text-[9px] font-black tracking-wider text-emerald-400">
                              WINNER:{" "}
                              {getTeamName(
                                match.winnerId,
                              )}
                            </div>
                          )}
                        </div>

                        <div className="rounded-lg border border-[#1d2a3b] bg-[#0e151f] p-4">
                          <div className="text-sm font-black">
                            {getTeamName(
                              match.team2Id,
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#1b2737] pt-4">
                        <div className="text-xs text-[#667991]">
                          {match.scheduledAt
                            ? new Date(
                                match.scheduledAt,
                              ).toLocaleString()
                            : "Schedule TBD"}
                        </div>

                        {!isAutomatic ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                editMatch(match)
                              }
                              className="rounded border border-[#304159] bg-[#111a27] px-3 py-2 text-[10px] font-black text-[#bdcde0] hover:bg-[#182435]"
                            >
                              EDIT
                            </button>

                            <Link
                              href={`/matches/${encodeURIComponent(
                                match.id,
                              )}`}
                              className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-[10px] font-black text-red-300 hover:bg-red-500/15"
                            >
                              RESULT
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                deleteGroupMatch(
                                  match,
                                )
                              }
                              className="rounded-xl border border-[#ff3158]/30 bg-[#ff3158]/10 px-3 py-2 text-[10px] font-black text-[#ff6b86] transition hover:bg-[#ff3158]/20"
                            >
                              DELETE
                            </button>
                          </div>
                        ) : (
                          <Link
                            href={`/matches/${encodeURIComponent(
                              match.id,
                            )}`}
                            className="rounded-xl border border-purple-400/30 bg-purple-500/10 px-3 py-2 text-[10px] font-black text-purple-300"
                          >
                            VIEW RESULT
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-[#263750] bg-gradient-to-br from-[#0d1522] to-[#0a1019] p-5 shadow-[0_10px_35px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black uppercase">
                    GROUP STANDINGS
                  </h2>
                  <p className="mt-1 text-[10px] text-[#65778f]">
                    3 points per win · RD tiebreak
                  </p>
                </div>

                <span className="rounded-lg border border-[#52e2ff]/25 bg-[#52e2ff]/[0.05] px-2 py-1 text-[9px] font-black text-[#72e9ff]">
                  LIVE
                </span>
              </div>

              <div className="mt-5 overflow-hidden rounded-lg border border-[#1d2a3b]">
                <div className="grid grid-cols-[30px_1fr_34px_34px_45px] gap-2 border-b border-[#1d2a3b] bg-[#101722] px-3 py-2 text-[8px] font-black tracking-wider text-[#62748c]">
                  <div>#</div>
                  <div>TEAM</div>
                  <div>W</div>
                  <div>L</div>
                  <div>PTS</div>
                </div>

                {standings.map(
                  (row, index) => (
                    <div
                      key={row.team.id}
                      className="grid grid-cols-[30px_1fr_34px_34px_45px] gap-2 border-b border-[#151f2d] px-3 py-3 last:border-b-0"
                    >
                      <div className="text-xs font-black text-[#71839b]">
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-xs font-black">
                          {row.team.name}
                        </div>
                        <div className="mt-1 text-[8px] text-[#5f7189]">
                          RD {row.roundDiff >= 0 ? "+" : ""}
                          {row.roundDiff}
                        </div>
                      </div>

                      <div className="text-xs font-black text-emerald-300">
                        {row.wins}
                      </div>

                      <div className="text-xs font-black text-red-300">
                        {row.losses}
                      </div>

                      <div className="text-xs font-black">
                        {row.points}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-purple-400/25 bg-gradient-to-br from-purple-500/[0.10] via-[#0b111a] to-cyan-500/[0.05] p-5 shadow-[0_12px_40px_rgba(139,92,246,0.08)]">
              <div className="text-[10px] font-black tracking-[0.2em] text-purple-300">
                AUTOMATIC FLOW
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-purple-500/15 text-[10px] font-black text-purple-300">
                    13
                  </div>
                  <div>
                    <div className="text-xs font-black">
                      Q1
                    </div>
                    <div className="mt-1 text-[10px] text-[#70829a]">
                      Group #1 vs #2
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-purple-500/15 text-[10px] font-black text-purple-300">
                    14
                  </div>
                  <div>
                    <div className="text-xs font-black">
                      ELIMINATION
                    </div>
                    <div className="mt-1 text-[10px] text-[#70829a]">
                      Group #3 vs #4
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-purple-500/15 text-[10px] font-black text-purple-300">
                    15
                  </div>
                  <div>
                    <div className="text-xs font-black">
                      Q2
                    </div>
                    <div className="mt-1 text-[10px] text-[#70829a]">
                      Loser Q1 vs Winner Elimination
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-red-500/15 text-[10px] font-black text-red-300">
                    16
                  </div>
                  <div>
                    <div className="text-xs font-black">
                      GRAND FINAL
                    </div>
                    <div className="mt-1 text-[10px] text-[#70829a]">
                      Winner Q1 vs Winner Q2
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#263750] bg-gradient-to-br from-[#0d1522] to-[#0a1019] p-5 shadow-[0_10px_35px_rgba(0,0,0,0.18)]">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#52e2ff]">
                ADMIN RULES
              </div>

              <ul className="mt-4 space-y-3 text-xs leading-5 text-[#8495aa]">
                <li>
                  <span className="font-black text-white">
                    01.
                  </span>{" "}
                  Only M01–M12 can be created manually.
                </li>

                <li>
                  <span className="font-black text-white">
                    02.
                  </span>{" "}
                  M13 and M14 appear after all 12 Group
                  Stage matches are completed.
                </li>

                <li>
                  <span className="font-black text-white">
                    03.
                  </span>{" "}
                  M15 appears after M13 and M14 are
                  completed.
                </li>

                <li>
                  <span className="font-black text-white">
                    04.
                  </span>{" "}
                  M16 appears after M13 and M15 are
                  completed.
                </li>

                <li>
                  <span className="font-black text-white">
                    05.
                  </span>{" "}
                  Phase 2 team assignments are determined
                  automatically from results.
                </li>
              </ul>
            </section>
          </aside>
        </div>

                <footer className="mt-8 border-t border-[#263750] pt-5 text-center text-[10px] font-black uppercase tracking-wider text-[#617994]">
          GROUP STAGE: M01–M12 MANUAL · M13–M16 AUTOMATIC
        </footer>
      </div>
    </main>
  );
}
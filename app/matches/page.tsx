"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { Match, MatchStatus } from "@/app/data/matches";
import type { Team } from "@/app/data/teams";

const MATCHES_STORAGE_KEY = "tournament-matches";
const TEAMS_STORAGE_KEY = "tournament-teams";

const STAGES = [
  "Group Stage",
  "Qualifier 1",
  "Eliminator",
  "Qualifier 2",
  "Grand Final",
];

const MAPS = [
  "TBD",
  "Ascent",
  "Bind",
  "Breeze",
  "Haven",
  "Lotus",
  "Split",
  "Sunset",
  "Icebox",
  "Pearl",
  "Fracture",
];

const STATUS_OPTIONS: MatchStatus[] = [
  "Scheduled",
  "Live",
  "Cancelled",
];

type ModalMode = "create" | "edit" | null;

type FormState = {
  stage: string;
  team1Id: string;
  team2Id: string;
  map: string;
  bestOf: number;
  status: MatchStatus;
  scheduledAt: string;
};

function toDateTimeLocal(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (number: number) =>
    String(number).padStart(2, "0");

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function fromDateTimeLocal(value: string) {
  if (!value) {
    return new Date().toISOString();
  }

  return new Date(value).toISOString();
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function getNextMatchNumber(matches: Match[]) {
  if (matches.length === 0) {
    return 1;
  }

  return (
    Math.max(...matches.map((match) => match.matchNumber)) +
    1
  );
}

function calculateGroupStandings(
  matches: Match[],
  teams: Team[]
) {
  const completed = matches.filter(
    (match) =>
      match.stage === "Group Stage" &&
      match.status === "Completed" &&
      match.winnerId
  );

  const table = teams.map((team) => ({
    team,
    wins: 0,
    losses: 0,
  }));

  for (const match of completed) {
    const row = table.find(
      (item) => item.team.id === match.winnerId
    );

    if (row) {
      row.wins += 1;
    }

    const loserId =
      match.winnerId === match.team1Id
        ? match.team2Id
        : match.team1Id;

    const loserRow = table.find(
      (item) => item.team.id === loserId
    );

    if (loserRow) {
      loserRow.losses += 1;
    }
  }

  return table.sort((a, b) => {
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }

    if (a.losses !== b.losses) {
      return a.losses - b.losses;
    }

    return a.team.seed - b.team.seed;
  });
}

function synchronizePhase2(
  matches: Match[],
  teams: Team[]
): Match[] {
  const nextMatches = [...matches];

  const groupMatches = nextMatches.filter(
    (match) =>
      match.stage === "Group Stage" &&
      match.status === "Completed"
  );

  if (groupMatches.length < 12) {
    return nextMatches;
  }

  const standings = calculateGroupStandings(
    nextMatches,
    teams
  );

  if (standings.length < 4) {
    return nextMatches;
  }

  const rank1 = standings[0]?.team;
  const rank2 = standings[1]?.team;
  const rank3 = standings[2]?.team;
  const rank4 = standings[3]?.team;

  if (!rank1 || !rank2 || !rank3 || !rank4) {
    return nextMatches;
  }

  let qualifier1 = nextMatches.find(
    (match) => match.stage === "Qualifier 1"
  );

  let eliminator = nextMatches.find(
    (match) => match.stage === "Eliminator"
  );

  if (!qualifier1) {
    qualifier1 = {
      id: createId("q1"),
      matchNumber: getNextMatchNumber(nextMatches),
      stage: "Qualifier 1",
      team1Id: rank1.id,
      team2Id: rank2.id,
      scheduledAt: new Date().toISOString(),
      map: "TBD",
      bestOf: 3,
      team1Score: 0,
      team2Score: 0,
      status: "Scheduled",
      playerStats: [],
      createdAt: new Date().toISOString(),
    };

    nextMatches.push(qualifier1);
  } else if (qualifier1.status !== "Completed") {
    qualifier1 = {
      ...qualifier1,
      team1Id: rank1.id,
      team2Id: rank2.id,
    };

    const index = nextMatches.findIndex(
      (match) => match.id === qualifier1!.id
    );

    if (index !== -1) {
      nextMatches[index] = qualifier1;
    }
  }

  if (!eliminator) {
    eliminator = {
      id: createId("elim"),
      matchNumber: getNextMatchNumber(nextMatches),
      stage: "Eliminator",
      team1Id: rank3.id,
      team2Id: rank4.id,
      scheduledAt: new Date().toISOString(),
      map: "TBD",
      bestOf: 3,
      team1Score: 0,
      team2Score: 0,
      status: "Scheduled",
      playerStats: [],
      createdAt: new Date().toISOString(),
    };

    nextMatches.push(eliminator);
  } else if (eliminator.status !== "Completed") {
    eliminator = {
      ...eliminator,
      team1Id: rank3.id,
      team2Id: rank4.id,
    };

    const index = nextMatches.findIndex(
      (match) => match.id === eliminator!.id
    );

    if (index !== -1) {
      nextMatches[index] = eliminator;
    }
  }

  qualifier1 = nextMatches.find(
    (match) => match.stage === "Qualifier 1"
  );

  eliminator = nextMatches.find(
    (match) => match.stage === "Eliminator"
  );

  if (
    qualifier1?.status === "Completed" &&
    qualifier1.winnerId &&
    eliminator?.status === "Completed" &&
    eliminator.winnerId
  ) {
    const q1LoserId =
      qualifier1.winnerId === qualifier1.team1Id
        ? qualifier1.team2Id
        : qualifier1.team1Id;

    const q2Team1 = q1LoserId;
    const q2Team2 = eliminator.winnerId;

    let qualifier2 = nextMatches.find(
      (match) => match.stage === "Qualifier 2"
    );

    if (!qualifier2) {
      qualifier2 = {
        id: createId("q2"),
        matchNumber: getNextMatchNumber(nextMatches),
        stage: "Qualifier 2",
        team1Id: q2Team1,
        team2Id: q2Team2,
        scheduledAt: new Date().toISOString(),
        map: "TBD",
        bestOf: 3,
        team1Score: 0,
        team2Score: 0,
        status: "Scheduled",
        playerStats: [],
        createdAt: new Date().toISOString(),
      };

      nextMatches.push(qualifier2);
    } else if (qualifier2.status !== "Completed") {
      qualifier2 = {
        ...qualifier2,
        team1Id: q2Team1,
        team2Id: q2Team2,
      };

      const index = nextMatches.findIndex(
        (match) => match.id === qualifier2!.id
      );

      if (index !== -1) {
        nextMatches[index] = qualifier2;
      }
    }
  }

  const currentQualifier2 = nextMatches.find(
    (match) => match.stage === "Qualifier 2"
  );

  if (
    qualifier1?.status === "Completed" &&
    qualifier1.winnerId &&
    currentQualifier2?.status === "Completed" &&
    currentQualifier2.winnerId
  ) {
    let grandFinal = nextMatches.find(
      (match) => match.stage === "Grand Final"
    );

    const grandFinalTeam1 = qualifier1.winnerId;
    const grandFinalTeam2 = currentQualifier2.winnerId;

    if (!grandFinal) {
      grandFinal = {
        id: createId("gf"),
        matchNumber: getNextMatchNumber(nextMatches),
        stage: "Grand Final",
        team1Id: grandFinalTeam1,
        team2Id: grandFinalTeam2,
        scheduledAt: new Date().toISOString(),
        map: "TBD",
        bestOf: 5,
        team1Score: 0,
        team2Score: 0,
        status: "Scheduled",
        playerStats: [],
        createdAt: new Date().toISOString(),
      };

      nextMatches.push(grandFinal);
    } else if (grandFinal.status !== "Completed") {
      grandFinal = {
        ...grandFinal,
        team1Id: grandFinalTeam1,
        team2Id: grandFinalTeam2,
      };

      const index = nextMatches.findIndex(
        (match) => match.id === grandFinal!.id
      );

      if (index !== -1) {
        nextMatches[index] = grandFinal;
      }
    }
  }

  return nextMatches;
}

function stageLabel(stage: string) {
  if (stage === "Group Stage") {
    return "GROUP";
  }

  if (stage === "Qualifier 1") {
    return "QUALIFIER 1";
  }

  if (stage === "Eliminator") {
    return "ELIMINATOR";
  }

  if (stage === "Qualifier 2") {
    return "QUALIFIER 2";
  }

  if (stage === "Grand Final") {
    return "GRAND FINAL";
  }

  return stage.toUpperCase();
}

function statusClass(status: MatchStatus) {
  if (status === "Completed") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-400";
  }

  if (status === "Live") {
    return "border-red-400/20 bg-red-400/10 text-red-400";
  }

  if (status === "Cancelled") {
    return "border-white/10 bg-white/5 text-white/35";
  }

  return "border-cyan-400/20 bg-cyan-400/10 text-cyan-400";
}

export default function MatchesPage() {
  const router = useRouter();

  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [modalMode, setModalMode] =
    useState<ModalMode>(null);

  const [editingMatch, setEditingMatch] =
    useState<Match | null>(null);

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] =
    useState("All");
  const [statusFilter, setStatusFilter] =
    useState("All");

  const [form, setForm] = useState<FormState>({
    stage: "Group Stage",
    team1Id: "",
    team2Id: "",
    map: "TBD",
    bestOf: 3,
    status: "Scheduled",
    scheduledAt: "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener(
      "tournament-matches-updated",
      handleUpdate
    );

    window.addEventListener(
      "storage",
      handleUpdate
    );

    return () => {
      window.removeEventListener(
        "tournament-matches-updated",
        handleUpdate
      );

      window.removeEventListener(
        "storage",
        handleUpdate
      );
    };
  }, []);

  function loadData() {
    try {
      const storedTeams =
        localStorage.getItem(TEAMS_STORAGE_KEY);

      const storedMatches =
        localStorage.getItem(MATCHES_STORAGE_KEY);

      const parsedTeams: Team[] = storedTeams
        ? JSON.parse(storedTeams)
        : [];

      const parsedMatches: Match[] = storedMatches
        ? JSON.parse(storedMatches)
        : [];

      const synchronized = synchronizePhase2(
        parsedMatches,
        parsedTeams
      );

      localStorage.setItem(
        MATCHES_STORAGE_KEY,
        JSON.stringify(synchronized)
      );

      setTeams(parsedTeams);
      setMatches(synchronized);
    } catch {
      setError("Could not load tournament data.");
    }
  }

  function saveMatches(nextMatches: Match[]) {
    const synchronized = synchronizePhase2(
      nextMatches,
      teams
    );

    localStorage.setItem(
      MATCHES_STORAGE_KEY,
      JSON.stringify(synchronized)
    );

    setMatches(synchronized);

    window.dispatchEvent(
      new Event("tournament-matches-updated")
    );
  }

  const filteredMatches = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return [...matches]
      .sort(
        (a, b) =>
          a.matchNumber - b.matchNumber
      )
      .filter((match) => {
        const team1 = teams.find(
          (team) => team.id === match.team1Id
        );

        const team2 = teams.find(
          (team) => team.id === match.team2Id
        );

        const searchMatch =
          !normalizedSearch ||
          match.stage
            .toLowerCase()
            .includes(normalizedSearch) ||
          String(match.matchNumber).includes(
            normalizedSearch
          ) ||
          team1?.name
            .toLowerCase()
            .includes(normalizedSearch) ||
          team2?.name
            .toLowerCase()
            .includes(normalizedSearch);

        const stageMatch =
          stageFilter === "All" ||
          match.stage === stageFilter;

        const statusMatch =
          statusFilter === "All" ||
          match.status === statusFilter;

        return (
          searchMatch &&
          stageMatch &&
          statusMatch
        );
      });
  }, [
    matches,
    teams,
    search,
    stageFilter,
    statusFilter,
  ]);

  const stats = useMemo(() => {
    return {
      total: matches.length,
      scheduled: matches.filter(
        (match) => match.status === "Scheduled"
      ).length,
      live: matches.filter(
        (match) => match.status === "Live"
      ).length,
      completed: matches.filter(
        (match) => match.status === "Completed"
      ).length,
    };
  }, [matches]);

  function openCreateModal() {
    setError("");
    setMessage("");

    setEditingMatch(null);

    setForm({
      stage: "Group Stage",
      team1Id: teams[0]?.id ?? "",
      team2Id: teams[1]?.id ?? "",
      map: "TBD",
      bestOf: 3,
      status: "Scheduled",
      scheduledAt: toDateTimeLocal(
        new Date().toISOString()
      ),
    });

    setModalMode("create");
  }

  function openEditModal(match: Match) {
    setError("");
    setMessage("");

    setEditingMatch(match);

    setForm({
      stage: match.stage,
      team1Id: match.team1Id,
      team2Id: match.team2Id,
      map: match.map || "TBD",
      bestOf: match.bestOf || 3,
      status:
        match.status === "Completed"
          ? "Scheduled"
          : match.status,
      scheduledAt: toDateTimeLocal(
        match.scheduledAt
      ),
    });

    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditingMatch(null);
    setError("");
  }

  function saveMatch() {
    setError("");
    setMessage("");

    if (!form.team1Id || !form.team2Id) {
      setError("Select both teams.");
      return;
    }

    if (form.team1Id === form.team2Id) {
      setError(
        "Team 1 and Team 2 must be different."
      );
      return;
    }

    if (
      form.stage !== "Group Stage" &&
      modalMode === "create"
    ) {
      setError(
        "Playoff matches are created automatically from tournament results."
      );
      return;
    }

    if (modalMode === "create") {
      const newMatch: Match = {
        id: createId("match"),
        matchNumber: getNextMatchNumber(matches),
        stage: form.stage,
        team1Id: form.team1Id,
        team2Id: form.team2Id,
        scheduledAt: fromDateTimeLocal(
          form.scheduledAt
        ),
        map: form.map,
        bestOf: form.bestOf,
        team1Score: 0,
        team2Score: 0,
        status: form.status,
        playerStats: [],
        createdAt: new Date().toISOString(),
      };

      saveMatches([...matches, newMatch]);

      setMessage(
        `Match #${newMatch.matchNumber} created.`
      );

      closeModal();
      return;
    }

    if (!editingMatch) {
      return;
    }

    if (editingMatch.status === "Completed") {
      setError(
        "Completed matches must be changed through the result recorder."
      );
      return;
    }

    const updated = matches.map((match) =>
      match.id === editingMatch.id
        ? {
            ...match,
            stage: form.stage,
            team1Id: form.team1Id,
            team2Id: form.team2Id,
            map: form.map,
            bestOf: form.bestOf,
            status: form.status,
            scheduledAt: fromDateTimeLocal(
              form.scheduledAt
            ),
          }
        : match
    );

    saveMatches(updated);

    closeModal();

    setMessage(
      `Match #${editingMatch.matchNumber} updated.`
    );
  }

  function deleteMatch(match: Match) {
    setError("");
    setMessage("");

    if (
      match.stage !== "Group Stage" ||
      match.status === "Completed"
    ) {
      setError(
        "Only scheduled or live Group Stage matches can be deleted."
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete Match #${match.matchNumber}?`
    );

    if (!confirmed) {
      return;
    }

    const nextMatches = matches.filter(
      (item) => item.id !== match.id
    );

    saveMatches(nextMatches);

    setMessage(
      `Match #${match.matchNumber} deleted.`
    );
  }

  function openResultRecorder(match: Match) {
    router.push(`/matches/${match.id}`);
  }

  function getTeam(teamId: string) {
    return teams.find(
      (team) => team.id === teamId
    );
  }

  return (
    <main className="min-h-screen bg-[#080c12] px-4 py-6 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-2 text-[10px] font-black tracking-[0.35em] text-cyan-400 uppercase">
              Tournament Management // Admin
            </div>

            <h1 className="text-3xl font-black tracking-tight uppercase">
              Match Center
            </h1>

            <p className="mt-2 max-w-2xl text-xs leading-5 text-white/40">
              Schedule Group Stage matches and record completed
              results by uploading the official Valorant result
              screenshot.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="bg-cyan-400 px-6 py-3 text-xs font-black tracking-[0.18em] text-black uppercase transition hover:bg-cyan-300"
          >
            + CREATE GROUP MATCH
          </button>
        </header>

        {message && (
          <div className="mb-5 border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 text-xs font-bold tracking-wider text-cyan-300 uppercase">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 border border-red-500/30 bg-red-500/10 px-5 py-4 text-xs font-bold tracking-wider text-red-300 uppercase">
            {error}
          </div>
        )}

        <section className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="border border-white/10 bg-[#0d131c] p-5">
            <div className="text-[9px] font-black tracking-[0.2em] text-white/35 uppercase">
              Total Matches
            </div>

            <div className="mt-2 text-3xl font-black">
              {stats.total}
            </div>
          </div>

          <div className="border border-white/10 bg-[#0d131c] p-5">
            <div className="text-[9px] font-black tracking-[0.2em] text-white/35 uppercase">
              Scheduled
            </div>

            <div className="mt-2 text-3xl font-black text-cyan-400">
              {stats.scheduled}
            </div>
          </div>

          <div className="border border-white/10 bg-[#0d131c] p-5">
            <div className="text-[9px] font-black tracking-[0.2em] text-white/35 uppercase">
              Live
            </div>

            <div className="mt-2 text-3xl font-black text-red-400">
              {stats.live}
            </div>
          </div>

          <div className="border border-white/10 bg-[#0d131c] p-5">
            <div className="text-[9px] font-black tracking-[0.2em] text-white/35 uppercase">
              Completed
            </div>

            <div className="mt-2 text-3xl font-black text-emerald-400">
              {stats.completed}
            </div>
          </div>
        </section>

        <section className="mb-6 border border-white/10 bg-[#0d131c] p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="SEARCH MATCHES / TEAMS..."
              className="min-w-0 flex-1 border border-white/10 bg-[#080c12] px-4 py-3 text-xs font-bold tracking-wider text-white outline-none placeholder:text-white/20 focus:border-cyan-400"
            />

            <select
              value={stageFilter}
              onChange={(event) =>
                setStageFilter(event.target.value)
              }
              className="border border-white/10 bg-[#080c12] px-4 py-3 text-xs font-black tracking-wider outline-none focus:border-cyan-400"
            >
              <option
                value="All"
                className="bg-[#0d131c]"
              >
                ALL STAGES
              </option>

              {STAGES.map((stage) => (
                <option
                  key={stage}
                  value={stage}
                  className="bg-[#0d131c]"
                >
                  {stage.toUpperCase()}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="border border-white/10 bg-[#080c12] px-4 py-3 text-xs font-black tracking-wider outline-none focus:border-cyan-400"
            >
              <option
                value="All"
                className="bg-[#0d131c]"
              >
                ALL STATUS
              </option>

              <option
                value="Scheduled"
                className="bg-[#0d131c]"
              >
                SCHEDULED
              </option>

              <option
                value="Live"
                className="bg-[#0d131c]"
              >
                LIVE
              </option>

              <option
                value="Completed"
                className="bg-[#0d131c]"
              >
                COMPLETED
              </option>

              <option
                value="Cancelled"
                className="bg-[#0d131c]"
              >
                CANCELLED
              </option>
            </select>
          </div>
        </section>

        <section className="border border-white/10 bg-[#0d131c]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <div className="text-[10px] font-black tracking-[0.25em] text-cyan-400 uppercase">
                Match Schedule
              </div>

              <div className="mt-1 text-sm font-black uppercase">
                {filteredMatches.length} Matches
              </div>
            </div>

            <div className="text-[9px] font-bold tracking-[0.15em] text-white/30 uppercase">
              Results via Screenshot
            </div>
          </div>

          {filteredMatches.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-sm font-black tracking-[0.15em] text-white/30 uppercase">
                No Matches Found
              </div>

              <div className="mt-2 text-xs text-white/20">
                Create a Group Stage match to begin.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredMatches.map((match) => {
                const team1 = getTeam(match.team1Id);
                const team2 = getTeam(match.team2Id);

                const isAutomatic =
                  match.stage !== "Group Stage";

                const isCompleted =
                  match.status === "Completed";

                return (
                  <div
                    key={match.id}
                    className="p-5 transition hover:bg-white/[0.015]"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                      <div className="flex items-center gap-4 xl:w-32">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-white/10 bg-[#080c12] text-sm font-black">
                          #{String(
                            match.matchNumber
                          ).padStart(2, "0")}
                        </div>

                        <div>
                          <div className="text-[9px] font-black tracking-[0.15em] text-cyan-400 uppercase">
                            {stageLabel(match.stage)}
                          </div>

                          {isAutomatic && (
                            <div className="mt-1 text-[8px] font-black tracking-[0.15em] text-white/25 uppercase">
                              AUTO
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
                          <div className="flex items-center gap-3 md:justify-end">
                            <div className="text-right">
                              <div className="truncate text-sm font-black uppercase">
                                {team1?.name ??
                                  "TBD"}
                              </div>

                              {team1 && (
                                <div className="mt-1 text-[9px] font-bold text-white/30 uppercase">
                                  SEED {team1.seed}
                                </div>
                              )}
                            </div>

                            {team1?.logo ? (
                              <img
                                src={team1.logo}
                                alt=""
                                className="h-10 w-10 object-contain"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/5 text-[9px] font-black">
                                {team1?.tag
                                  ?.slice(0, 3) ||
                                  "TBD"}
                              </div>
                            )}
                          </div>

                          <div className="text-center">
                            {isCompleted ? (
                              <div className="text-2xl font-black">
                                {match.team1Score}
                                <span className="mx-2 text-white/20">
                                  :
                                </span>
                                {match.team2Score}
                              </div>
                            ) : (
                              <div className="text-xs font-black tracking-[0.18em] text-white/25 uppercase">
                                VS
                              </div>
                            )}

                            <div className="mt-1 text-[8px] font-bold tracking-[0.15em] text-white/25 uppercase">
                              {match.map || "TBD"}{" "}
                              • BO{match.bestOf}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {team2?.logo ? (
                              <img
                                src={team2.logo}
                                alt=""
                                className="h-10 w-10 object-contain"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/5 text-[9px] font-black">
                                {team2?.tag
                                  ?.slice(0, 3) ||
                                  "TBD"}
                              </div>
                            )}

                            <div>
                              <div className="truncate text-sm font-black uppercase">
                                {team2?.name ??
                                  "TBD"}
                              </div>

                              {team2 && (
                                <div className="mt-1 text-[9px] font-bold text-white/30 uppercase">
                                  SEED {team2.seed}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 xl:w-56 xl:items-end">
                        <div className="flex items-center gap-2">
                          <span
                            className={`border px-3 py-1 text-[8px] font-black tracking-[0.15em] uppercase ${statusClass(
                              match.status
                            )}`}
                          >
                            {match.status}
                          </span>
                        </div>

                        <div className="text-[9px] font-bold text-white/30 uppercase">
                          {new Date(
                            match.scheduledAt
                          ).toLocaleString()}
                        </div>

                        <div className="flex flex-wrap gap-2 xl:justify-end">
                          {isCompleted ? (
                            <button
                              onClick={() =>
                                openResultRecorder(
                                  match
                                )
                              }
                              className="border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-[9px] font-black tracking-[0.15em] text-cyan-400 uppercase transition hover:bg-cyan-400/20"
                            >
                              VIEW / EDIT RESULT
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                openResultRecorder(
                                  match
                                )
                              }
                              disabled={
                                !team1 || !team2
                              }
                              className="bg-cyan-400 px-4 py-2 text-[9px] font-black tracking-[0.15em] text-black uppercase transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              RECORD RESULT
                            </button>
                          )}

                          {!isAutomatic &&
                            !isCompleted && (
                              <>
                                <button
                                  onClick={() =>
                                    openEditModal(
                                      match
                                    )
                                  }
                                  className="border border-white/10 bg-white/5 px-4 py-2 text-[9px] font-black tracking-[0.15em] text-white/70 uppercase transition hover:bg-white/10"
                                >
                                  EDIT
                                </button>

                                <button
                                  onClick={() =>
                                    deleteMatch(
                                      match
                                    )
                                  }
                                  className="border border-red-500/20 bg-red-500/5 px-4 py-2 text-[9px] font-black tracking-[0.15em] text-red-400 uppercase transition hover:bg-red-500/10"
                                >
                                  DELETE
                                </button>
                              </>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="border border-white/10 bg-[#0d131c] p-5">
            <div className="text-[9px] font-black tracking-[0.2em] text-cyan-400 uppercase">
              Result Recording
            </div>

            <p className="mt-2 text-xs leading-5 text-white/35">
              Completed results are recorded from the official
              Valorant scoreboard screenshot.
            </p>
          </div>

          <div className="border border-white/10 bg-[#0d131c] p-5">
            <div className="text-[9px] font-black tracking-[0.2em] text-cyan-400 uppercase">
              Phase 2
            </div>

            <p className="mt-2 text-xs leading-5 text-white/35">
              Qualifier 1 and Eliminator are generated after
              all 12 Group Stage matches are completed.
            </p>
          </div>

          <div className="border border-white/10 bg-[#0d131c] p-5">
            <div className="text-[9px] font-black tracking-[0.2em] text-cyan-400 uppercase">
              Automatic Progression
            </div>

            <p className="mt-2 text-xs leading-5 text-white/35">
              Q2 and Grand Final teams are determined from
              completed playoff results.
            </p>
          </div>
        </section>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl border border-white/10 bg-[#0b1119] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <div className="text-[9px] font-black tracking-[0.25em] text-cyan-400 uppercase">
                  Match Scheduler
                </div>

                <h2 className="mt-1 text-xl font-black uppercase">
                  {modalMode === "create"
                    ? "Create Group Match"
                    : "Edit Match"}
                </h2>
              </div>

              <button
                onClick={closeModal}
                className="text-white/30 transition hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-[9px] font-black tracking-[0.2em] text-white/35 uppercase">
                  Stage
                </span>

                <select
                  value={form.stage}
                  disabled={
                    modalMode === "edit" ||
                    modalMode === "create"
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      stage: event.target.value,
                    }))
                  }
                  className="w-full border border-white/10 bg-[#080c12] px-4 py-3 text-xs font-bold uppercase outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {STAGES.map((stage) => (
                    <option
                      key={stage}
                      value={stage}
                      className="bg-[#0d131c]"
                    >
                      {stage.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-[9px] font-black tracking-[0.2em] text-white/35 uppercase">
                  Status
                </span>

                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target
                        .value as MatchStatus,
                    }))
                  }
                  className="w-full border border-white/10 bg-[#080c12] px-4 py-3 text-xs font-bold uppercase outline-none"
                >
                  {STATUS_OPTIONS.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                        className="bg-[#0d131c]"
                      >
                        {status.toUpperCase()}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-[9px] font-black tracking-[0.2em] text-white/35 uppercase">
                  Team 1
                </span>

                <select
                  value={form.team1Id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      team1Id: event.target.value,
                    }))
                  }
                  className="w-full border border-white/10 bg-[#080c12] px-4 py-3 text-xs font-bold uppercase outline-none"
                >
                  <option
                    value=""
                    className="bg-[#0d131c]"
                  >
                    SELECT TEAM
                  </option>

                  {teams.map((team) => (
                    <option
                      key={team.id}
                      value={team.id}
                      className="bg-[#0d131c]"
                    >
                      {team.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-[9px] font-black tracking-[0.2em] text-white/35 uppercase">
                  Team 2
                </span>

                <select
                  value={form.team2Id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      team2Id: event.target.value,
                    }))
                  }
                  className="w-full border border-white/10 bg-[#080c12] px-4 py-3 text-xs font-bold uppercase outline-none"
                >
                  <option
                    value=""
                    className="bg-[#0d131c]"
                  >
                    SELECT TEAM
                  </option>

                  {teams.map((team) => (
                    <option
                      key={team.id}
                      value={team.id}
                      className="bg-[#0d131c]"
                    >
                      {team.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-[9px] font-black tracking-[0.2em] text-white/35 uppercase">
                  Map
                </span>

                <select
                  value={form.map}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      map: event.target.value,
                    }))
                  }
                  className="w-full border border-white/10 bg-[#080c12] px-4 py-3 text-xs font-bold uppercase outline-none"
                >
                  {MAPS.map((map) => (
                    <option
                      key={map}
                      value={map}
                      className="bg-[#0d131c]"
                    >
                      {map}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-[9px] font-black tracking-[0.2em] text-white/35 uppercase">
                  Best Of
                </span>

                <select
                  value={form.bestOf}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      bestOf: Number(
                        event.target.value
                      ),
                    }))
                  }
                  className="w-full border border-white/10 bg-[#080c12] px-4 py-3 text-xs font-bold uppercase outline-none"
                >
                  <option
                    value={1}
                    className="bg-[#0d131c]"
                  >
                    BO1
                  </option>

                  <option
                    value={3}
                    className="bg-[#0d131c]"
                  >
                    BO3
                  </option>

                  <option
                    value={5}
                    className="bg-[#0d131c]"
                  >
                    BO5
                  </option>
                </select>
              </label>

              <label className="md:col-span-2">
                <span className="mb-2 block text-[9px] font-black tracking-[0.2em] text-white/35 uppercase">
                  Scheduled Time
                </span>

                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      scheduledAt:
                        event.target.value,
                    }))
                  }
                  className="w-full border border-white/10 bg-[#080c12] px-4 py-3 text-xs font-bold outline-none"
                />
              </label>
            </div>

            <div className="border-t border-white/10 px-6 py-5">
              <div className="mb-4 border border-cyan-400/10 bg-cyan-400/5 p-4 text-[10px] leading-5 text-white/40">
                <span className="font-black text-cyan-400 uppercase">
                  Result recording:
                </span>{" "}
                Scores, player statistics, MVP, Top Fragger and
                winner are no longer entered here. After the
                match is played, use{" "}
                <strong className="text-white/60">
                  RECORD RESULT
                </strong>{" "}
                and upload the official Valorant result
                screenshot.
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="border border-white/10 px-5 py-3 text-xs font-black tracking-[0.15em] text-white/50 uppercase transition hover:bg-white/5"
                >
                  Cancel
                </button>

                <button
                  onClick={saveMatch}
                  className="bg-cyan-400 px-6 py-3 text-xs font-black tracking-[0.15em] text-black uppercase transition hover:bg-cyan-300"
                >
                  {modalMode === "create"
                    ? "Create Match"
                    : "Save Match"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
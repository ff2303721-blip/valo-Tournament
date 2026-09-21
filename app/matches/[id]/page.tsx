"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

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
  if (!value) return "TBD";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function statusClass(status: Match["status"]) {
  switch (status) {
    case "Live":
      return "border-red-500/50 bg-red-500/15 text-red-300";
    case "Completed":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
    case "Cancelled":
      return "border-zinc-500/40 bg-zinc-500/10 text-zinc-300";
    default:
      return "border-yellow-500/40 bg-yellow-500/10 text-yellow-300";
  }
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

    loadData();

    return () => {
      mounted = false;
    };
  }, [matchId]);

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

  async function handleScreenshot(
    event: ChangeEvent<HTMLInputElement>,
  ) {
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
            setMessage(
              `OCR ${Math.round(info.progress * 100)}%`,
            );
          }
        },
      });

      setOcrText(result.data.text);

      setMessage(
        "OCR completed. Review and enter the extracted values below.",
      );
    } catch (ocrError) {
      setError(
        ocrError instanceof Error
          ? ocrError.message
          : "OCR failed.",
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
      setError(
        "Enter a winning score or select the winner.",
      );
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
            map: match.map,
            bestOf: match.bestOf,
            team1Score,
            team2Score,
            status: "Completed",
            winnerId: calculatedWinner,
            mvpPlayerId: selectedMvp || null,
            topFraggerPlayerId: selectedTopFragger || null,
            playerStats: stats.map((stat) => ({
              playerId: stat.playerId || null,
              playerName: stat.playerName,
              teamId: stat.teamId || null,
              kills: Number(stat.kills) || 0,
              deaths: Number(stat.deaths) || 0,
              assists: Number(stat.assists) || 0,
              acs: Number(stat.acs) || 0,
              adr: Number(stat.adr) || 0,
              kast: Number(stat.kast) || 0,
            })),
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to save match result.",
        );
      }

      setMatch(data);
      setStats(data.playerStats ?? []);
      setWinnerId(data.winnerId ?? calculatedWinner);
      setSelectedMvp(data.mvpPlayerId ?? selectedMvp);
      setSelectedTopFragger(
        data.topFraggerPlayerId ?? selectedTopFragger,
      );
      setTeam1Score(Number(data.team1Score ?? team1Score));
      setTeam2Score(Number(data.team2Score ?? team2Score));

      setMessage(
        "Match result saved successfully.",
      );
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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070a12] px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-cyan-400/20 bg-[#0d1320] p-8 shadow-[0_0_50px_rgba(34,211,238,0.08)]">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
              Match Center
            </p>
            <h1 className="mt-3 text-3xl font-black">
              Loading result recorder...
            </h1>
          </div>
        </div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="min-h-screen bg-[#070a12] px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-red-500/30 bg-[#120d16] p-8">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-300">
              Match Center
            </p>

            <h1 className="mt-3 text-3xl font-black">
              Match not found
            </h1>

            <p className="mt-3 text-zinc-400">
              {error || "The requested match does not exist."}
            </p>

            <Link
              href="/matches"
              className="mt-6 inline-flex rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-bold text-cyan-200"
            >
              ← Back to Match Center
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070a12] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/matches"
              className="text-sm font-bold text-cyan-300 hover:text-cyan-200"
            >
              ← Match Center
            </Link>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-red-300">
                M{String(match.matchNumber).padStart(2, "0")}
              </span>

              <span className="rounded-full border border-purple-400/30 bg-purple-400/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-purple-300">
                {match.stage}
              </span>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${statusClass(
                  match.status,
                )}`}
              >
                {match.status}
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-black sm:text-4xl">
              Result Recorder
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Upload the scoreboard screenshot, review OCR output,
              enter player statistics, and save the official result.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/tournament/matches/${match.id}`}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-200 hover:border-cyan-400/40"
            >
              Public Match Page
            </Link>
          </div>
        </header>

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-semibold text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-300">
            {message}
          </div>
        )}

        <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-2xl border border-cyan-400/20 bg-[#0d1320] p-5 shadow-[0_0_40px_rgba(34,211,238,0.05)]">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-zinc-500">
                  Team 1
                </p>

                <h2 className="mt-2 text-2xl font-black text-cyan-200">
                  {team1?.name ?? match.team1Id ?? "TBD"}
                </h2>

                {team1?.tag && (
                  <p className="mt-1 text-xs font-bold text-zinc-500">
                    {team1.tag}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  value={team1Score}
                  onChange={(event) =>
                    setTeam1Score(
                      Math.max(0, numberValue(event.target.value)),
                    )
                  }
                  className="w-24 rounded-xl border border-cyan-400/30 bg-[#080d17] px-4 py-4 text-center text-3xl font-black text-white outline-none focus:border-cyan-300"
                />

                <span className="text-xl font-black text-zinc-600">
                  :
                </span>

                <input
                  type="number"
                  min={0}
                  value={team2Score}
                  onChange={(event) =>
                    setTeam2Score(
                      Math.max(0, numberValue(event.target.value)),
                    )
                  }
                  className="w-24 rounded-xl border border-purple-400/30 bg-[#080d17] px-4 py-4 text-center text-3xl font-black text-white outline-none focus:border-purple-300"
                />
              </div>

              <div className="flex-1 text-left md:text-right">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-zinc-500">
                  Team 2
                </p>

                <h2 className="mt-2 text-2xl font-black text-purple-200">
                  {team2?.name ?? match.team2Id ?? "TBD"}
                </h2>

                {team2?.tag && (
                  <p className="mt-1 text-xs font-bold text-zinc-500">
                    {team2.tag}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-800 bg-[#090e18] p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Map
                </p>
                <p className="mt-2 text-lg font-black">
                  {match.map || "TBD"}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-[#090e18] p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Format
                </p>
                <p className="mt-2 text-lg font-black">
                  BO{match.bestOf}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-[#090e18] p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Scheduled
                </p>
                <p className="mt-2 text-sm font-black">
                  {formatDate(match.scheduledAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-purple-400/20 bg-[#0d1320] p-5">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-purple-300">
              Result
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Match Outcome
            </h2>

            <label className="mt-5 block text-xs font-black uppercase tracking-wider text-zinc-500">
              Winner
            </label>

            <select
              value={winnerId}
              onChange={(event) =>
                setWinnerId(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-[#080d17] px-4 py-3 text-sm font-bold text-white outline-none focus:border-purple-400"
            >
              <option value="">Auto from score</option>

              {team1 && (
                <option value={team1.id}>
                  {team1.name}
                </option>
              )}

              {team2 && (
                <option value={team2.id}>
                  {team2.name}
                </option>
              )}
            </select>

            <label className="mt-5 block text-xs font-black uppercase tracking-wider text-zinc-500">
              MVP
            </label>

            <select
              value={selectedMvp}
              onChange={(event) =>
                setSelectedMvp(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-[#080d17] px-4 py-3 text-sm font-bold text-white outline-none focus:border-purple-400"
            >
              <option value="">Select MVP</option>

              {playerOptions.map((player) => (
                <option
                  key={`mvp-${player.playerId}-${player.playerName}`}
                  value={player.playerId}
                >
                  {player.playerName}
                </option>
              ))}
            </select>

            <label className="mt-5 block text-xs font-black uppercase tracking-wider text-zinc-500">
              Top Fragger
            </label>

            <select
              value={selectedTopFragger}
              onChange={(event) =>
                setSelectedTopFragger(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-[#080d17] px-4 py-3 text-sm font-bold text-white outline-none focus:border-purple-400"
            >
              <option value="">Select Top Fragger</option>

              {playerOptions.map((player) => (
                <option
                  key={`fragger-${player.playerId}-${player.playerName}`}
                  value={player.playerId}
                >
                  {player.playerName}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-orange-400/20 bg-[#0d1320] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">
                OCR Import
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Scoreboard Screenshot
              </h2>

              <p className="mt-2 text-sm text-zinc-400">
                Upload the final scoreboard screenshot. OCR output is
                provided as raw text for manual verification.
              </p>
            </div>

            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-orange-400/30 bg-orange-400/10 px-5 py-3 text-sm font-black text-orange-200 hover:bg-orange-400/15">
              {ocrRunning ? "Running OCR..." : "Upload Screenshot"}
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
            <textarea
              value={ocrText}
              onChange={(event) =>
                setOcrText(event.target.value)
              }
              className="mt-5 min-h-48 w-full rounded-xl border border-zinc-800 bg-[#080d17] p-4 font-mono text-xs text-zinc-300 outline-none focus:border-orange-400/50"
              placeholder="OCR output..."
            />
          )}
        </section>

        <section className="mt-5 rounded-2xl border border-emerald-400/20 bg-[#0d1320] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">
                Player Statistics
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Scoreboard Stats
              </h2>

              <p className="mt-2 text-sm text-zinc-400">
                Verify the OCR data and correct every player row before
                saving.
              </p>
            </div>

            <button
              type="button"
              onClick={addPlayer}
              className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-200 hover:bg-emerald-400/15"
            >
              + Add Player
            </button>
          </div>

          <div className="mt-5 overflow-x-auto rounded-xl border border-zinc-800">
            <table className="min-w-[1050px] w-full border-collapse">
              <thead>
                <tr className="bg-[#080d17] text-left">
                  {[
                    "Player",
                    "Team",
                    "K",
                    "D",
                    "A",
                    "ACS",
                    "ADR",
                    "KAST",
                    "",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="border-b border-zinc-800 px-3 py-3 text-xs font-black uppercase tracking-wider text-zinc-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {stats.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-10 text-center text-sm text-zinc-500"
                    >
                      No player statistics yet. Add players manually
                      or use the OCR screenshot as reference.
                    </td>
                  </tr>
                ) : (
                  stats.map((stat, index) => (
                    <tr
                      key={`${stat.playerId || "new"}-${index}`}
                      className="border-b border-zinc-900 last:border-b-0"
                    >
                      <td className="px-3 py-3">
                        <input
                          value={stat.playerName}
                          onChange={(event) =>
                            updateStat(
                              index,
                              "playerName",
                              event.target.value,
                            )
                          }
                          className="w-44 rounded-lg border border-zinc-800 bg-[#080d17] px-3 py-2 text-sm font-bold outline-none focus:border-cyan-400/50"
                          placeholder="Player name"
                        />
                      </td>

                      <td className="px-3 py-3">
                        <select
                          value={stat.teamId}
                          onChange={(event) =>
                            updateStat(
                              index,
                              "teamId",
                              event.target.value,
                            )
                          }
                          className="w-44 rounded-lg border border-zinc-800 bg-[#080d17] px-3 py-2 text-sm font-bold outline-none focus:border-cyan-400/50"
                        >
                          <option value="">Select team</option>

                          {teams.map((team) => (
                            <option
                              key={team.id}
                              value={team.id}
                            >
                              {team.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {(
                        [
                          "kills",
                          "deaths",
                          "assists",
                          "acs",
                          "adr",
                          "kast",
                        ] as Array<keyof EditableStat>
                      ).map((field) => (
                        <td
                          key={field}
                          className="px-3 py-3"
                        >
                          <input
                            type="number"
                            min={0}
                            step={
                              field === "adr" || field === "kast"
                                ? "0.01"
                                : "1"
                            }
                            value={String(stat[field])}
                            onChange={(event) =>
                              updateStat(
                                index,
                                field,
                                event.target.value,
                              )
                            }
                            className="w-20 rounded-lg border border-zinc-800 bg-[#080d17] px-3 py-2 text-center text-sm font-bold outline-none focus:border-cyan-400/50"
                          />
                        </td>
                      ))}

                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            removePlayer(index)
                          }
                          className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-black text-red-300"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-5 flex flex-col gap-4 rounded-2xl border border-red-500/20 bg-[#0d1320] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-red-300">
              Finalize
            </p>

            <h2 className="mt-2 text-xl font-black">
              Save Official Result
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Saving marks this match as Completed.
            </p>
          </div>

          <button
            type="button"
            onClick={saveResult}
            disabled={saving}
            className="rounded-xl border border-red-400/30 bg-red-500/15 px-7 py-4 text-sm font-black uppercase tracking-wider text-red-200 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Result"}
          </button>
        </section>
      </div>
    </main>
  );
}
"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import type { Match, PlayerStat } from "@/app/data/matches";
import type { Team } from "@/app/data/teams";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type EditableStat = PlayerStat & {
  teamName: string;
};

type OCRResult = {
  text: string;
  score1: number | null;
  score2: number | null;
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

function parseScore(text: string): {
  score1: number | null;
  score2: number | null;
} {
  const cleaned = text
    .replace(/[|]/g, ":")
    .replace(/[—–-]/g, ":")
    .replace(/\s+/g, " ");

  const patterns = [
    /\b(\d{1,2})\s*[:]\s*(\d{1,2})\b/,
    /\b(\d{1,2})\s+(\d{1,2})\b/,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);

    if (!match) continue;

    const score1 = Number(match[1]);
    const score2 = Number(match[2]);

    if (
      Number.isInteger(score1) &&
      Number.isInteger(score2) &&
      score1 >= 0 &&
      score2 >= 0 &&
      score1 <= 99 &&
      score2 <= 99
    ) {
      return {
        score1,
        score2,
      };
    }
  }

  return {
    score1: null,
    score2: null,
  };
}

function numberValue(value: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return parsed;
}

export default function MatchResultPage({
  params,
}: Props) {
  const { id } = use(params);

  const [match, setMatch] = useState<Match | null>(
    null,
  );

  const [teams, setTeams] = useState<Team[]>([]);
  const [stats, setStats] = useState<EditableStat[]>(
    [],
  );

  const [team1Score, setTeam1Score] = useState("0");
  const [team2Score, setTeam2Score] = useState("0");

  const [mvpPlayerId, setMvpPlayerId] =
    useState("");
  const [topFraggerPlayerId, setTopFraggerPlayerId] =
    useState("");

  const [ocrText, setOcrText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [screenshot, setScreenshot] =
    useState<File | null>(null);
  const [previewUrl, setPreviewUrl] =
    useState<string>("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const team1 = useMemo(
    () =>
      teams.find(
        (team) => team.id === match?.team1Id,
      ),
    [teams, match],
  );

  const team2 = useMemo(
    () =>
      teams.find(
        (team) => team.id === match?.team2Id,
      ),
    [teams, match],
  );

  const winnerId = useMemo(() => {
    const score1 = Number(team1Score);
    const score2 = Number(team2Score);

    if (
      !Number.isFinite(score1) ||
      !Number.isFinite(score2) ||
      score1 === score2
    ) {
      return "";
    }

    return score1 > score2
      ? match?.team1Id ?? ""
      : match?.team2Id ?? "";
  }, [
    team1Score,
    team2Score,
    match,
  ]);

  const completedStats = useMemo(
    () =>
      stats.filter(
        (stat) =>
          stat.kills > 0 ||
          stat.deaths > 0 ||
          stat.assists > 0 ||
          stat.acs > 0,
      ),
    [stats],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [
          matchResponse,
          teamsResponse,
        ] = await Promise.all([
          fetch(
            `/api/matches/${encodeURIComponent(id)}`,
            {
              cache: "no-store",
            },
          ),
          fetch("/api/teams", {
            cache: "no-store",
          }),
        ]);

        const matchData =
          await matchResponse.json();

        const teamsData =
          await teamsResponse.json();

        if (!matchResponse.ok) {
          throw new Error(
            matchData.error ||
              "Failed to load match.",
          );
        }

        if (!teamsResponse.ok) {
          throw new Error(
            teamsData.error ||
              "Failed to load teams.",
          );
        }

        const loadedMatch =
          normalizeMatch(matchData.match);

        const loadedTeams =
          teamsData.teams ?? [];

        setMatch(loadedMatch);
        setTeams(loadedTeams);

        setTeam1Score(
          String(
            loadedMatch.team1Score ?? 0,
          ),
        );

        setTeam2Score(
          String(
            loadedMatch.team2Score ?? 0,
          ),
        );

        setMvpPlayerId(
          loadedMatch.mvpPlayerId ?? "",
        );

        setTopFraggerPlayerId(
          loadedMatch.topFraggerPlayerId ??
            "",
        );

        const teamMap = new Map(
          loadedTeams.map(
            (team: Team) => [
              team.id,
              team,
            ],
          ),
        );

        const loadedStats: EditableStat[] =
          loadedMatch.playerStats.map(
            (stat) => ({
              ...stat,
              teamName:
                teamMap.get(stat.teamId)
                  ?.name ?? "Unknown Team",
            }),
          );

        setStats(loadedStats);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load match.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  function updateStat(
    playerId: string,
    field:
      | "kills"
      | "deaths"
      | "assists"
      | "acs"
      | "adr"
      | "kast",
    value: string,
  ) {
    setStats((current) =>
      current.map((stat) => {
        if (stat.playerId !== playerId) {
          return stat;
        }

        if (
          field === "adr" ||
          field === "kast"
        ) {
          return {
            ...stat,
            [field]: Math.max(
              0,
              numberValue(value),
            ),
          };
        }

        return {
          ...stat,
          [field]: Math.max(
            0,
            Math.round(numberValue(value)),
          ),
        };
      }),
    );
  }

  function handleScreenshot(
    file: File | null,
  ) {
    setError("");
    setMessage("");

    if (!file) {
      setScreenshot(null);
      setPreviewUrl("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(
        "Please upload a valid image file.",
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(
        "Screenshot must be smaller than 10 MB.",
      );
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setScreenshot(file);
    setPreviewUrl(
      URL.createObjectURL(file),
    );
  }

  async function runOCR() {
    if (!screenshot) {
      setError(
        "Upload a match scoreboard screenshot first.",
      );
      return;
    }

    try {
      setOcrLoading(true);
      setError("");
      setMessage("");

      const Tesseract =
        await import("tesseract.js");

      const result =
        await Tesseract.recognize(
          screenshot,
          "eng",
          {
            logger: () => {},
          },
        );

      const text =
        result.data.text || "";

      setOcrText(text);

      const parsed = parseScore(text);

      if (
        parsed.score1 !== null &&
        parsed.score2 !== null
      ) {
        setTeam1Score(
          String(parsed.score1),
        );

        setTeam2Score(
          String(parsed.score2),
        );

        setMessage(
          "OCR detected a possible final score. Verify it before saving.",
        );
      } else {
        setMessage(
          "OCR completed, but no reliable score was detected. Enter the score manually.",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "OCR failed.",
      );
    } finally {
      setOcrLoading(false);
    }
  }

  function clearOCR() {
    setOcrText("");
    setScreenshot(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl("");
  }

  function validateResult() {
    if (!match) {
      return "Match data is not loaded.";
    }

    const score1 = Number(team1Score);
    const score2 = Number(team2Score);

    if (
      !Number.isInteger(score1) ||
      !Number.isInteger(score2)
    ) {
      return "Scores must be whole numbers.";
    }

    if (
      score1 < 0 ||
      score2 < 0
    ) {
      return "Scores cannot be negative.";
    }

    if (score1 === score2) {
      return "A completed Valorant match cannot have a tied final score.";
    }

    if (
      !match.team1Id ||
      !match.team2Id
    ) {
      return "Both teams must be assigned before recording the result.";
    }

    return "";
  }

  async function saveResult() {
    if (!match) return;

    const validationError =
      validateResult();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const score1 =
        Number(team1Score);
      const score2 =
        Number(team2Score);

      const calculatedWinnerId =
        score1 > score2
          ? match.team1Id
          : match.team2Id;

      const payload = {
        id: match.id,
        matchNumber:
          match.matchNumber,
        stage: match.stage,
        team1Id:
          match.team1Id,
        team2Id:
          match.team2Id,
        scheduledAt:
          match.scheduledAt,
        map: match.map,
        bestOf:
          match.bestOf,
        team1Score:
          score1,
        team2Score:
          score2,
        status: "Completed",
        winnerId:
          calculatedWinnerId,
        mvpPlayerId:
          mvpPlayerId || undefined,
        topFraggerPlayerId:
          topFraggerPlayerId ||
          undefined,
        playerStats:
          stats.map((stat) => ({
            playerId:
              stat.playerId,
            playerName:
              stat.playerName,
            teamId:
              stat.teamId,
            kills:
              Math.max(
                0,
                Math.round(
                  stat.kills,
                ),
              ),
            deaths:
              Math.max(
                0,
                Math.round(
                  stat.deaths,
                ),
              ),
            assists:
              Math.max(
                0,
                Math.round(
                  stat.assists,
                ),
              ),
            acs:
              Math.max(
                0,
                Math.round(
                  stat.acs,
                ),
              ),
            adr:
              Math.max(
                0,
                Number(stat.adr) || 0,
              ),
            kast:
              Math.max(
                0,
                Number(stat.kast) || 0,
              ),
          })),
      };

      const response =
        await fetch(
          `/api/matches/${encodeURIComponent(
            match.id,
          )}`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              payload,
            ),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to save match result.",
        );
      }

      const savedMatch =
        normalizeMatch(
          data.match,
        );

      setMatch(savedMatch);

      setMessage(
        `${match.id} result saved successfully.`,
      );

      /*
       * Ask Match Center to check the automatic
       * tournament progression immediately after
       * the result has been saved.
       *
       * The Match Center page remains the owner of
       * the M13–M16 generation rules.
       */
      try {
        await fetch("/api/matches", {
          cache: "no-store",
        });
      } catch {
        /*
         * Result itself is already saved.
         * A Match Center refresh will still detect
         * the completed result.
         */
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save result.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070a10] text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <div className="text-sm font-black tracking-wider text-red-400">
            MATCH CENTER
          </div>

          <div className="mt-3 text-2xl font-black">
            Loading match...
          </div>
        </div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="min-h-screen bg-[#070a10] text-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
            <div className="text-xl font-black">
              MATCH NOT FOUND
            </div>

            <p className="mt-2 text-sm text-red-200">
              {error ||
                "The requested match does not exist."}
            </p>

            <Link
              href="/matches"
              className="mt-6 inline-flex rounded bg-red-500 px-5 py-3 text-xs font-black"
            >
              BACK TO MATCH CENTER
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isAutomatic =
    match.matchNumber >= 13;

  return (
    <main className="min-h-screen bg-[#070a10] text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6">
          <div className="flex flex-col gap-4 border-b border-[#1d2a3b] pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                href="/matches"
                className="text-xs font-black tracking-wider text-[#7b8da5] hover:text-white"
              >
                ← MATCH CENTER
              </Link>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-black text-red-300">
                  M
                  {String(
                    match.matchNumber,
                  ).padStart(2, "0")}
                </div>

                <div className="rounded border border-[#2a3a50] bg-[#101722] px-3 py-2 text-xs font-black text-[#b7c7da]">
                  {match.stage}
                </div>

                {isAutomatic && (
                  <div className="rounded border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-black text-purple-300">
                    AUTOMATIC PHASE 2
                  </div>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-black sm:text-4xl">
                RECORD MATCH RESULT
              </h1>

              <p className="mt-2 text-sm text-[#70829a]">
                {match.map} · BO
                {match.bestOf}
                {match.scheduledAt
                  ? ` · ${new Date(
                      match.scheduledAt,
                    ).toLocaleString()}`
                  : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/tournament/matches/${encodeURIComponent(
                  match.id,
                )}`}
                className="rounded border border-[#304159] bg-[#111a27] px-4 py-2 text-xs font-black text-[#c0cee0]"
              >
                PUBLIC MATCH ↗
              </Link>

              <Link
                href="/tournament"
                className="rounded border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-black text-red-300"
              >
                TOURNAMENT ↗
              </Link>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {message}
          </div>
        )}

        <section className="mb-6 rounded-xl border border-[#1d2a3b] bg-[#0b111a] p-5">
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
            <div className="rounded-xl border border-[#25364d] bg-[#0f1722] p-6 text-center md:text-right">
              <div className="text-[10px] font-black tracking-[0.2em] text-[#687a91]">
                TEAM 1
              </div>

              <div className="mt-3 text-xl font-black">
                {team1?.name ??
                  "TBD"}
              </div>

              <div className="mt-2 text-xs text-[#62758e]">
                {team1?.tag ?? ""}
              </div>
            </div>

            <div className="text-center">
              <div className="text-xs font-black tracking-[0.25em] text-red-400">
                FINAL SCORE
              </div>

              <div className="mt-2 text-5xl font-black">
                {team1Score}
                <span className="mx-3 text-[#44556b]">
                  :
                </span>
                {team2Score}
              </div>

              <div className="mt-2 text-[10px] font-black tracking-wider text-[#62758c]">
                {winnerId
                  ? `WINNER: ${
                      winnerId ===
                      match.team1Id
                        ? team1?.name
                        : team2?.name
                    }`
                  : "ENTER FINAL SCORE"}
              </div>
            </div>

            <div className="rounded-xl border border-[#25364d] bg-[#0f1722] p-6 text-center">
              <div className="text-[10px] font-black tracking-[0.2em] text-[#687a91]">
                TEAM 2
              </div>

              <div className="mt-3 text-xl font-black">
                {team2?.name ??
                  "TBD"}
              </div>

              <div className="mt-2 text-xs text-[#62758e]">
                {team2?.tag ?? ""}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <section className="space-y-6">
            <div className="rounded-xl border border-[#1d2a3b] bg-[#0b111a] p-5">
              <div>
                <h2 className="text-lg font-black">
                  FINAL SCORE
                </h2>

                <p className="mt-1 text-xs text-[#687a91]">
                  Enter the final map/match score.
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <label>
                  <span className="mb-2 block text-[9px] font-black tracking-wider text-[#687a91]">
                    {team1?.tag ??
                      "TEAM 1"}
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={team1Score}
                    onChange={(event) =>
                      setTeam1Score(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-lg border border-[#2a3a50] bg-[#0e151f] px-4 py-4 text-center text-2xl font-black outline-none focus:border-red-500/60"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-[9px] font-black tracking-wider text-[#687a91]">
                    {team2?.tag ??
                      "TEAM 2"}
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={team2Score}
                    onChange={(event) =>
                      setTeam2Score(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-lg border border-[#2a3a50] bg-[#0e151f] px-4 py-4 text-center text-2xl font-black outline-none focus:border-red-500/60"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-[#1d2a3b] bg-[#0b111a] p-5">
              <div>
                <h2 className="text-lg font-black">
                  SCOREBOARD OCR
                </h2>

                <p className="mt-1 text-xs text-[#687a91]">
                  Upload the scoreboard screenshot and
                  use OCR as a starting point.
                </p>
              </div>

              <label className="mt-5 flex min-h-[170px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#344861] bg-[#0e151f] p-5 text-center hover:border-red-500/50">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) =>
                    handleScreenshot(
                      event.target.files?.[0] ??
                        null,
                    )
                  }
                />

                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Uploaded scoreboard"
                    className="max-h-44 max-w-full rounded-lg object-contain"
                  />
                ) : (
                  <>
                    <div className="text-3xl">
                      +
                    </div>

                    <div className="mt-2 text-xs font-black">
                      UPLOAD SCOREBOARD
                    </div>

                    <div className="mt-1 text-[10px] text-[#63758c]">
                      PNG, JPG or WEBP · max 10 MB
                    </div>
                  </>
                )}
              </label>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={runOCR}
                  disabled={
                    !screenshot ||
                    ocrLoading
                  }
                  className="flex-1 rounded bg-purple-500 px-4 py-3 text-xs font-black text-white hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {ocrLoading
                    ? "READING..."
                    : "RUN OCR"}
                </button>

                <button
                  type="button"
                  onClick={clearOCR}
                  className="rounded border border-[#304159] bg-[#111a27] px-4 py-3 text-xs font-black text-[#b8c8da]"
                >
                  CLEAR
                </button>
              </div>

              {ocrText && (
                <div className="mt-4">
                  <div className="mb-2 text-[9px] font-black tracking-wider text-[#687a91]">
                    OCR TEXT
                  </div>

                  <textarea
                    value={ocrText}
                    onChange={(event) =>
                      setOcrText(
                        event.target.value,
                      )
                    }
                    rows={8}
                    className="w-full resize-none rounded-lg border border-[#26364b] bg-[#080d14] p-3 font-mono text-[10px] leading-5 text-[#a9bad0] outline-none"
                  />
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#1d2a3b] bg-[#0b111a] p-5">
              <h2 className="text-lg font-black">
                MATCH AWARDS
              </h2>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[9px] font-black tracking-wider text-[#687a91]">
                    MVP
                  </span>

                  <select
                    value={mvpPlayerId}
                    onChange={(event) =>
                      setMvpPlayerId(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-lg border border-[#26364b] bg-[#0e151f] px-3 py-3 text-sm outline-none"
                  >
                    <option value="">
                      Select MVP
                    </option>

                    {stats.map((stat) => (
                      <option
                        key={`mvp-${stat.playerId}`}
                        value={stat.playerId}
                      >
                        {stat.playerName} ·{" "}
                        {stat.teamName}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[9px] font-black tracking-wider text-[#687a91]">
                    TOP FRAGGER
                  </span>

                  <select
                    value={
                      topFraggerPlayerId
                    }
                    onChange={(event) =>
                      setTopFraggerPlayerId(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-lg border border-[#26364b] bg-[#0e151f] px-3 py-3 text-sm outline-none"
                  >
                    <option value="">
                      Select Top Fragger
                    </option>

                    {stats.map((stat) => (
                      <option
                        key={`frag-${stat.playerId}`}
                        value={stat.playerId}
                      >
                        {stat.playerName} ·{" "}
                        {stat.teamName}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#1d2a3b] bg-[#0b111a] p-5">
            <div className="flex flex-col gap-3 border-b border-[#1d2a3b] pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-black">
                  PLAYER STATISTICS
                </h2>

                <p className="mt-1 text-xs text-[#687a91]">
                  Edit the scoreboard statistics before
                  publishing the result.
                </p>
              </div>

              <div className="text-xs text-[#687a91]">
                {completedStats.length} players with
                entered stats
              </div>
            </div>

            {stats.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-sm font-black">
                  No player statistics found
                </div>

                <p className="mt-2 text-xs text-[#687a91]">
                  Team rosters need to be available before
                  player statistics can be recorded.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-6">
                {[team1, team2]
                  .filter(
                    (
                      team,
                    ): team is Team =>
                      Boolean(team),
                  )
                  .map((team) => {
                    const teamStats =
                      stats.filter(
                        (stat) =>
                          stat.teamId ===
                          team.id,
                      );

                    return (
                      <div
                        key={team.id}
                        className="overflow-hidden rounded-xl border border-[#26364b]"
                      >
                        <div className="border-b border-[#26364b] bg-[#101925] px-4 py-3">
                          <div className="text-sm font-black">
                            {team.name}
                          </div>

                          <div className="mt-1 text-[9px] font-black tracking-wider text-[#65778f]">
                            {team.tag}
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[800px] text-left">
                            <thead>
                              <tr className="border-b border-[#1e2b3d] bg-[#0d141e] text-[8px] font-black tracking-wider text-[#61738b]">
                                <th className="px-3 py-3">
                                  PLAYER
                                </th>
                                <th className="px-2 py-3 text-center">
                                  K
                                </th>
                                <th className="px-2 py-3 text-center">
                                  D
                                </th>
                                <th className="px-2 py-3 text-center">
                                  A
                                </th>
                                <th className="px-2 py-3 text-center">
                                  ACS
                                </th>
                                <th className="px-2 py-3 text-center">
                                  ADR
                                </th>
                                <th className="px-2 py-3 text-center">
                                  KAST
                                </th>
                                <th className="px-3 py-3">
                                  AWARDS
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {teamStats.map(
                                (stat) => {
                                  const isMvp =
                                    mvpPlayerId ===
                                    stat.playerId;

                                  const isFragger =
                                    topFraggerPlayerId ===
                                    stat.playerId;

                                  return (
                                    <tr
                                      key={
                                        stat.playerId
                                      }
                                      className="border-b border-[#151f2c] last:border-b-0"
                                    >
                                      <td className="px-3 py-3">
                                        <div className="text-xs font-black">
                                          {
                                            stat.playerName
                                          }
                                        </div>
                                      </td>

                                      {(
                                        [
                                          "kills",
                                          "deaths",
                                          "assists",
                                          "acs",
                                        ] as const
                                      ).map(
                                        (field) => (
                                          <td
                                            key={
                                              field
                                            }
                                            className="px-2 py-3"
                                          >
                                            <input
                                              type="number"
                                              min="0"
                                              value={
                                                stat[
                                                  field
                                                ]
                                              }
                                              onChange={(
                                                event,
                                              ) =>
                                                updateStat(
                                                  stat.playerId,
                                                  field,
                                                  event
                                                    .target
                                                    .value,
                                                )
                                              }
                                              className="w-16 rounded border border-[#293b52] bg-[#0d141e] px-2 py-2 text-center text-xs font-black outline-none focus:border-red-500/50"
                                            />
                                          </td>
                                        ),
                                      )}

                                      <td className="px-2 py-3">
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={
                                            stat.adr
                                          }
                                          onChange={(
                                            event,
                                          ) =>
                                            updateStat(
                                              stat.playerId,
                                              "adr",
                                              event
                                                .target
                                                .value,
                                            )
                                          }
                                          className="w-20 rounded border border-[#293b52] bg-[#0d141e] px-2 py-2 text-center text-xs font-black outline-none focus:border-red-500/50"
                                        />
                                      </td>

                                      <td className="px-2 py-3">
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          step="0.01"
                                          value={
                                            stat.kast
                                          }
                                          onChange={(
                                            event,
                                          ) =>
                                            updateStat(
                                              stat.playerId,
                                              "kast",
                                              event
                                                .target
                                                .value,
                                            )
                                          }
                                          className="w-20 rounded border border-[#293b52] bg-[#0d141e] px-2 py-2 text-center text-xs font-black outline-none focus:border-red-500/50"
                                        />
                                      </td>

                                      <td className="px-3 py-3">
                                        <div className="flex flex-wrap gap-1">
                                          {isMvp && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setMvpPlayerId(
                                                  "",
                                                )
                                              }
                                              className="rounded bg-yellow-500/15 px-2 py-1 text-[8px] font-black text-yellow-300"
                                            >
                                              MVP
                                            </button>
                                          )}

                                          {isFragger && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setTopFraggerPlayerId(
                                                  "",
                                                )
                                              }
                                              className="rounded bg-red-500/15 px-2 py-1 text-[8px] font-black text-red-300"
                                            >
                                              TOP FRAG
                                            </button>
                                          )}

                                          {!isMvp &&
                                            !isFragger && (
                                              <span className="text-[9px] text-[#52647b]">
                                                —
                                              </span>
                                            )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                },
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            <div className="mt-6 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
              <div className="text-[10px] font-black tracking-wider text-yellow-300">
                RESULT CHECK
              </div>

              <div className="mt-2 text-xs leading-5 text-[#8b98a9]">
                Saving this page marks the match as
                <strong className="mx-1 text-white">
                  Completed
                </strong>
                and records the winner in Supabase.
                Phase 2 progression is determined from the
                completed tournament results.
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={saveResult}
                disabled={saving}
                className="flex-1 rounded bg-red-500 px-5 py-4 text-xs font-black tracking-wider text-white hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "SAVING RESULT..."
                  : "SAVE FINAL RESULT"}
              </button>

              <Link
                href="/matches"
                className="rounded border border-[#304159] bg-[#111a27] px-6 py-4 text-center text-xs font-black text-[#bdcce0] hover:bg-[#182435]"
              >
                CANCEL
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
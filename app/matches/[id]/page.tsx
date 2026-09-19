"use client";

import Link from "next/link";
import {
  ChangeEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createWorker } from "tesseract.js";

import type {
  Match,
  PlayerStat,
} from "@/app/data/matches";

import type {
  Player,
  Team,
} from "@/app/data/teams";

const MATCHES_KEY = "tournament-matches";
const TEAMS_KEY = "tournament-teams";

const MAPS = [
  "ASCENT",
  "BIND",
  "BREEZE",
  "HAVEN",
  "ICEBOX",
  "LOTUS",
  "SUNSET",
  "SPLIT",
  "PEARL",
  "FRACTURE",
  "ABYSS",
  "CORRODE",
];

type ParsedPlayer = {
  playerName: string;
  teamId: string;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  detected: boolean;
};

type ParsedResult = {
  team1Score?: number;
  team2Score?: number;
  map?: string;
  players: ParsedPlayer[];
  mvpName?: string;
};

type OCRWord = {
  text: string;
  confidence?: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
};

type NumericOCR = {
  text: string;
  numbers: number[];
};

export default function MatchDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [match, setMatch] =
    useState<Match | null>(null);

  const [teams, setTeams] =
    useState<Team[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [ocrText, setOcrText] =
    useState("");

  const [parsedResult, setParsedResult] =
    useState<ParsedResult | null>(null);

  const [imagePreview, setImagePreview] =
    useState("");

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  useEffect(() => {
    params.then(({ id }) => {
      loadMatch(id);
    });
  }, [params]);

  function loadMatch(id: string) {
    try {
      const storedTeams =
        localStorage.getItem(
          TEAMS_KEY
        );

      const storedMatches =
        localStorage.getItem(
          MATCHES_KEY
        );

      const parsedTeams: Team[] =
        storedTeams
          ? JSON.parse(storedTeams)
          : [];

      const parsedMatches: Match[] =
        storedMatches
          ? JSON.parse(storedMatches)
          : [];

      const found =
        parsedMatches.find(
          (item) =>
            item.id === id
        );

      setTeams(parsedTeams);
      setMatch(found || null);
    } catch {
      setTeams([]);
      setMatch(null);
    } finally {
      setLoading(false);
    }
  }

  const team1 = useMemo(() => {
    if (!match) return undefined;

    return teams.find(
      (team) =>
        team.id === match.team1Id
    );
  }, [match, teams]);

  const team2 = useMemo(() => {
    if (!match) return undefined;

    return teams.find(
      (team) =>
        team.id === match.team2Id
    );
  }, [match, teams]);

  /*
   * ==========================================================
   * UPLOAD RESULT IMAGE
   * ==========================================================
   */

  async function handleUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith("image/")
    ) {
      setError(
        "Please upload a valid image."
      );

      return;
    }

    setError("");
    setMessage("");
    setParsedResult(null);
    setOcrText("");
    setProgress(0);

    const preview =
      URL.createObjectURL(file);

    setImagePreview(preview);
    setUploading(true);

    try {
      /*
       * ======================================================
       * PASS 1
       *
       * Read the whole image.
       * We mainly need player names and row positions.
       * ======================================================
       */

      const worker =
        await createWorker("eng");

      setProgress(10);

      const fullResult =
        await worker.recognize(file);

      setProgress(25);

      const fullText =
        fullResult.data.text || "";

      setOcrText(fullText);

      const words =
        ((fullResult.data as any)
          .words || []) as OCRWord[];

      /*
       * ======================================================
       * SCORE + MAP
       * ======================================================
       */

      const finalScore =
        detectScore(fullText);

      const map =
        detectMap(fullText);

      /*
       * ======================================================
       * REGISTERED PLAYERS
       * ======================================================
       */

      const registeredPlayers = [
        ...(team1?.players || []).map(
          (player) => ({
            player,
            teamId:
              team1?.id || "",
          })
        ),

        ...(team2?.players || []).map(
          (player) => ({
            player,
            teamId:
              team2?.id || "",
          })
        ),
      ];

      const parsedPlayers: ParsedPlayer[] =
        [];

      /*
       * ======================================================
       * PASS 2
       *
       * For every player:
       *
       * 1. Find their name.
       * 2. Get the Y coordinate.
       * 3. Crop ONLY the numeric scoreboard columns.
       * 4. OCR that crop with digits only.
       * ======================================================
       */

      for (
        let index = 0;
        index <
        registeredPlayers.length;
        index++
      ) {
        const item =
          registeredPlayers[index];

        setProgress(
          30 +
            Math.round(
              (index /
                registeredPlayers.length) *
                55
            )
        );

        const playerWord =
          findPlayerWord(
            words,
            item.player.name
          );

        let numericOCR:
          | NumericOCR
          | null =
          null;

        /*
         * Main numeric-column OCR.
         */
        if (playerWord) {
          numericOCR =
            await readNumericColumns(
              file,
              playerWord.bbox
            );
        }

        /*
         * Fallback using full OCR line.
         */
        if (
          !numericOCR ||
          !isValidKda(
            numericOCR.numbers
          )
        ) {
          const fallback =
            findPlayerLine(
              fullText,
              item.player.name
            );

          if (fallback) {
            numericOCR = {
              text: fallback,
              numbers:
                extractNumbers(
                  fallback
                ),
            };
          }
        }

        const stats =
          parseKda(
            numericOCR?.numbers ||
              []
          );

        parsedPlayers.push({
          playerName:
            item.player.name,

          teamId:
            item.teamId,

          kills:
            stats?.kills ?? 0,

          deaths:
            stats?.deaths ?? 0,

          assists:
            stats?.assists ?? 0,

          score:
            stats?.score ?? 0,

          detected:
            Boolean(stats),
        });
      }

      /*
       * ======================================================
       * MVP
       * ======================================================
       */

      const mvp =
        detectMvp(
          fullText,
          registeredPlayers.map(
            (item) =>
              item.player
          )
        );

      setProgress(100);

      await worker.terminate();

      setParsedResult({
        team1Score:
          finalScore?.team1,

        team2Score:
          finalScore?.team2,

        map,

        players:
          parsedPlayers,

        mvpName: mvp,
      });

      const detected =
        parsedPlayers.filter(
          (player) =>
            player.detected
        ).length;

      if (
        detected ===
        parsedPlayers.length
      ) {
        setMessage(
          `All ${parsedPlayers.length} registered players detected. Review the values before publishing.`
        );
      } else {
        setMessage(
          `${detected} of ${parsedPlayers.length} players detected. MANUAL rows can be corrected below.`
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        "OCR processing failed. Please try a clearer result screenshot."
      );
    } finally {
      setUploading(false);
    }
  }

  /*
   * ==========================================================
   * NUMERIC COLUMN OCR
   * ==========================================================
   *
   * The sample screenshot has approximately:
   *
   * PLAYER | KDA | SCORE
   *
   * We don't OCR the player name again.
   *
   * We crop the right side where KDA and Score live.
   *
   * This avoids:
   *
   * 24/M/5
   * w/as8
   * ni6/a
   *
   * becoming unusable.
   */

  async function readNumericColumns(
    file: File,
    bbox: OCRWord["bbox"]
  ): Promise<NumericOCR | null> {
    const image =
      await loadImage(file);

    /*
     * Scoreboard row height.
     */
    const rowHeight =
      Math.max(
        28,
        bbox.y1 - bbox.y0
      );

    /*
     * Add generous vertical padding
     * around the player row.
     */
    const top =
      Math.max(
        0,
        bbox.y0 -
          rowHeight * 2.2
      );

    const bottom =
      Math.min(
        image.naturalHeight,
        bbox.y1 +
          rowHeight * 2.2
      );

    /*
     * --------------------------------------------------------
     * NUMERIC AREA
     *
     * Based on the provided scoreboard layout:
     *
     * PLAYER: left
     * KDA: middle/right
     * SCORE: far right
     *
     * We deliberately crop the right ~48%.
     * --------------------------------------------------------
     */

    const numericStart =
      Math.floor(
        image.naturalWidth *
          0.50
      );

    const numericWidth =
      image.naturalWidth -
      numericStart;

    const canvas =
      document.createElement(
        "canvas"
      );

    /*
     * Upscale considerably.
     */
    const scale = 3;

    canvas.width =
      numericWidth * scale;

    canvas.height =
      (bottom - top) * scale;

    const ctx =
      canvas.getContext(
        "2d"
      );

    if (!ctx) {
      return null;
    }

    /*
     * White background.
     */
    ctx.fillStyle =
      "#ffffff";

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.imageSmoothingEnabled =
      false;

    ctx.drawImage(
      image,

      numericStart,
      top,
      numericWidth,
      bottom - top,

      0,
      0,
      canvas.width,
      canvas.height
    );

    /*
     * --------------------------------------------------------
     * SECOND OCR WORKER
     *
     * Numbers only.
     * --------------------------------------------------------
     */

    const worker =
      await createWorker("eng");

    try {
      await worker.setParameters(
        {
          tessedit_char_whitelist:
            "0123456789",
          preserve_interword_spaces:
            "1",
          tessedit_pageseg_mode:
            "6",
        } as any
      );

      const result =
        await worker.recognize(
          canvas
        );

      const text =
        result.data.text ||
        "";

      const numbers =
        extractNumbers(text);

      /*
       * If the first crop misses the
       * KDA because of column position,
       * try a wider crop.
       */
      if (
        !isValidKda(numbers)
      ) {
        const wider =
          await readWiderNumericArea(
            image,
            top,
            bottom
          );

        if (wider) {
          return wider;
        }
      }

      return {
        text,
        numbers,
      };
    } finally {
      await worker.terminate();
    }
  }

  /*
   * Wider fallback crop.
   */

  async function readWiderNumericArea(
    image: HTMLImageElement,
    top: number,
    bottom: number
  ): Promise<NumericOCR | null> {
    const start =
      Math.floor(
        image.naturalWidth *
          0.40
      );

    const width =
      image.naturalWidth -
      start;

    const scale = 3;

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      width * scale;

    canvas.height =
      (bottom - top) * scale;

    const ctx =
      canvas.getContext(
        "2d"
      );

    if (!ctx) {
      return null;
    }

    ctx.fillStyle =
      "#ffffff";

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.imageSmoothingEnabled =
      false;

    ctx.drawImage(
      image,

      start,
      top,
      width,
      bottom - top,

      0,
      0,
      canvas.width,
      canvas.height
    );

    const worker =
      await createWorker("eng");

    try {
      await worker.setParameters(
        {
          tessedit_char_whitelist:
            "0123456789",
          preserve_interword_spaces:
            "1",
          tessedit_pageseg_mode:
            "6",
        } as any
      );

      const result =
        await worker.recognize(
          canvas
        );

      const text =
        result.data.text ||
        "";

      return {
        text,
        numbers:
          extractNumbers(text),
      };
    } finally {
      await worker.terminate();
    }
  }

  /*
   * ==========================================================
   * FIND PLAYER WORD
   * ==========================================================
   */

  function findPlayerWord(
    words: OCRWord[],
    playerName: string
  ) {
    const target =
      normalizeName(
        playerName
      );

    /*
     * Exact.
     */
    const exact =
      words.find(
        (word) => {
          const value =
            normalizeName(
              word.text
            );

          return (
            value === target ||
            value.includes(target) ||
            target.includes(value)
          );
        }
      );

    if (exact) {
      return exact;
    }

    /*
     * Token fallback.
     */
    const tokens =
      playerName
        .split(/\s+/)
        .map((token) =>
          normalizeName(
            token
          )
        )
        .filter(
          (token) =>
            token.length >= 3
        );

    let best:
      | OCRWord
      | null =
      null;

    let bestScore = 0;

    for (
      const word of words
    ) {
      const value =
        normalizeName(
          word.text
        );

      let score = 0;

      for (
        const token of tokens
      ) {
        if (
          value.includes(token) ||
          token.includes(value)
        ) {
          score++;
        }
      }

      if (
        score > bestScore
      ) {
        bestScore =
          score;

        best = word;
      }
    }

    if (
      bestScore > 0
    ) {
      return best;
    }

    return null;
  }

  /*
   * ==========================================================
   * NUMBER EXTRACTION
   * ==========================================================
   */

  function extractNumbers(
    text: string
  ) {
    /*
     * Because the numeric crop is
     * numbers-only OCR, this becomes
     * much more reliable.
     */
    return (
      text.match(
        /\d+/g
      ) || []
    ).map(
      (value) =>
        Number(value)
    );
  }

  function parseKda(
    numbers: number[]
  ) {
    if (
      numbers.length < 3
    ) {
      return null;
    }

    /*
     * Search every possible sequence.
     */
    for (
      let i = 0;
      i <=
      numbers.length - 3;
      i++
    ) {
      const kills =
        numbers[i];

      const deaths =
        numbers[i + 1];

      const assists =
        numbers[i + 2];

      /*
       * Valorant scoreboard K/D/A
       * should be reasonable values.
       */
      if (
        kills < 0 ||
        kills > 60 ||
        deaths < 0 ||
        deaths > 60 ||
        assists < 0 ||
        assists > 60
      ) {
        continue;
      }

      let score = 0;

      /*
       * Score / ACS is normally
       * considerably larger.
       */
      for (
        let j = i + 3;
        j < numbers.length;
        j++
      ) {
        if (
          numbers[j] >= 100
        ) {
          score =
            numbers[j];

          break;
        }
      }

      /*
       * The sample scoreboard has
       * values such as:
       *
       * 24 11 5 342
       * 19 14 8 268
       * 17 13 6 240
       */
      if (
        score > 0
      ) {
        return {
          kills,
          deaths,
          assists,
          score,
        };
      }

      /*
       * Accept KDA even if score OCR
       * failed.
       */
      return {
        kills,
        deaths,
        assists,
        score: 0,
      };
    }

    return null;
  }

  function isValidKda(
    numbers: number[]
  ) {
    return Boolean(
      parseKda(numbers)
    );
  }

  /*
   * ==========================================================
   * FULL OCR FALLBACK
   * ==========================================================
   */

  function findPlayerLine(
    text: string,
    playerName: string
  ) {
    const lines =
      text
        .split(/\r?\n/)
        .map((line) =>
          line.trim()
        )
        .filter(Boolean);

    const target =
      normalizeName(
        playerName
      );

    const exact =
      lines.find(
        (line) =>
          normalizeName(
            line
          ).includes(target)
      );

    if (exact) {
      return exact;
    }

    const tokens =
      playerName
        .split(/\s+/)
        .map((token) =>
          normalizeName(
            token
          )
        )
        .filter(
          (token) =>
            token.length >= 3
        );

    return lines.find(
      (line) => {
        const normalized =
          normalizeName(
            line
          );

        const matches =
          tokens.filter(
            (token) =>
              normalized.includes(
                token
              )
          );

        return (
          matches.length >=
          Math.max(
            1,
            Math.ceil(
              tokens.length / 2
            )
          )
        );
      }
    );
  }

  /*
   * ==========================================================
   * SCORE
   * ==========================================================
   */

  function detectScore(
    text: string
  ) {
    const matches =
      text.match(
        /\b(\d{1,2})\s*[-:]\s*(\d{1,2})\b/g
      );

    if (!matches) {
      return null;
    }

    for (
      const value of matches
    ) {
      const numbers =
        value.match(
          /\d+/g
        );

      if (
        !numbers ||
        numbers.length < 2
      ) {
        continue;
      }

      const team1 =
        Number(numbers[0]);

      const team2 =
        Number(numbers[1]);

      if (
        team1 <= 30 &&
        team2 <= 30
      ) {
        return {
          team1,
          team2,
        };
      }
    }

    return null;
  }

  /*
   * ==========================================================
   * MAP
   * ==========================================================
   */

  function detectMap(
    text: string
  ) {
    const upper =
      text.toUpperCase();

    const found =
      MAPS.find(
        (map) =>
          upper.includes(map)
      );

    if (!found) {
      return undefined;
    }

    return (
      found.charAt(0) +
      found
        .slice(1)
        .toLowerCase()
    );
  }

  /*
   * ==========================================================
   * MVP
   * ==========================================================
   */

  function detectMvp(
    text: string,
    players: Player[]
  ) {
    const lines =
      text.split(/\r?\n/);

    for (
      let i = 0;
      i < lines.length;
      i++
    ) {
      const line =
        lines[i];

      if (
        !/mvp/i.test(line)
      ) {
        continue;
      }

      const nearby =
        lines.slice(
          Math.max(
            0,
            i - 2
          ),
          i + 3
        );

      for (
        const player of players
      ) {
        const name =
          normalizeName(
            player.name
          );

        if (
          nearby.some(
            (nearbyLine) =>
              normalizeName(
                nearbyLine
              ).includes(name)
          )
        ) {
          return player.name;
        }
      }
    }

    return undefined;
  }

  /*
   * ==========================================================
   * EDIT PLAYER
   * ==========================================================
   */

  function updatePlayer(
    index: number,
    field:
      | "kills"
      | "deaths"
      | "assists"
      | "score",
    value: string
  ) {
    if (!parsedResult) {
      return;
    }

    const players =
      parsedResult.players.map(
        (player, i) => {
          if (
            i !== index
          ) {
            return player;
          }

          return {
            ...player,

            [field]:
              Math.max(
                0,
                Number(value) || 0
              ),

            detected:
              true,
          };
        }
      );

    setParsedResult({
      ...parsedResult,
      players,
    });
  }

  function updateScore(
    side: 1 | 2,
    value: string
  ) {
    if (!parsedResult) {
      return;
    }

    setParsedResult({
      ...parsedResult,

      ...(side === 1
        ? {
            team1Score:
              Number(value) || 0,
          }
        : {
            team2Score:
              Number(value) || 0,
          }),
    });
  }

  function selectMvp(
    playerName: string
  ) {
    if (!parsedResult) {
      return;
    }

    setParsedResult({
      ...parsedResult,
      mvpName:
        playerName,
    });
  }

  /*
   * ==========================================================
   * TOP FRAGGER
   * ==========================================================
   */

  function getTopFragger() {
    if (
      !parsedResult ||
      parsedResult.players.length ===
        0
    ) {
      return null;
    }

    return [
      ...parsedResult.players,
    ].sort((a, b) => {
      if (
        b.kills !==
        a.kills
      ) {
        return (
          b.kills -
          a.kills
        );
      }

      if (
        b.assists !==
        a.assists
      ) {
        return (
          b.assists -
          a.assists
        );
      }

      return (
        b.score -
        a.score
      );
    })[0];
  }

  /*
   * ==========================================================
   * SAVE RESULT
   * ==========================================================
   */

  function saveResult() {
    if (
      !match ||
      !parsedResult
    ) {
      return;
    }

    setError("");
    setMessage("");

    const score1 =
      parsedResult.team1Score;

    const score2 =
      parsedResult.team2Score;

    if (
      score1 === undefined ||
      score2 === undefined
    ) {
      setError(
        "Enter both final scores."
      );

      return;
    }

    if (
      score1 === score2
    ) {
      setError(
        "A completed match cannot have a tied score."
      );

      return;
    }

    const missing =
      parsedResult.players.filter(
        (player) =>
          !player.detected
      );

    if (
      missing.length > 0
    ) {
      setError(
        `${missing.length} player row(s) still need review. Enter their K/D/A and score before publishing.`
      );

      return;
    }

    const winnerId =
      score1 > score2
        ? match.team1Id
        : match.team2Id;

    const playerStats: PlayerStat[] =
      parsedResult.players.map(
        (player) => {
          const registeredPlayer =
            teams
              .flatMap(
                (team) =>
                  team.players
              )
              .find(
                (item) =>
                  normalizeName(
                    item.name
                  ) ===
                  normalizeName(
                    player.playerName
                  )
              );

          return {
            playerId:
              registeredPlayer?.id ||
              `player-${normalizeName(
                player.playerName
              )}`,

            playerName:
              player.playerName,

            teamId:
              player.teamId,

            kills:
              player.kills,

            deaths:
              player.deaths,

            assists:
              player.assists,

            acs:
              player.score,

            /*
             * These remain 0 because
             * the supplied screenshot
             * does not contain ADR/KAST.
             *
             * They can be added later
             * if the uploaded scoreboard
             * contains those fields.
             */
            adr: 0,

            kast: 0,
          };
        }
      );

    const mvp =
      parsedResult.mvpName
        ? playerStats.find(
            (player) =>
              normalizeName(
                player.playerName
              ) ===
              normalizeName(
                parsedResult.mvpName ||
                  ""
              )
          )
        : undefined;

    const topFragger =
      getTopFragger();

    const topFraggerStat =
      topFragger
        ? playerStats.find(
            (player) =>
              normalizeName(
                player.playerName
              ) ===
              normalizeName(
                topFragger.playerName
              )
          )
        : undefined;

    const updatedMatch: Match = {
      ...match,

      map:
        parsedResult.map ||
        match.map,

      team1Score:
        score1,

      team2Score:
        score2,

      status:
        "Completed",

      winnerId,

      mvpPlayerId:
        mvp?.playerId,

      topFraggerPlayerId:
        topFraggerStat?.playerId,

      playerStats,
    };

    try {
      const stored =
        localStorage.getItem(
          MATCHES_KEY
        );

      const matches: Match[] =
        stored
          ? JSON.parse(stored)
          : [];

      const updatedMatches =
        matches.map(
          (item) =>
            item.id === match.id
              ? updatedMatch
              : item
        );

      localStorage.setItem(
        MATCHES_KEY,
        JSON.stringify(
          updatedMatches
        )
      );

      window.dispatchEvent(
        new Event(
          "tournament-matches-updated"
        )
      );

      setMatch(
        updatedMatch
      );

      setMessage(
        "Result published successfully. Standings, MVP and player statistics have been updated."
      );
    } catch {
      setError(
        "Unable to save the result."
      );
    }
  }

  /*
   * ==========================================================
   * LOADING
   * ==========================================================
   */

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-[10px] font-black tracking-[0.25em] text-cyan-400 uppercase">
            Loading Match...
          </div>
        </div>
      </PageShell>
    );
  }

  if (!match) {
    return (
      <PageShell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="border border-red-500/30 bg-red-500/[0.04] p-8 text-center">
            <div className="text-sm font-black uppercase">
              Match Not Found
            </div>

            <Link
              href="/matches"
              className="mt-5 inline-block border border-white/10 px-5 py-3 text-[9px] font-black tracking-wider uppercase"
            >
              ← Match Center
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  const detectedCount =
    parsedResult?.players.filter(
      (player) =>
        player.detected
    ).length || 0;

  const winner =
    parsedResult
      ? getWinnerName(
          parsedResult,
          team1,
          team2
        )
      : "NOT DETERMINED";

  return (
    <PageShell>
      {/* HEADER */}
      <header className="border-b border-white/10 pb-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="text-[9px] font-black tracking-[0.3em] text-cyan-400 uppercase">
              Result Recorder //
              Match #{match.matchNumber}
            </div>

            <h1 className="mt-2 text-3xl font-black uppercase">
              Upload Match Result
            </h1>

            <p className="mt-2 text-[10px] text-white/30">
              Upload the official scoreboard screenshot
              and review every player before publishing.
            </p>
          </div>

          <Link
            href="/matches"
            className="border border-white/10 px-5 py-3 text-[9px] font-black tracking-wider uppercase hover:border-cyan-400/40 hover:text-cyan-400"
          >
            ← Match Center
          </Link>
        </div>
      </header>

      {/* MATCH */}
      <section className="mt-6 border border-white/10 bg-[#0b1119]">
        <div className="grid md:grid-cols-[1fr_auto_1fr]">
          <TeamBox
            team={team1}
            side="right"
          />

          <div className="flex flex-col items-center justify-center border-y border-white/10 px-10 py-7 md:border-x md:border-y-0">
            <div className="text-[8px] font-black tracking-[0.2em] text-white/25 uppercase">
              {match.stage}
            </div>

            <div className="mt-2 text-3xl font-black">
              {match.team1Score}

              <span className="mx-3 text-white/20">
                —
              </span>

              {match.team2Score}
            </div>

            <div className="mt-2 text-[8px] font-black tracking-[0.2em] text-cyan-400 uppercase">
              {match.map}
              {" // BO"}
              {match.bestOf}
            </div>
          </div>

          <TeamBox
            team={team2}
            side="left"
          />
        </div>
      </section>

      {/* UPLOAD */}
      <section className="mt-6 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <div className="border border-cyan-400/20 bg-[#0b1119]">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="text-[9px] font-black tracking-[0.25em] text-cyan-400 uppercase">
              Result Recorder
            </div>

            <div className="mt-1 text-lg font-black uppercase">
              Upload Result Image
            </div>
          </div>

          <div className="p-5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={
                handleUpload
              }
            />

            <button
              type="button"
              disabled={uploading}
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="flex min-h-[170px] w-full flex-col items-center justify-center border border-dashed border-cyan-400/30 bg-cyan-400/[0.025] px-6 text-center hover:border-cyan-400/60 disabled:opacity-50"
            >
              <div className="text-4xl text-cyan-400">
                {uploading
                  ? "◌"
                  : "↑"}
              </div>

              <div className="mt-3 text-xs font-black tracking-[0.18em] uppercase">
                {uploading
                  ? "Reading Scoreboard..."
                  : "Upload Match Result"}
              </div>

              <div className="mt-2 text-[9px] text-white/30">
                PNG / JPG / WEBP
              </div>
            </button>

            {uploading && (
              <div className="mt-4">
                <div className="flex justify-between text-[8px] font-black uppercase">
                  <span className="text-white/30">
                    OCR
                  </span>

                  <span className="text-cyan-400">
                    {progress}%
                  </span>
                </div>

                <div className="mt-2 h-1 bg-white/10">
                  <div
                    className="h-full bg-cyan-400 transition-all"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {imagePreview && (
              <div className="mt-5 overflow-hidden border border-white/10 bg-black">
                <div className="border-b border-white/10 px-4 py-3 text-[8px] font-black tracking-[0.2em] text-white/30 uppercase">
                  Uploaded Image
                </div>

                <img
                  src={imagePreview}
                  alt="Uploaded match result"
                  className="max-h-[430px] w-full object-contain"
                />
              </div>
            )}

            {message && (
              <div className="mt-4 border border-emerald-400/30 bg-emerald-400/[0.04] p-4 text-[9px] font-bold text-emerald-400">
                {message}
              </div>
            )}

            {error && (
              <div className="mt-4 border border-red-500/30 bg-red-500/[0.04] p-4 text-[9px] font-bold text-red-400">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* OCR OUTPUT */}
        <div className="border border-white/10 bg-[#0b1119]">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="text-[9px] font-black tracking-[0.25em] text-white/30 uppercase">
              OCR Output
            </div>

            <div className="mt-1 text-lg font-black uppercase">
              Detected Text
            </div>
          </div>

          <div className="max-h-[560px] overflow-auto p-5">
            {ocrText ? (
              <pre className="whitespace-pre-wrap font-mono text-[10px] leading-5 text-white/50">
                {ocrText}
              </pre>
            ) : (
              <div className="flex min-h-[400px] items-center justify-center text-center text-[9px] font-black tracking-wider text-white/20 uppercase">
                Upload a result image to begin.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* REVIEW */}
      {parsedResult && (
        <section className="mt-6 border border-yellow-400/25 bg-[#0b1119]">
          <div className="border-b border-white/10 px-5 py-5">
            <div className="text-[9px] font-black tracking-[0.25em] text-yellow-400 uppercase">
              Step 2
            </div>

            <h2 className="mt-1 text-lg font-black uppercase">
              Review Detected Result
            </h2>

            <p className="mt-1 text-[9px] text-white/30">
              The system reads the numeric scoreboard
              columns separately from the player names.
            </p>
          </div>

          <div className="p-5">
            {/* SCORE */}
            <div className="grid gap-4 md:grid-cols-3">
              <Field
                label={
                  team1?.name ||
                  "TEAM 1"
                }
                value={
                  parsedResult.team1Score ??
                  ""
                }
                type="number"
                onChange={(value) =>
                  updateScore(
                    1,
                    value
                  )
                }
              />

              <Field
                label="MAP"
                value={
                  parsedResult.map ||
                  ""
                }
                onChange={(value) =>
                  setParsedResult({
                    ...parsedResult,
                    map: value,
                  })
                }
              />

              <Field
                label={
                  team2?.name ||
                  "TEAM 2"
                }
                value={
                  parsedResult.team2Score ??
                  ""
                }
                type="number"
                onChange={(value) =>
                  updateScore(
                    2,
                    value
                  )
                }
              />
            </div>

            {/* WINNER */}
            <div className="mt-5 border border-white/10 bg-[#080c12] p-4">
              <div className="text-[8px] font-black tracking-[0.2em] text-white/30 uppercase">
                Detected Winner
              </div>

              <div className="mt-2 text-sm font-black text-emerald-400 uppercase">
                {winner}
              </div>
            </div>

            {/* PLAYER RESULTS */}
            <div className="mt-6">
              <div className="mb-3 flex flex-col justify-between gap-2 md:flex-row md:items-end">
                <div>
                  <div className="text-[9px] font-black tracking-[0.2em] text-cyan-400 uppercase">
                    Player Result
                  </div>

                  <h3 className="mt-1 text-sm font-black uppercase">
                    Detected Player Statistics
                  </h3>
                </div>

                <div className="text-[8px] font-black tracking-wider text-white/25 uppercase">
                  {detectedCount} /{" "}
                  {parsedResult.players.length}{" "}
                  Detected
                </div>
              </div>

              <div className="overflow-x-auto border border-white/10">
                <table className="w-full min-w-[900px] border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      <Header align="left">
                        Player
                      </Header>

                      <Header>
                        Team
                      </Header>

                      <Header>
                        K
                      </Header>

                      <Header>
                        D
                      </Header>

                      <Header>
                        A
                      </Header>

                      <Header>
                        Score
                      </Header>

                      <Header>
                        MVP
                      </Header>

                      <Header>
                        OCR
                      </Header>
                    </tr>
                  </thead>

                  <tbody>
                    {parsedResult.players.map(
                      (
                        player,
                        index
                      ) => (
                        <tr
                          key={
                            player.playerName
                          }
                          className="border-b border-white/5"
                        >
                          <td className="px-4 py-4">
                            <div className="text-[10px] font-black uppercase">
                              {
                                player.playerName
                              }
                            </div>
                          </td>

                          <td className="px-3 text-center text-[8px] font-black text-white/35 uppercase">
                            {player.teamId ===
                            team1?.id
                              ? team1.name
                              : team2?.name}
                          </td>

                          <td className="px-3">
                            <SmallInput
                              value={
                                player.kills
                              }
                              onChange={(
                                value
                              ) =>
                                updatePlayer(
                                  index,
                                  "kills",
                                  value
                                )
                              }
                            />
                          </td>

                          <td className="px-3">
                            <SmallInput
                              value={
                                player.deaths
                              }
                              onChange={(
                                value
                              ) =>
                                updatePlayer(
                                  index,
                                  "deaths",
                                  value
                                )
                              }
                            />
                          </td>

                          <td className="px-3">
                            <SmallInput
                              value={
                                player.assists
                              }
                              onChange={(
                                value
                              ) =>
                                updatePlayer(
                                  index,
                                  "assists",
                                  value
                                )
                              }
                            />
                          </td>

                          <td className="px-3">
                            <SmallInput
                              value={
                                player.score
                              }
                              onChange={(
                                value
                              ) =>
                                updatePlayer(
                                  index,
                                  "score",
                                  value
                                )
                              }
                            />
                          </td>

                          <td className="px-3 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                selectMvp(
                                  player.playerName
                                )
                              }
                              className={`border px-3 py-2 text-[8px] font-black uppercase ${
                                parsedResult.mvpName ===
                                player.playerName
                                  ? "border-yellow-400 bg-yellow-400/10 text-yellow-400"
                                  : "border-white/10 text-white/30 hover:border-yellow-400/40 hover:text-yellow-400"
                              }`}
                            >
                              {parsedResult.mvpName ===
                              player.playerName
                                ? "MVP"
                                : "SELECT"}
                            </button>
                          </td>

                          <td className="px-3 text-center">
                            {player.detected ? (
                              <span className="text-[8px] font-black tracking-wider text-emerald-400 uppercase">
                                DETECTED
                              </span>
                            ) : (
                              <span className="text-[8px] font-black tracking-wider text-yellow-400 uppercase">
                                MANUAL
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TOP FRAGGER */}
            {getTopFragger() && (
              <div className="mt-5 border border-cyan-400/20 bg-cyan-400/[0.03] p-4">
                <div className="text-[8px] font-black tracking-[0.2em] text-cyan-400 uppercase">
                  Automatic Top Fragger
                </div>

                <div className="mt-2 flex items-center gap-4">
                  <div className="text-sm font-black uppercase">
                    {
                      getTopFragger()
                        ?.playerName
                    }
                  </div>

                  <div className="text-[9px] font-bold text-white/30">
                    {
                      getTopFragger()
                        ?.kills
                    }{" "}
                    KILLS
                  </div>
                </div>
              </div>
            )}

            {/* SAVE */}
            <div className="mt-6 flex flex-col justify-between gap-5 border-t border-white/10 pt-5 md:flex-row md:items-center">
              <div>
                <div className="text-[8px] font-black tracking-[0.2em] text-white/25 uppercase">
                  Publishing Result
                </div>

                <div className="mt-1 text-[9px] text-white/30">
                  The match becomes Completed and feeds
                  standings, MVP and player statistics.
                </div>
              </div>

              <button
                type="button"
                onClick={saveResult}
                className="bg-cyan-400 px-7 py-4 text-[9px] font-black tracking-[0.18em] text-black uppercase hover:bg-cyan-300"
              >
                Save & Publish Result →
              </button>
            </div>
          </div>
        </section>
      )}
    </PageShell>
  );
}

/*
 * ============================================================
 * UI COMPONENTS
 * ============================================================
 */

function PageShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#050a10] px-4 py-6 text-white md:px-8">
      <div className="mx-auto max-w-[1280px]">
        {children}
      </div>
    </main>
  );
}

function TeamBox({
  team,
  side,
}: {
  team?: Team;
  side: "left" | "right";
}) {
  return (
    <div
      className={`flex items-center gap-4 p-6 ${
        side === "right"
          ? "justify-end text-right"
          : "justify-start"
      }`}
    >
      {side === "left" &&
        team && (
          <TeamLogo team={team} />
        )}

      <div>
        <div className="text-sm font-black uppercase">
          {team?.name || "TBD"}
        </div>

        <div className="mt-1 text-[8px] font-black tracking-wider text-white/25 uppercase">
          {team?.tag || "TBD"}
        </div>
      </div>

      {side === "right" &&
        team && (
          <TeamLogo team={team} />
        )}
    </div>
  );
}

function TeamLogo({
  team,
}: {
  team: Team;
}) {
  if (team.logo) {
    return (
      <img
        src={team.logo}
        alt=""
        className="h-12 w-12 object-contain"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center border border-white/10 bg-[#080c12] text-[10px] font-black text-cyan-400">
      {team.tag.slice(0, 2)}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (
    value: string
  ) => void;
  type?: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-[8px] font-black tracking-[0.18em] text-white/30 uppercase">
        {label}
      </span>

      <input
        type={type}
        min={
          type === "number"
            ? 0
            : undefined
        }
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full border border-white/10 bg-[#080c12] px-4 py-3 text-sm font-black outline-none focus:border-cyan-400"
      />
    </label>
  );
}

function SmallInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <input
      type="number"
      min="0"
      value={value}
      onChange={(event) =>
        onChange(
          event.target.value
        )
      }
      className="w-14 border border-white/10 bg-[#080c12] px-2 py-2 text-center text-xs font-black outline-none focus:border-cyan-400"
    />
  );
}

function Header({
  children,
  align = "center",
}: {
  children: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <th
      className={`px-3 py-3 text-${align} text-[8px] font-black tracking-wider text-white/30 uppercase`}
    >
      {children}
    </th>
  );
}

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function normalizeName(
  value: string
) {
  return value
    .toLowerCase()
    .replace(/[|]/g, "l")
    .replace(/[^a-z0-9]/g, "");
}

function loadImage(
  file: File
): Promise<HTMLImageElement> {
  return new Promise(
    (resolve, reject) => {
      const image =
        new Image();

      const url =
        URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(
          url
        );

        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(
          url
        );

        reject(
          new Error(
            "Unable to load image"
          )
        );
      };

      image.src = url;
    }
  );
}

function getWinnerName(
  result: ParsedResult,
  team1?: Team,
  team2?: Team
) {
  if (
    result.team1Score ===
      undefined ||
    result.team2Score ===
      undefined
  ) {
    return "NOT DETERMINED";
  }

  if (
    result.team1Score ===
    result.team2Score
  ) {
    return "TIED — REVIEW RESULT";
  }

  return result.team1Score >
    result.team2Score
    ? team1?.name ||
        "TEAM 1"
    : team2?.name ||
        "TEAM 2";
}
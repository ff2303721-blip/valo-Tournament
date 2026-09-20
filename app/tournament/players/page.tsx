"use client";

import Link from "next/link";
import { TournamentBrand } from "../components/tournament-brand";
import { useEffect, useMemo, useState } from "react";

import type {
  Match,
  PlayerStat,
} from "@/app/data/matches";

import type {
  Team,
  Player,
} from "@/app/data/teams";

const MATCHES_KEY = "tournament-matches";
const TEAMS_KEY = "tournament-teams";

const STAGES = [
  "All Matches",
  "Group Stage",
  "Qualifier 1",
  "Eliminator",
  "Qualifier 2",
  "Grand Final",
];

type PlayerRow = {
  player: Player;
  team: Team;

  matches: number;
  wins: number;
  losses: number;

  kills: number;
  deaths: number;
  assists: number;

  acsTotal: number;
  adrTotal: number;
  kastTotal: number;

  acsMatches: number;
  adrMatches: number;
  kastMatches: number;

  mvp: number;
  topFragger: number;
};

export default function PlayerStatisticsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  const [stageFilter, setStageFilter] =
    useState("All Matches");

  const [teamFilter, setTeamFilter] =
    useState("ALL");

  const [search, setSearch] =
    useState("");

  useEffect(() => {
    loadData();

    const refresh = () => {
      loadData();
    };

    window.addEventListener(
      "tournament-matches-updated",
      refresh
    );

    window.addEventListener(
      "storage",
      refresh
    );

    const interval =
      window.setInterval(
        refresh,
        1000
      );

    return () => {
      window.removeEventListener(
        "tournament-matches-updated",
        refresh
      );

      window.removeEventListener(
        "storage",
        refresh
      );

      window.clearInterval(
        interval
      );
    };
  }, []);

  function loadData() {
    try {
      const storedTeams =
        localStorage.getItem(
          TEAMS_KEY
        );

      const storedMatches =
        localStorage.getItem(
          MATCHES_KEY
        );

      setTeams(
        storedTeams
          ? JSON.parse(storedTeams)
          : []
      );

      setMatches(
        storedMatches
          ? JSON.parse(storedMatches)
          : []
      );
    } catch {
      setTeams([]);
      setMatches([]);
    }
  }

  /*
   * Only published/completed matches
   * contribute to player statistics.
   */
  const completedMatches =
    useMemo(() => {
      return matches.filter(
        (match) =>
          match.status ===
          "Completed"
      );
    }, [matches]);

  /*
   * Apply tournament stage filter.
   */
  const filteredMatches =
    useMemo(() => {
      if (
        stageFilter ===
        "All Matches"
      ) {
        return completedMatches;
      }

      return completedMatches.filter(
        (match) =>
          match.stage ===
          stageFilter
      );
    }, [
      completedMatches,
      stageFilter,
    ]);

  /*
   * Build statistics from scratch
   * every time the filter changes.
   */
  const playerRows =
    useMemo(() => {
      const rows =
        new Map<
          string,
          PlayerRow
        >();

      /*
       * Register every player first.
       *
       * This means players with zero
       * matches still appear.
       */
      for (
        const team of teams
      ) {
        for (
          const player of
            team.players
        ) {
          rows.set(
            player.id,
            {
              player,
              team,

              matches: 0,
              wins: 0,
              losses: 0,

              kills: 0,
              deaths: 0,
              assists: 0,

              acsTotal: 0,
              adrTotal: 0,
              kastTotal: 0,

              acsMatches: 0,
              adrMatches: 0,
              kastMatches: 0,

              mvp: 0,
              topFragger: 0,
            }
          );
        }
      }

      /*
       * Aggregate every selected
       * completed match.
       */
      for (
        const match of filteredMatches
      ) {
        const winnerId =
          match.winnerId;

        for (
          const stat of
            match.playerStats ||
            []
        ) {
          const row =
            findPlayerRow(
              rows,
              stat
            );

          if (!row) {
            continue;
          }

          row.matches += 1;

          if (
            winnerId &&
            stat.teamId ===
              winnerId
          ) {
            row.wins += 1;
          } else {
            row.losses += 1;
          }

          row.kills +=
            Number(
              stat.kills
            ) || 0;

          row.deaths +=
            Number(
              stat.deaths
            ) || 0;

          row.assists +=
            Number(
              stat.assists
            ) || 0;

          if (
            Number.isFinite(
              Number(stat.acs)
            )
          ) {
            row.acsTotal +=
              Number(stat.acs);

            row.acsMatches += 1;
          }

          if (
            Number.isFinite(
              Number(stat.adr)
            ) &&
            Number(stat.adr) >
              0
          ) {
            row.adrTotal +=
              Number(stat.adr);

            row.adrMatches += 1;
          }

          if (
            Number.isFinite(
              Number(stat.kast)
            ) &&
            Number(stat.kast) >
              0
          ) {
            row.kastTotal +=
              Number(stat.kast);

            row.kastMatches += 1;
          }

          if (
            match.mvpPlayerId ===
            stat.playerId
          ) {
            row.mvp += 1;
          }

          if (
            match.topFraggerPlayerId ===
            stat.playerId
          ) {
            row.topFragger += 1;
          }
        }
      }

      return Array.from(
        rows.values()
      );
    }, [
      teams,
      filteredMatches,
    ]);

  /*
   * Team filter + search.
   */
  const visibleRows =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return playerRows
        .filter((row) => {
          if (
            teamFilter !==
              "ALL" &&
            row.team.id !==
              teamFilter
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          return (
            row.player.name
              .toLowerCase()
              .includes(query) ||
            row.team.name
              .toLowerCase()
              .includes(query) ||
            row.team.tag
              .toLowerCase()
              .includes(query)
          );
        })
        .sort((a, b) => {
          /*
           * MVP first,
           * then top fragger,
           * then kills.
           */
          if (
            b.mvp !== a.mvp
          ) {
            return (
              b.mvp -
              a.mvp
            );
          }

          if (
            b.topFragger !==
            a.topFragger
          ) {
            return (
              b.topFragger -
              a.topFragger
            );
          }

          return (
            b.kills -
            a.kills
          );
        });
    }, [
      playerRows,
      teamFilter,
      search,
    ]);

  const totalPlayers =
    teams.reduce(
      (total, team) =>
        total +
        team.players.length,
      0
    );

  const totalMvpAwards =
    playerRows.reduce(
      (total, row) =>
        total + row.mvp,
      0
    );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050810] px-4 py-7 text-white md:px-8"><div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(255,49,88,0.12),transparent_25%),radial-gradient(circle_at_90%_15%,rgba(39,217,255,0.10),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(139,92,246,0.10),transparent_35%)]" />
      <div className="mx-auto max-w-[1280px]">

        {/* HEADER */}
        <header className="relative flex flex-col justify-between gap-6 border-b border-[#263750] pb-7 md:flex-row md:items-end">
          <div>
            <div className="text-[9px] font-black tracking-[0.32em] text-cyan-400 uppercase">
              Valorant Tournament
            </div>

            <h1 className="mt-2 text-4xl font-black tracking-tight uppercase md:text-5xl">
              Player Statistics
            </h1>

            <p className="mt-2 text-[10px] text-white/35">
              Player-by-player tournament statistics
              calculated from published match results.
            </p>
          </div>

          <Link
            href="/tournament"
            className="rounded-xl border border-[#2b3d58] bg-[#0b1220] px-5 py-3 text-[9px] font-black tracking-[0.14em] uppercase transition hover:border-[#52e2ff]/50 hover:text-[#52e2ff]"
          >
            ← Tournament Central
          </Link>
        </header>

        {/* SUMMARY */}
        <section className="mt-7 grid gap-3 md:grid-cols-4">
          <SummaryCard
            label="Registered Players"
            value={totalPlayers}
          />

          <SummaryCard
            label="Completed Matches"
            value={
              completedMatches.length
            }
            accent="cyan"
          />

          <SummaryCard
            label="MVP Awards"
            value={totalMvpAwards}
            accent="yellow"
          />

          <SummaryCard
            label="Teams"
            value={teams.length}
          />
        </section>

        {/* FILTER BAR */}
        <section className="relative mt-7 overflow-hidden rounded-2xl border border-[#2b3d58] bg-gradient-to-br from-[#0d1522] via-[#0a1019] to-[#111020] shadow-[0_15px_50px_rgba(0,0,0,0.25)]">
          <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <div className="text-[9px] font-black tracking-[0.25em] text-cyan-400 uppercase">
                Player Database
              </div>

              <div className="mt-1 text-sm font-black uppercase">
                {visibleRows.length} Players
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">

              {/* MATCH / STAGE FILTER */}
              <label>
                <span className="mb-2 block text-[8px] font-black tracking-[0.16em] text-white/30 uppercase">
                  Matches
                </span>

                <select
                  value={stageFilter}
                  onChange={(event) =>
                    setStageFilter(
                      event.target.value
                    )
                  }
                  className="min-w-[190px] rounded-xl border border-[#2b3d58] bg-[#060b14] px-4 py-3 text-[10px] font-black uppercase outline-none transition focus:border-[#52e2ff] focus:ring-1 focus:ring-[#52e2ff]/20"
                >
                  {STAGES.map(
                    (stage) => (
                      <option
                        key={stage}
                        value={stage}
                      >
                        {stage}
                      </option>
                    )
                  )}
                </select>
              </label>

              {/* TEAM FILTER */}
              <label>
                <span className="mb-2 block text-[8px] font-black tracking-[0.16em] text-white/30 uppercase">
                  Team
                </span>

                <select
                  value={teamFilter}
                  onChange={(event) =>
                    setTeamFilter(
                      event.target.value
                    )
                  }
                  className="min-w-[180px] rounded-xl border border-[#2b3d58] bg-[#060b14] px-4 py-3 text-[10px] font-black uppercase outline-none transition focus:border-[#52e2ff] focus:ring-1 focus:ring-[#52e2ff]/20"
                >
                  <option value="ALL">
                    ALL TEAMS
                  </option>

                  {teams.map(
                    (team) => (
                      <option
                        key={team.id}
                        value={team.id}
                      >
                        {team.name}
                      </option>
                    )
                  )}
                </select>
              </label>

              {/* SEARCH */}
              <label>
                <span className="mb-2 block text-[8px] font-black tracking-[0.16em] text-white/30 uppercase">
                  Search
                </span>

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="PLAYER / TEAM"
                  className="min-w-[180px] border border-white/10 bg-[#080c12] px-4 py-3 text-[10px] font-black uppercase outline-none placeholder:text-white/20 focus:border-cyan-400"
                />
              </label>
            </div>
          </div>
        </section>

        {/* ACTIVE FILTER */}
        <div className="mt-4 flex flex-wrap gap-2">
          <FilterBadge>
            MATCHES: {stageFilter}
          </FilterBadge>

          <FilterBadge>
            TEAM:{" "}
            {teamFilter ===
            "ALL"
              ? "ALL TEAMS"
              : teams.find(
                  (team) =>
                    team.id ===
                    teamFilter
                )?.name ||
                "UNKNOWN"}
          </FilterBadge>

          <FilterBadge>
            COMPLETED:{" "}
            {filteredMatches.length}
          </FilterBadge>
        </div>

        {/* TABLE */}
        <section className="relative mt-5 overflow-hidden rounded-2xl border border-[#2b3d58] bg-[#0a1019]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] border-collapse">
              <thead>
                <tr className="border-b border-[#263750] bg-[#111b28]">
                  <Th>#</Th>

                  <Th align="left">
                    Player
                  </Th>

                  <Th align="left">
                    Team
                  </Th>

                  <Th>MP</Th>
                  <Th>W</Th>
                  <Th>L</Th>

                  <Th>K</Th>
                  <Th>D</Th>
                  <Th>A</Th>

                  <Th cyan>
                    ACS
                  </Th>

                  <Th>
                    ADR
                  </Th>

                  <Th>
                    KAST
                  </Th>

                  <Th yellow>
                    MVP
                  </Th>

                  <Th cyan>
                    TF
                  </Th>
                </tr>
              </thead>

              <tbody>
                {visibleRows.map(
                  (
                    row,
                    index
                  ) => (
                    <PlayerTableRow
                      key={
                        row.player.id
                      }
                      row={row}
                      index={
                        index + 1
                      }
                    />
                  )
                )}
              </tbody>
            </table>
          </div>

          {visibleRows.length ===
            0 && (
            <div className="flex min-h-[260px] items-center justify-center border-t border-white/5 text-center">
              <div>
                <div className="text-sm font-black uppercase">
                  No Players Found
                </div>

                <div className="mt-2 text-[9px] text-white/25">
                  Try a different match stage,
                  team or search value.
                </div>
              </div>
            </div>
          )}
        </section>

        {/* LEGEND */}
        <section className="mt-5 grid gap-3 md:grid-cols-3">
          <InfoCard
            title="MP"
            text="Completed matches played."
          />

          <InfoCard
            title="MVP"
            text="Number of published match MVP awards."
          />

          <InfoCard
            title="TF"
            text="Number of automatic Top Fragger awards."
          />
        </section>

        {/* FOOTER */}
        <footer className="mt-10 flex flex-col justify-between gap-3 border-t border-white/10 py-6 text-[8px] font-black tracking-[0.22em] text-white/20 uppercase md:flex-row">
          <span>
            Valorant Tournament //
            Player Database
          </span>

          <span>
            Match Results // Statistics //
            Awards
          </span>
        </footer>
      </div>
    </main>
  );
}

/*
 * ============================================================
 * PLAYER TABLE
 * ============================================================
 */

function PlayerTableRow({
  row,
  index,
}: {
  row: PlayerRow;
  index: number;
}) {
  const acs =
    row.acsMatches > 0
      ? row.acsTotal /
        row.acsMatches
      : 0;

  const adr =
    row.adrMatches > 0
      ? row.adrTotal /
        row.adrMatches
      : 0;

  const kast =
    row.kastMatches > 0
      ? row.kastTotal /
        row.kastMatches
      : 0;

  const initials =
    getInitials(
      row.player.name
    );

  return (
    <tr className="border-b border-white/[0.06] transition hover:bg-cyan-400/[0.025]">

      {/* NUMBER */}
      <td className="px-4 py-5 text-center">
        <span className="text-[8px] font-black text-white/30">
          {String(index).padStart(
            2,
            "0"
          )}
        </span>
      </td>

      {/* PLAYER */}
      <td className="px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#52e2ff]/25 bg-[#060b14] text-[9px] font-black text-[#52e2ff] shadow-[0_0_14px_rgba(39,217,255,0.08)]">
            {initials}
          </div>

          <div>
            <div className="text-[10px] font-black uppercase">
              {row.player.name}
            </div>

            {row.mvp > 0 && (
              <div className="mt-1 text-[7px] font-black tracking-wider text-yellow-400 uppercase">
                MVP × {row.mvp}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* TEAM */}
      <td className="px-4 py-5">
        <div className="text-[9px] font-black uppercase">
          {row.team.name}
        </div>

        <div className="mt-1 text-[7px] font-bold text-white/25 uppercase">
          {row.team.tag}
        </div>
      </td>

      {/* MP */}
      <StatCell
        value={row.matches}
      />

      {/* W */}
      <StatCell
        value={row.wins}
        positive
      />

      {/* L */}
      <StatCell
        value={row.losses}
        negative
      />

      {/* K */}
      <StatCell
        value={row.kills}
      />

      {/* D */}
      <StatCell
        value={row.deaths}
      />

      {/* A */}
      <StatCell
        value={row.assists}
      />

      {/* ACS */}
      <StatCell
        value={
          acs > 0
            ? acs.toFixed(0)
            : "0"
        }
        cyan
      />

      {/* ADR */}
      <StatCell
        value={
          adr > 0
            ? adr.toFixed(1)
            : "—"
        }
      />

      {/* KAST */}
      <StatCell
        value={
          kast > 0
            ? `${kast.toFixed(
                1
              )}%`
            : "—"
        }
      />

      {/* MVP */}
      <td className="px-4 py-5 text-center">
        <span
          className={
            row.mvp > 0
              ? "text-[10px] font-black text-yellow-400"
              : "text-[10px] font-black text-white/20"
          }
        >
          {row.mvp}
        </span>
      </td>

      {/* TOP FRAGGER */}
      <td className="px-4 py-5 text-center">
        <span
          className={
            row.topFragger > 0
              ? "text-[10px] font-black text-cyan-400"
              : "text-[10px] font-black text-white/20"
          }
        >
          {row.topFragger}
        </span>
      </td>
    </tr>
  );
}

/*
 * ============================================================
 * COMPONENTS
 * ============================================================
 */

function SummaryCard({
  label,
  value,
  accent = "white",
}: {
  label: string;
  value: number;
  accent?: "white" | "cyan" | "yellow";
}) {
  const accentClass =
    accent === "cyan"
      ? "text-cyan-400"
      : accent === "yellow"
        ? "text-yellow-400"
        : "text-white";

  return (
    <div className="rounded-xl border border-[#263750] bg-gradient-to-br from-[#0d1521] to-[#0a1019] p-5">
      <div className="text-[8px] font-black tracking-[0.2em] text-white/30 uppercase">
        {label}
      </div>

      <div
        className={`mt-3 text-3xl font-black ${accentClass}`}
      >
        {value}
      </div>
    </div>
  );
}

function FilterBadge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[#263750] bg-[#0a1019] px-3 py-2 text-[8px] font-black tracking-wider text-[#8195b0] uppercase">
      {children}
    </div>
  );
}

function InfoCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-[#263750] bg-gradient-to-br from-[#0d1521] to-[#0a1019] p-4">
      <div className="text-[9px] font-black text-cyan-400">
        {title}
      </div>

      <div className="mt-2 text-[8px] leading-4 text-white/30">
        {text}
      </div>
    </div>
  );
}

function Th({
  children,
  align = "center",
  cyan = false,
  yellow = false,
}: {
  children: React.ReactNode;
  align?: "left" | "center";
  cyan?: boolean;
  yellow?: boolean;
}) {
  let color =
    "text-white/30";

  if (cyan) {
    color =
      "text-cyan-400";
  }

  if (yellow) {
    color =
      "text-yellow-400";
  }

  return (
    <th
      className={`px-4 py-4 text-${align} text-[8px] font-black tracking-[0.14em] uppercase ${color}`}
    >
      {children}
    </th>
  );
}

function StatCell({
  value,
  positive = false,
  negative = false,
  cyan = false,
}: {
  value: number | string;
  positive?: boolean;
  negative?: boolean;
  cyan?: boolean;
}) {
  let className =
    "text-[10px] font-black text-white";

  if (positive) {
    className =
      "text-[10px] font-black text-emerald-400";
  }

  if (negative) {
    className =
      "text-[10px] font-black text-red-400";
  }

  if (cyan) {
    className =
      "text-[10px] font-black text-cyan-400";
  }

  return (
    <td className="px-4 py-5 text-center">
      <span className={className}>
        {value}
      </span>
    </td>
  );
}

/*
 * ============================================================
 * DATA HELPERS
 * ============================================================
 */

function findPlayerRow(
  rows: Map<string, PlayerRow>,
  stat: PlayerStat
) {
  /*
   * First use player ID.
   */
  const direct =
    rows.get(
      stat.playerId
    );

  if (direct) {
    return direct;
  }

  /*
   * Fallback to team + name.
   */
  for (
    const row of rows.values()
  ) {
    if (
      row.team.id ===
        stat.teamId &&
      normalize(
        row.player.name
      ) ===
        normalize(
          stat.playerName
        )
    ) {
      return row;
    }
  }

  /*
   * Last fallback:
   * name only.
   */
  for (
    const row of rows.values()
  ) {
    if (
      normalize(
        row.player.name
      ) ===
      normalize(
        stat.playerName
      )
    ) {
      return row;
    }
  }

  return undefined;
}

function normalize(
  value: string
) {
  return value
    .toLowerCase()
    .replace(
      /[^a-z0-9]/g,
      ""
    );
}

function getInitials(
  name: string
) {
  const parts =
    name
      .trim()
      .split(/\s+/);

  if (
    parts.length ===
    1
  ) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[
      parts.length - 1
    ][0]
  ).toUpperCase();
}
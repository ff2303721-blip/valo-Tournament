"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TournamentNav } from "../components/tournament-nav";
import { fetchTeams, fetchMatches } from "@/lib/api";

import {
  Match,
  PlayerStat,
  matches as defaultMatches,
} from "@/app/data/matches";

import {
  Team,
  Player,
  teams as defaultTeams,
} from "@/app/data/teams";

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
  const [teams, setTeams] = useState<Team[]>(defaultTeams);
  const [matches, setMatches] = useState<Match[]>(defaultMatches);
  const [stageFilter, setStageFilter] =
    useState("All Matches");

  const [teamFilter, setTeamFilter] =
    useState("ALL");

  const [search, setSearch] =
    useState("");

  useEffect(() => {
    let active = true;

    async function initialFetch() {
      try {
        const [teamsData, matchesData] = await Promise.all([
          fetchTeams(),
          fetchMatches(),
        ]);
        if (!active) return;
        setTeams(teamsData);
        setMatches(matchesData);
      } catch {
        // Fallback
      }
    }

    initialFetch();

    const refresh = () => {
      fetchTeams().then((t) => {
        if (active) setTeams(t);
      });
      fetchMatches().then((m) => {
        if (active) setMatches(m);
      });
    };

    window.addEventListener(
      "tournament-matches-updated",
      refresh
    );

    return () => {
      active = false;
      window.removeEventListener(
        "tournament-matches-updated",
        refresh
      );
    };
  }, []);

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
    <div className="min-h-screen bg-[#030308] text-[#f1f5f9]">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-[#7c3aed]/[0.06] blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-[#06b6d4]/[0.05] blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-[#ff2d55]/[0.04] blur-[100px]" />
      </div>

      <TournamentNav />

      <main className="relative px-4 py-7 md:px-8">
        <div className="mx-auto max-w-[1280px]">

          {/* HEADER */}
          <header className="flex flex-col justify-between gap-6 border-b border-[#1e1e3a] pb-7 md:flex-row md:items-end">
            <div>
              <div className="text-xs font-black tracking-[0.32em] text-[#22d3ee] uppercase">
                Tournament Leaderboard
              </div>

              <h1 className="mt-2 text-4xl font-black tracking-tight uppercase md:text-5xl text-[#f1f5f9]">
                Player Statistics
              </h1>

              <p className="mt-2 text-sm text-[#64748b]">
                Player-by-player tournament statistics
                calculated from published match results.
              </p>
            </div>

            <Link
              href="/tournament"
              className="rounded-lg border border-[#1e1e3a] bg-[#0c0c18] px-5 py-3 text-xs font-black tracking-widest uppercase text-[#64748b] hover:border-[#7c3aed]/40 hover:text-[#9d63ff] transition"
            >
              ← Dashboard
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
          <section className="mt-7 rounded-xl border border-[#1e1e3a] bg-[#0c0c18]">
            <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-end lg:justify-between">

              <div>
                <div className="text-xs font-black tracking-[0.25em] text-[#22d3ee] uppercase">
                  Player Database
                </div>

                <div className="mt-1 text-base font-black uppercase text-[#f1f5f9]">
                  {visibleRows.length} Players
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">

                {/* MATCH / STAGE FILTER */}
                <label>
                  <span className="mb-2 block text-xs font-black tracking-[0.16em] text-[#334155] uppercase">
                    Matches
                  </span>

                  <select
                    value={stageFilter}
                    onChange={(event) =>
                      setStageFilter(
                        event.target.value
                      )
                    }
                    className="min-w-[190px] rounded-lg border border-[#1e1e3a] bg-[#030308] px-4 py-3 text-sm font-black uppercase text-[#f1f5f9] outline-none focus:border-[#7c3aed]"
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
                  <span className="mb-2 block text-xs font-black tracking-[0.16em] text-[#334155] uppercase">
                    Team
                  </span>

                  <select
                    value={teamFilter}
                    onChange={(event) =>
                      setTeamFilter(
                        event.target.value
                      )
                    }
                    className="min-w-[180px] rounded-lg border border-[#1e1e3a] bg-[#030308] px-4 py-3 text-sm font-black uppercase text-[#f1f5f9] outline-none focus:border-[#7c3aed]"
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
                  <span className="mb-2 block text-xs font-black tracking-[0.16em] text-[#334155] uppercase">
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
                    className="min-w-[180px] rounded-lg border border-[#1e1e3a] bg-[#030308] px-4 py-3 text-sm font-black uppercase text-[#f1f5f9] outline-none placeholder:text-[#334155] focus:border-[#7c3aed]"
                  />
                </label>
              </div>
            </div>
          </section>

          {/* ACTIVE FILTERS */}
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
          <section className="mt-5 overflow-hidden rounded-xl border border-[#1e1e3a] bg-[#0c0c18]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] border-collapse">
                <thead>
                  <tr className="border-b border-[#1e1e3a] bg-[#030308]">
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
              <div className="flex min-h-[260px] items-center justify-center border-t border-[#1e1e3a] text-center">
                <div>
                  <div className="text-sm font-black uppercase text-[#f1f5f9]">
                    No Players Found
                  </div>

                  <div className="mt-2 text-xs text-[#334155]">
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
          <footer className="mt-10 flex flex-col justify-between gap-3 border-t border-[#1e1e3a] py-6 text-xs font-black tracking-[0.22em] text-[#334155] uppercase md:flex-row">
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
    </div>
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

  const rankBorder =
    index === 1
      ? "border-l-2 border-l-[#f59e0b]/60"
      : index === 2
        ? "border-l-2 border-l-[#94a3b8]/40"
        : index === 3
          ? "border-l-2 border-l-[#d97706]/40"
          : "";

  return (
    <tr className={`border-t border-[#1e1e3a] hover:bg-[#0c0c18] ${rankBorder}`}>

      {/* NUMBER */}
      <td className="px-4 py-5 text-center">
        <span className="text-xs font-black text-[#334155]">
          {String(index).padStart(
            2,
            "0"
          )}
        </span>
      </td>

      {/* PLAYER */}
      <td className="px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#1e1e3a] bg-[#030308] text-xs font-black text-[#7c3aed]">
            {initials}
          </div>

          <div>
            <div className="text-sm font-black uppercase text-[#f1f5f9]">
              {row.player.name}
            </div>

            {row.mvp > 0 && (
              <div className="mt-1 text-[10px] font-black tracking-wider text-[#f59e0b] uppercase">
                MVP × {row.mvp}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* TEAM */}
      <td className="px-4 py-5">
        <div className="text-sm font-black uppercase text-[#f1f5f9]">
          {row.team.name}
        </div>

        <div className="mt-1 text-xs font-bold text-[#334155] uppercase">
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
              ? "text-sm font-black text-[#f59e0b]"
              : "text-sm font-black text-[#334155]"
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
              ? "text-sm font-black text-[#22d3ee]"
              : "text-sm font-black text-[#334155]"
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
      ? "text-[#22d3ee]"
      : accent === "yellow"
        ? "text-[#fbbf24]"
        : "text-[#f1f5f9]";

  return (
    <div className="rounded-xl border border-[#1e1e3a] bg-[#0c0c18] p-5">
      <div className="text-xs font-black tracking-[0.2em] text-[#334155] uppercase">
        {label}
      </div>

      <div
        className={`mt-3 text-4xl font-black ${accentClass}`}
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
    <div className="rounded-lg border border-[#1e1e3a] bg-[#0c0c18] px-3 py-2 text-xs font-black tracking-wider text-[#64748b] uppercase">
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
    <div className="rounded-xl border border-[#1e1e3a] bg-[#0c0c18] p-4">
      <div className="text-sm font-black text-[#22d3ee]">
        {title}
      </div>

      <div className="mt-2 text-xs leading-5 text-[#64748b]">
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
    "text-[#334155]";

  if (cyan) {
    color =
      "text-[#22d3ee]";
  }

  if (yellow) {
    color =
      "text-[#fbbf24]";
  }

  return (
    <th
      className={`px-4 py-4 text-${align} text-xs font-black tracking-widest uppercase ${color}`}
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
    "text-sm font-black text-[#f1f5f9]";

  if (positive) {
    className =
      "text-sm font-black text-[#34d399]";
  }

  if (negative) {
    className =
      "text-sm font-black text-[#ff4d6a]";
  }

  if (cyan) {
    className =
      "text-sm font-black text-[#22d3ee]";
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
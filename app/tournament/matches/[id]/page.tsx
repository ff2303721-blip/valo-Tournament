"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";

import type {
  Match,
  PlayerStat,
} from "@/app/data/matches";

import type {
  Team,
} from "@/app/data/teams";

const MATCHES_KEY = "tournament-matches";
const TEAMS_KEY = "tournament-teams";

export default function PublicMatchDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [match, setMatch] =
    useState<Match | null>(null);

  const [teams, setTeams] =
    useState<Team[]>([]);

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

    return () => {
      window.removeEventListener(
        "tournament-matches-updated",
        refresh
      );

      window.removeEventListener(
        "storage",
        refresh
      );
    };
  }, [id]);

  function loadData() {
    try {
      const storedMatches =
        localStorage.getItem(
          MATCHES_KEY
        );

      const storedTeams =
        localStorage.getItem(
          TEAMS_KEY
        );

      const parsedMatches: Match[] =
        storedMatches
          ? JSON.parse(
              storedMatches
            )
          : [];

      const parsedTeams: Team[] =
        storedTeams
          ? JSON.parse(
              storedTeams
            )
          : [];

      const found =
        parsedMatches.find(
          (item) =>
            item.id === id
        );

      setMatch(
        found || null
      );

      setTeams(
        parsedTeams
      );
    } catch {
      setMatch(null);
      setTeams([]);
    }
  }

  const team1 = useMemo(
    () =>
      teams.find(
        (team) =>
          team.id ===
          match?.team1Id
      ),
    [teams, match]
  );

  const team2 = useMemo(
    () =>
      teams.find(
        (team) =>
          team.id ===
          match?.team2Id
      ),
    [teams, match]
  );

  const team1Stats =
    useMemo(() => {
      if (!match) return [];

      return (
        match.playerStats?.filter(
          (player) =>
            player.teamId ===
            match.team1Id
        ) || []
      );
    }, [match]);

  const team2Stats =
    useMemo(() => {
      if (!match) return [];

      return (
        match.playerStats?.filter(
          (player) =>
            player.teamId ===
            match.team2Id
        ) || []
      );
    }, [match]);

  const mvp =
    match?.playerStats?.find(
      (player) =>
        player.playerId ===
        match.mvpPlayerId
    );

  const topFragger =
    match?.playerStats?.find(
      (player) =>
        player.playerId ===
        match.topFraggerPlayerId
    );

  if (!match) {
    return (
      <PageShell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="border border-red-500/30 bg-red-500/[0.03] p-10 text-center">
            <div className="text-[9px] font-black tracking-[0.25em] text-red-400 uppercase">
              Match Not Found
            </div>

            <div className="mt-3 text-xl font-black uppercase">
              This match does not exist.
            </div>

            <Link
              href="/tournament/matches"
              className="mt-6 inline-block border border-white/10 px-5 py-3 text-[9px] font-black tracking-wider uppercase hover:border-cyan-400 hover:text-cyan-400"
            >
              ← All Matches
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  const completed =
    match.status ===
    "Completed";

  const winnerId =
    match.winnerId;

  const team1Won =
    winnerId ===
    team1?.id;

  const team2Won =
    winnerId ===
    team2?.id;

  return (
    <PageShell>
      {/* HEADER */}
      <header className="border-b border-white/10 pb-7">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="text-[9px] font-black tracking-[0.3em] text-cyan-400 uppercase">
              Valorant Tournament //
              Match #{match.matchNumber}
            </div>

            <h1 className="mt-2 text-4xl font-black uppercase md:text-5xl">
              Match Details
            </h1>

            <div className="mt-2 flex flex-wrap gap-2">
              <Badge>
                {match.stage}
              </Badge>

              <Badge>
                {match.map}
              </Badge>

              <Badge>
                BO{match.bestOf}
              </Badge>

              <Badge
                green={
                  completed
                }
              >
                {match.status}
              </Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/tournament/matches"
              className="border border-white/10 px-5 py-3 text-[9px] font-black tracking-wider uppercase hover:border-cyan-400/40 hover:text-cyan-400"
            >
              ← All Matches
            </Link>

            <Link
              href="/tournament"
              className="border border-white/10 px-5 py-3 text-[9px] font-black tracking-wider uppercase hover:border-cyan-400/40 hover:text-cyan-400"
            >
              Tournament Central
            </Link>
          </div>
        </div>
      </header>

      {/* SCOREBOARD */}
      <section className="mt-7 overflow-hidden border border-white/10 bg-[#0b1119]">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[8px] font-black tracking-[0.25em] text-white/25 uppercase">
                Match Result
              </div>

              <div className="mt-1 text-xs font-black uppercase">
                {completed
                  ? "Final Result"
                  : "Upcoming Match"}
              </div>
            </div>

            <div className="text-[9px] font-black tracking-wider text-white/30 uppercase">
              {formatDate(
                match.scheduledAt
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_auto_1fr]">
          {/* TEAM 1 */}
          <ScoreTeam
            team={team1}
            score={
              match.team1Score
            }
            winner={team1Won}
            align="right"
          />

          {/* CENTER */}
          <div className="flex min-w-[180px] flex-col items-center justify-center border-y border-white/10 px-8 py-8 md:border-x md:border-y-0">
            <div className="text-[8px] font-black tracking-[0.3em] text-white/20 uppercase">
              {completed
                ? "Match End"
                : "Scheduled"}
            </div>

            <div className="mt-2 text-4xl font-black tracking-tight">
              {match.team1Score}

              <span className="mx-4 text-white/15">
                —
              </span>

              {match.team2Score}
            </div>

            {completed && (
              <div className="mt-3 text-[9px] font-black tracking-[0.2em] text-emerald-400 uppercase">
                {winnerId ===
                team1?.id
                  ? `${team1?.name} Victory`
                  : `${team2?.name} Victory`}
              </div>
            )}
          </div>

          {/* TEAM 2 */}
          <ScoreTeam
            team={team2}
            score={
              match.team2Score
            }
            winner={team2Won}
            align="left"
          />
        </div>
      </section>

      {/* AWARDS */}
      {completed && (
        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <AwardCard
            title="Match MVP"
            player={mvp}
            team={findPlayerTeam(
              mvp,
              teams
            )}
            accent="yellow"
          />

          <AwardCard
            title="Top Fragger"
            player={topFragger}
            team={findPlayerTeam(
              topFragger,
              teams
            )}
            accent="cyan"
          />
        </section>
      )}

      {/* TEAM 1 STATS */}
      {completed && (
        <section className="mt-7">
          <SectionTitle
            eyebrow={
              team1?.name ||
              "TEAM 1"
            }
            title="Player Statistics"
            right={
              team1Won
                ? "VICTORY"
                : `LOSER // ${match.team1Score}`
            }
            accent={
              team1Won
                ? "green"
                : "white"
            }
          />

          <PlayerStatsTable
            team={
              team1
            }
            stats={
              team1Stats
            }
            mvpId={
              match.mvpPlayerId
            }
            topFraggerId={
              match.topFraggerPlayerId
            }
          />
        </section>
      )}

      {/* TEAM 2 STATS */}
      {completed && (
        <section className="mt-7">
          <SectionTitle
            eyebrow={
              team2?.name ||
              "TEAM 2"
            }
            title="Player Statistics"
            right={
              team2Won
                ? "VICTORY"
                : `LOSER // ${match.team2Score}`
            }
            accent={
              team2Won
                ? "green"
                : "white"
            }
          />

          <PlayerStatsTable
            team={
              team2
            }
            stats={
              team2Stats
            }
            mvpId={
              match.mvpPlayerId
            }
            topFraggerId={
              match.topFraggerPlayerId
            }
          />
        </section>
      )}

      {/* UPCOMING */}
      {!completed && (
        <section className="mt-7 border border-white/10 bg-[#0b1119] p-8 text-center">
          <div className="text-[9px] font-black tracking-[0.25em] text-cyan-400 uppercase">
            Match Scheduled
          </div>

          <div className="mt-3 text-xl font-black uppercase">
            Player statistics will appear
            after the result is published.
          </div>

          <div className="mt-2 text-[9px] text-white/25">
            Match administrators can upload
            the official result screenshot.
          </div>
        </section>
      )}

      {/* FOOTER NAV */}
      <section className="mt-8 grid gap-3 md:grid-cols-3">
        <QuickLink
          href="/tournament/matches"
          title="All Matches"
          text="View every tournament match."
        />

        <QuickLink
          href="/tournament/players"
          title="Player Statistics"
          text="View player performance and awards."
        />

        <QuickLink
          href="/tournament/bracket"
          title="Playoff Bracket"
          text="Follow Qualifier 1 through Grand Final."
        />
      </section>
    </PageShell>
  );
}

/*
 * ============================================================
 * PAGE SHELL
 * ============================================================
 */

function PageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#050a10] px-4 py-7 text-white md:px-8">
      <div className="mx-auto max-w-[1280px]">
        {children}
      </div>
    </main>
  );
}

/*
 * ============================================================
 * SCORE TEAM
 * ============================================================
 */

function ScoreTeam({
  team,
  score,
  winner,
  align,
}: {
  team?: Team;
  score: number;
  winner: boolean;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex items-center gap-5 p-7 ${
        align === "right"
          ? "justify-end text-right"
          : "justify-start"
      }`}
    >
      {align === "right" &&
        team && (
          <TeamLogo team={team} />
        )}

      <div>
        {winner && (
          <div className="mb-1 text-[8px] font-black tracking-[0.2em] text-emerald-400 uppercase">
            Winner
          </div>
        )}

        <div className="text-lg font-black uppercase">
          {team?.name ||
            "TBD"}
        </div>

        <div className="mt-1 text-[8px] font-black tracking-wider text-white/25 uppercase">
          {team?.tag ||
            "TBD"}
        </div>
      </div>

      <div
        className={`text-5xl font-black ${
          winner
            ? "text-white"
            : "text-white/45"
        }`}
      >
        {score}
      </div>

      {align === "left" &&
        team && (
          <TeamLogo team={team} />
        )}
    </div>
  );
}

/*
 * ============================================================
 * PLAYER STATISTICS TABLE
 * ============================================================
 */

function PlayerStatsTable({
  team,
  stats,
  mvpId,
  topFraggerId,
}: {
  team?: Team;
  stats: PlayerStat[];
  mvpId?: string;
  topFraggerId?: string;
}) {
  const sortedStats =
    [...stats].sort(
      (a, b) => {
        if (
          b.kills !==
          a.kills
        ) {
          return (
            b.kills -
            a.kills
          );
        }

        return (
          b.acs -
          a.acs
        );
      }
    );

  return (
    <div className="overflow-hidden border border-white/10 bg-[#0b1119]">
      <div className="border-b border-white/10 bg-white/[0.02] px-5 py-4">
        <div className="flex justify-between gap-3">
          <div className="text-[8px] font-black tracking-[0.2em] text-white/25 uppercase">
            {team?.name ||
              "Team"}{" "}
            // PLAYER DATA
          </div>

          <div className="text-[8px] font-black tracking-wider text-white/20 uppercase">
            {stats.length} Players
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <Th align="left">
                Player
              </Th>

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
                Award
              </Th>
            </tr>
          </thead>

          <tbody>
            {sortedStats.map(
              (stat) => {
                const isMvp =
                  stat.playerId ===
                  mvpId;

                const isTopFragger =
                  stat.playerId ===
                  topFraggerId;

                return (
                  <tr
                    key={
                      stat.playerId
                    }
                    className={`border-b border-white/5 ${
                      isMvp
                        ? "bg-yellow-400/[0.025]"
                        : ""
                    }`}
                  >
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center border border-white/10 bg-[#080c12] text-[8px] font-black text-cyan-400">
                          {getInitials(
                            stat.playerName
                          )}
                        </div>

                        <div>
                          <div className="text-[10px] font-black uppercase">
                            {
                              stat.playerName
                            }
                          </div>

                          <div className="mt-1 text-[7px] font-black text-white/20 uppercase">
                            {team?.tag}
                          </div>
                        </div>
                      </div>
                    </td>

                    <StatCell
                      value={
                        stat.kills
                      }
                    />

                    <StatCell
                      value={
                        stat.deaths
                      }
                    />

                    <StatCell
                      value={
                        stat.assists
                      }
                    />

                    <StatCell
                      value={
                        stat.acs
                      }
                      cyan
                    />

                    <StatCell
                      value={
                        stat.adr > 0
                          ? stat.adr.toFixed(
                              1
                            )
                          : "—"
                      }
                    />

                    <StatCell
                      value={
                        stat.kast > 0
                          ? `${stat.kast.toFixed(
                              1
                            )}%`
                          : "—"
                      }
                    />

                    <td className="px-5 py-5 text-center">
                      <div className="flex flex-wrap justify-center gap-2">
                        {isMvp && (
                          <span className="border border-yellow-400/30 bg-yellow-400/10 px-2 py-1 text-[7px] font-black tracking-wider text-yellow-400 uppercase">
                            MVP
                          </span>
                        )}

                        {isTopFragger && (
                          <span className="border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-[7px] font-black tracking-wider text-cyan-400 uppercase">
                            Top Fragger
                          </span>
                        )}

                        {!isMvp &&
                          !isTopFragger && (
                            <span className="text-[8px] text-white/15">
                              —
                            </span>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>

      {stats.length === 0 && (
        <div className="p-8 text-center text-[9px] font-black tracking-wider text-white/20 uppercase">
          No player statistics published.
        </div>
      )}
    </div>
  );
}

/*
 * ============================================================
 * AWARD CARD
 * ============================================================
 */

function AwardCard({
  title,
  player,
  team,
  accent,
}: {
  title: string;
  player?: PlayerStat;
  team?: Team;
  accent: "yellow" | "cyan";
}) {
  const color =
    accent === "yellow"
      ? "text-yellow-400"
      : "text-cyan-400";

  const border =
    accent === "yellow"
      ? "border-yellow-400/20"
      : "border-cyan-400/20";

  if (!player) {
    return (
      <div
        className={`border ${border} bg-[#0b1119] p-5`}
      >
        <div
          className={`text-[8px] font-black tracking-[0.2em] uppercase ${color}`}
        >
          {title}
        </div>

        <div className="mt-3 text-sm font-black text-white/20 uppercase">
          Not Assigned
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border ${border} bg-[#0b1119] p-5`}
    >
      <div
        className={`text-[8px] font-black tracking-[0.2em] uppercase ${color}`}
      >
        {title}
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center border border-white/10 bg-[#080c12] text-[10px] font-black text-cyan-400">
          {getInitials(
            player.playerName
          )}
        </div>

        <div>
          <div className="text-sm font-black uppercase">
            {player.playerName}
          </div>

          <div className="mt-1 text-[8px] font-black tracking-wider text-white/25 uppercase">
            {team?.name ||
              "UNKNOWN TEAM"}
          </div>
        </div>

        <div className="ml-auto text-right">
          <div className="text-lg font-black">
            {player.kills}
          </div>

          <div className="text-[7px] font-black tracking-wider text-white/25 uppercase">
            KILLS
          </div>
        </div>
      </div>
    </div>
  );
}

/*
 * ============================================================
 * SECTION TITLE
 * ============================================================
 */

function SectionTitle({
  eyebrow,
  title,
  right,
  accent,
}: {
  eyebrow: string;
  title: string;
  right: string;
  accent: "green" | "white";
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <div className="text-[8px] font-black tracking-[0.25em] text-cyan-400 uppercase">
          {eyebrow}
        </div>

        <h2 className="mt-1 text-lg font-black uppercase">
          {title}
        </h2>
      </div>

      <div
        className={`text-[8px] font-black tracking-wider uppercase ${
          accent === "green"
            ? "text-emerald-400"
            : "text-white/25"
        }`}
      >
        {right}
      </div>
    </div>
  );
}

/*
 * ============================================================
 * QUICK LINK
 * ============================================================
 */

function QuickLink({
  href,
  title,
  text,
}: {
  href: string;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="group border border-white/10 bg-[#0b1119] p-5 hover:border-cyan-400/40"
    >
      <div className="text-sm font-black uppercase group-hover:text-cyan-400">
        {title}
      </div>

      <div className="mt-2 text-[9px] leading-4 text-white/25">
        {text}
      </div>

      <div className="mt-5 text-[8px] font-black tracking-wider text-cyan-400 uppercase">
        Open →
      </div>
    </Link>
  );
}

/*
 * ============================================================
 * SMALL COMPONENTS
 * ============================================================
 */

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
        className="h-14 w-14 object-contain"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center border border-white/10 bg-[#080c12] text-xs font-black text-cyan-400">
      {team.tag.slice(
        0,
        2
      )}
    </div>
  );
}

function Badge({
  children,
  green = false,
}: {
  children: React.ReactNode;
  green?: boolean;
}) {
  return (
    <span
      className={`border px-2 py-1 text-[7px] font-black tracking-wider uppercase ${
        green
          ? "border-emerald-400/30 bg-emerald-400/[0.04] text-emerald-400"
          : "border-white/10 text-white/35"
      }`}
    >
      {children}
    </span>
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
      className={`px-5 py-4 text-${align} text-[8px] font-black tracking-[0.15em] uppercase ${color}`}
    >
      {children}
    </th>
  );
}

function StatCell({
  value,
  cyan = false,
}: {
  value: number | string;
  cyan?: boolean;
}) {
  return (
    <td className="px-5 py-5 text-center">
      <span
        className={`text-[10px] font-black ${
          cyan
            ? "text-cyan-400"
            : "text-white"
        }`}
      >
        {value}
      </span>
    </td>
  );
}

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function findPlayerTeam(
  player: PlayerStat | undefined,
  teams: Team[]
) {
  if (!player) {
    return undefined;
  }

  return teams.find(
    (team) =>
      team.id ===
      player.teamId
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

function formatDate(
  value: string
) {
  if (!value) {
    return "DATE TBD";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    undefined,
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}
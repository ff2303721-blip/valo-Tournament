"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { Match } from "@/app/data/matches";
import type { Team } from "@/app/data/teams";

const MATCHES_KEY = "tournament-matches";
const TEAMS_KEY = "tournament-teams";

function getTeam(
  teams: Team[],
  id?: string
) {
  return teams.find(
    (team) => team.id === id
  );
}

function formatMatchDate(
  value: string
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "TBD";
  }

  return (
    date.toLocaleDateString(
      undefined,
      {
        day: "2-digit",
        month: "short",
      }
    ) +
    ", " +
    date.toLocaleTimeString(
      undefined,
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }
    )
  );
}

function TeamLogo({
  team,
}: {
  team?: Team;
}) {
  if (team?.logo) {
    return (
      <img
        src={team.logo}
        alt=""
        className="h-10 w-10 object-contain"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/10 bg-[#0a141e] text-[9px] font-black text-cyan-300">
      {team?.tag?.slice(0, 2) ||
        "—"}
    </div>
  );
}

export default function TournamentCentralPage() {
  const [teams, setTeams] =
    useState<Team[]>([]);

  const [matches, setMatches] =
    useState<Match[]>([]);

  const [loaded, setLoaded] =
    useState(false);

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
    } finally {
      setLoaded(true);
    }
  }

  const completedMatches =
    useMemo(() => {
      return matches
        .filter(
          (match) =>
            match.status ===
            "Completed"
        )
        .sort(
          (a, b) =>
            b.matchNumber -
            a.matchNumber
        );
    }, [matches]);

  const upcomingMatches =
    useMemo(() => {
      return matches
        .filter(
          (match) =>
            match.status ===
              "Scheduled" ||
            match.status === "Live"
        )
        .sort((a, b) => {
          const dateA =
            new Date(
              a.scheduledAt
            ).getTime();

          const dateB =
            new Date(
              b.scheduledAt
            ).getTime();

          if (
            Number.isNaN(dateA) ||
            Number.isNaN(dateB)
          ) {
            return (
              a.matchNumber -
              b.matchNumber
            );
          }

          return dateA - dateB;
        });
    }, [matches]);

  const liveMatches =
    matches.filter(
      (match) =>
        match.status === "Live"
    );

  const groupMatches =
    completedMatches.filter(
      (match) =>
        match.stage ===
        "Group Stage"
    );

  const standings =
    useMemo(() => {
      return teams
        .map((team) => {
          let wins = 0;
          let losses = 0;
          let roundsFor = 0;
          let roundsAgainst = 0;

          for (const match of groupMatches) {
            const isTeam1 =
              match.team1Id ===
              team.id;

            const isTeam2 =
              match.team2Id ===
              team.id;

            if (
              !isTeam1 &&
              !isTeam2
            ) {
              continue;
            }

            if (
              match.winnerId ===
              team.id
            ) {
              wins++;
            } else if (
              match.winnerId
            ) {
              losses++;
            }

            if (isTeam1) {
              roundsFor +=
                match.team1Score;

              roundsAgainst +=
                match.team2Score;
            }

            if (isTeam2) {
              roundsFor +=
                match.team2Score;

              roundsAgainst +=
                match.team1Score;
            }
          }

          return {
            team,
            matches:
              wins + losses,
            wins,
            losses,
            roundDiff:
              roundsFor -
              roundsAgainst,
            points: wins * 3,
          };
        })
        .sort((a, b) => {
          if (
            b.points !==
            a.points
          ) {
            return (
              b.points -
              a.points
            );
          }

          if (
            b.wins !==
            a.wins
          ) {
            return (
              b.wins -
              a.wins
            );
          }

          if (
            b.roundDiff !==
            a.roundDiff
          ) {
            return (
              b.roundDiff -
              a.roundDiff
            );
          }

          return (
            a.team.seed -
            b.team.seed
          );
        });
    }, [
      teams,
      groupMatches,
    ]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#050a10] text-white">
      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute left-0 top-0 h-[500px] w-[700px] bg-cyan-400/[0.035] blur-[140px]" />

        <div className="absolute right-0 top-[500px] h-[500px] w-[600px] bg-red-500/[0.025] blur-[140px]" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize:
              "45px 45px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1500px] px-5 py-5 md:px-8 lg:px-10">
        {/* HEADER */}
        <header className="border-b border-white/10 pb-5">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <span className="text-[10px] font-black tracking-[0.35em] text-cyan-400 uppercase">
                  Valorant Esports
                </span>

                <span className="h-px w-28 bg-gradient-to-r from-red-500 to-transparent" />
              </div>

              <h1 className="text-4xl font-black tracking-[-0.04em] uppercase md:text-6xl">
                Tournament{" "}
                <span className="text-cyan-400">
                  Central
                </span>
              </h1>

              <p className="mt-2 text-xs text-white/40">
                Live tournament information,
                fixtures, matches, registered
                teams, standings and playoff
                bracket.
              </p>

              <div className="mt-4 flex flex-wrap gap-3 text-[8px] font-black tracking-[0.35em] text-white/25 uppercase">
                <span>Compete</span>
                <span>//</span>
                <span>Track</span>
                <span>//</span>
                <span>Follow</span>
                <span>//</span>
                <span>Champion</span>
              </div>
            </div>

            {/* TOP NAVIGATION */}
            <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <NavButton
                href="/tournament"
                label="Overview"
                active
              />

              <NavButton
                href="/tournament/fixtures"
                label="Fixtures"
              />

              <NavButton
                href="/tournament/bracket"
                label="Bracket"
              />

              <NavButton
                href="/tournament/matches"
                label="All Matches"
              />

              <NavButton
                href="/tournament/teams"
                label="Teams"
              />

              <NavButton
                href="/tournament/players"
                label="Players"
                badge="NEW"
              />
            </nav>
          </div>
        </header>

        {/* DASHBOARD STATS */}
        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Registered Teams"
            value={teams.length}
            icon="◉"
            accent="cyan"
          />

          <StatCard
            label="Total Matches"
            value={matches.length}
            icon="▣"
            accent="purple"
          />

          <StatCard
            label="Completed"
            value={
              completedMatches.length
            }
            icon="✓"
            accent="green"
          />

          <StatCard
            label="Live Now"
            value={
              liveMatches.length
            }
            icon="◉"
            accent="red"
          />
        </section>

        {/* UPCOMING MATCHES */}
        <section className="mt-9">
          <SectionHeading
            eyebrow="// Schedule"
            title="Upcoming Matches"
            linkHref="/tournament/fixtures"
            linkLabel="View All Fixtures →"
          />

          {upcomingMatches.length ===
          0 ? (
            <EmptyPanel text="No upcoming matches scheduled." />
          ) : (
            <div className="overflow-hidden border border-white/10 bg-[#09111a]">
              {upcomingMatches.map(
                (
                  match,
                  index
                ) => (
                  <UpcomingMatchRow
                    key={match.id}
                    match={match}
                    team1={getTeam(
                      teams,
                      match.team1Id
                    )}
                    team2={getTeam(
                      teams,
                      match.team2Id
                    )}
                    first={
                      index === 0
                    }
                  />
                )
              )}
            </div>
          )}
        </section>

        {/* STANDINGS + RECENT MATCHES */}
        <section className="mt-9 grid gap-6 xl:grid-cols-[1.02fr_.98fr]">
          {/* STANDINGS */}
          <div>
            <SectionHeading
              eyebrow="// Group Stage"
              title="Standings"
              linkHref="/tournament/teams"
              linkLabel="View Teams →"
            />

            <div className="overflow-hidden border border-white/10 bg-[#09111a]">
              <div className="grid grid-cols-[50px_1fr_55px_55px_55px_65px] border-b border-white/10 bg-white/[0.02] px-4 py-3 text-[8px] font-black tracking-[0.2em] text-white/30 uppercase md:grid-cols-[55px_1fr_65px_65px_65px_75px]">
                <span>#</span>

                <span>Team</span>

                <span className="text-center">
                  MP
                </span>

                <span className="text-center">
                  W
                </span>

                <span className="text-center">
                  L
                </span>

                <span className="text-center">
                  PTS
                </span>
              </div>

              {standings.map(
                (
                  entry,
                  index
                ) => (
                  <Link
                    key={
                      entry.team.id
                    }
                    href={`/tournament/teams/${entry.team.id}`}
                    className="group grid grid-cols-[50px_1fr_55px_55px_55px_65px] items-center border-b border-white/5 px-4 py-4 transition hover:bg-cyan-400/[0.035] md:grid-cols-[55px_1fr_65px_65px_65px_75px]"
                  >
                    <div
                      className={`text-sm font-black ${
                        index === 0
                          ? "text-cyan-400"
                          : "text-white/35"
                      }`}
                    >
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </div>

                    <div className="flex min-w-0 items-center gap-3">
                      <TeamLogo
                        team={
                          entry.team
                        }
                      />

                      <div className="min-w-0">
                        <div className="truncate text-xs font-black uppercase">
                          {
                            entry.team
                              .name
                          }
                        </div>

                        <div className="mt-1 text-[8px] font-bold tracking-wider text-white/25 uppercase">
                          {
                            entry.team
                              .players
                              .length
                          }{" "}
                          Players
                        </div>
                      </div>
                    </div>

                    <div className="text-center text-xs font-black">
                      {
                        entry.matches
                      }
                    </div>

                    <div className="text-center text-xs font-black text-emerald-400">
                      {entry.wins}
                    </div>

                    <div className="text-center text-xs font-black text-red-400">
                      {entry.losses}
                    </div>

                    <div className="text-center text-xs font-black text-cyan-400">
                      {entry.points}
                    </div>
                  </Link>
                )
              )}
            </div>
          </div>

          {/* RECENT MATCHES */}
          <div>
            <SectionHeading
              eyebrow="// Results"
              title="Recent Matches"
              linkHref="/tournament/matches"
              linkLabel="View All Matches →"
            />

            {completedMatches.length ===
            0 ? (
              <div className="relative flex min-h-[290px] items-center justify-center overflow-hidden border border-dashed border-white/10 bg-[#09111a]">
                <div className="absolute -right-8 -top-8 text-[130px] font-black text-red-500/[0.035]">
                  +
                </div>

                <div className="absolute -bottom-8 -left-8 text-[130px] font-black text-red-500/[0.025]">
                  +
                </div>

                <div className="relative text-center">
                  <div className="text-5xl text-white/15">
                    🏆
                  </div>

                  <div className="mt-5 text-xs font-black tracking-[0.15em] uppercase">
                    No Completed Matches Yet
                  </div>

                  <div className="mt-2 text-[10px] text-white/25">
                    Match results will appear here
                    once published.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {completedMatches
                  .slice(0, 6)
                  .map(
                    (match) => (
                      <RecentMatch
                        key={
                          match.id
                        }
                        match={
                          match
                        }
                        team1={getTeam(
                          teams,
                          match.team1Id
                        )}
                        team2={getTeam(
                          teams,
                          match.team2Id
                        )}
                      />
                    )
                  )}
              </div>
            )}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-10 flex flex-col justify-between gap-4 border-t border-white/10 py-6 text-[8px] font-black tracking-[0.3em] text-white/20 uppercase md:flex-row">
          <div>
            Valorant Tournament
            <span className="mx-3">
              //
            </span>
            Powered by Community
          </div>

          <div>
            Game
            <span className="mx-3">
              //
            </span>
            Compete
            <span className="mx-3">
              //
            </span>
            Belong
          </div>
        </footer>
      </div>

      {!loaded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050a10]">
          <div className="text-center">
            <div className="text-[10px] font-black tracking-[0.35em] text-cyan-400 uppercase">
              Valorant Tournament
            </div>

            <div className="mt-3 text-2xl font-black uppercase">
              Loading Central
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function NavButton({
  href,
  label,
  active = false,
  badge,
}: {
  href: string;
  label: string;
  active?: boolean;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className={`relative flex min-h-[46px] items-center justify-center border px-4 text-[9px] font-black tracking-[0.12em] uppercase transition ${
        active
          ? "border-cyan-400 bg-cyan-400/[0.08] text-cyan-300"
          : "border-white/10 bg-[#09111a] text-white/45 hover:border-cyan-400/40 hover:bg-cyan-400/[0.035] hover:text-white"
      }`}
    >
      {label}

      {badge && (
        <span className="absolute -right-1 -top-2 bg-red-500 px-2 py-1 text-[7px] font-black text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: string;
  accent:
    | "cyan"
    | "purple"
    | "green"
    | "red";
}) {
  const styles = {
    cyan: {
      border:
        "border-cyan-400/40",
      icon: "text-cyan-400",
      bar: "bg-cyan-400",
    },

    purple: {
      border:
        "border-purple-500/40",
      icon: "text-purple-400",
      bar: "bg-purple-400",
    },

    green: {
      border:
        "border-emerald-400/40",
      icon: "text-emerald-400",
      bar: "bg-emerald-400",
    },

    red: {
      border:
        "border-red-500/40",
      icon: "text-red-400",
      bar: "bg-red-400",
    },
  }[accent];

  return (
    <div
      className={`relative overflow-hidden border ${styles.border} bg-[#09111a] p-5`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[9px] font-black tracking-[0.2em] text-white/35 uppercase">
            {label}
          </div>

          <div className="mt-2 text-4xl font-black tracking-tight">
            {value}
          </div>
        </div>

        <div
          className={`text-2xl ${styles.icon}`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-5 h-1 overflow-hidden bg-white/10">
        <div
          className={`h-full w-1/3 ${styles.bar}`}
        />
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  linkHref,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  linkHref?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <div>
        <div className="text-[9px] font-black tracking-[0.25em] text-red-400 uppercase">
          {eyebrow}
        </div>

        <h2 className="mt-1 text-xl font-black tracking-tight uppercase">
          {title}
        </h2>
      </div>

      {linkHref && (
        <Link
          href={linkHref}
          className="hidden text-[8px] font-black tracking-[0.15em] text-white/35 uppercase transition hover:text-cyan-400 sm:block"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

function UpcomingMatchRow({
  match,
  team1,
  team2,
  first,
}: {
  match: Match;
  team1?: Team;
  team2?: Team;
  first: boolean;
}) {
  const isLive =
    match.status === "Live";

  return (
    <div
      className={`group relative grid items-center gap-4 px-4 py-4 transition hover:bg-white/[0.025] md:grid-cols-[145px_1fr_170px] ${
        !first
          ? "border-t border-white/10"
          : ""
      }`}
    >
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <div
          className={`h-8 w-1 ${
            isLive
              ? "bg-red-500"
              : "bg-cyan-400"
          }`}
        />

        <div>
          <div
            className={`text-[9px] font-black tracking-[0.18em] uppercase ${
              isLive
                ? "text-red-400"
                : "text-cyan-400"
            }`}
          >
            Match #
            {match.matchNumber}
          </div>

          <div className="mt-1 text-[7px] font-bold tracking-[0.18em] text-white/25 uppercase">
            {match.stage}
          </div>
        </div>
      </div>

      {/* TEAMS */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex items-center justify-end gap-3">
          <div className="text-right">
            <div className="text-[11px] font-black uppercase md:text-sm">
              {team1?.name ??
                "TBD"}
            </div>

            <div className="mt-1 text-[7px] font-black tracking-wider text-cyan-400/50 uppercase">
              {team1?.tag ??
                "TBD"}
            </div>
          </div>

          <TeamLogo
            team={team1}
          />
        </div>

        <div className="min-w-[70px] text-center">
          <div className="text-xl font-black">
            0
            <span className="mx-2 text-white/15">
              —
            </span>
            0
          </div>

          <div className="mt-1 text-[7px] font-black tracking-[0.15em] text-white/20 uppercase">
            BO{match.bestOf}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <TeamLogo
            team={team2}
          />

          <div>
            <div className="text-[11px] font-black uppercase md:text-sm">
              {team2?.name ??
                "TBD"}
            </div>

            <div className="mt-1 text-[7px] font-black tracking-wider text-red-400/50 uppercase">
              {team2?.tag ??
                "TBD"}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center justify-end gap-4">
        <div className="hidden text-right sm:block">
          <div
            className={`text-[7px] font-black tracking-[0.15em] uppercase ${
              isLive
                ? "text-red-400"
                : "text-cyan-400"
            }`}
          >
            {isLive
              ? "Live Now"
              : "Scheduled"}
          </div>

          <div className="mt-1 text-[8px] font-bold text-white/25">
            {formatMatchDate(
              match.scheduledAt
            )}
          </div>
        </div>

        <Link
          href={`/tournament/matches/${match.id}`}
          className={`border px-3 py-2 text-[7px] font-black tracking-[0.15em] uppercase transition ${
            isLive
              ? "border-red-500/60 text-red-400 hover:bg-red-500/10"
              : "border-white/15 text-white/45 hover:border-cyan-400/50 hover:text-cyan-400"
          }`}
        >
          View →
        </Link>
      </div>
    </div>
  );
}

function RecentMatch({
  match,
  team1,
  team2,
}: {
  match: Match;
  team1?: Team;
  team2?: Team;
}) {
  const team1Won =
    match.winnerId ===
    match.team1Id;

  const team2Won =
    match.winnerId ===
    match.team2Id;

  return (
    <Link
      href={`/tournament/matches/${match.id}`}
      className="block border border-white/10 bg-[#09111a] p-5 transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.02]"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[8px] font-black tracking-[0.2em] text-cyan-400 uppercase">
          Match #{match.matchNumber}
        </div>

        <div className="text-[8px] font-bold text-white/25 uppercase">
          {match.stage}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="text-right">
          <div
            className={`text-xs font-black uppercase ${
              team1Won
                ? "text-cyan-400"
                : "text-white/50"
            }`}
          >
            {team1?.name ??
              "TBD"}
          </div>
        </div>

        <div className="text-xl font-black">
          {match.team1Score}

          <span className="mx-2 text-white/15">
            —
          </span>

          {match.team2Score}
        </div>

        <div>
          <div
            className={`text-xs font-black uppercase ${
              team2Won
                ? "text-cyan-400"
                : "text-white/50"
            }`}
          >
            {team2?.name ??
              "TBD"}
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyPanel({
  text,
}: {
  text: string;
}) {
  return (
    <div className="border border-dashed border-white/10 bg-[#09111a] p-14 text-center text-[10px] font-black tracking-[0.2em] text-white/25 uppercase">
      {text}
    </div>
  );
}
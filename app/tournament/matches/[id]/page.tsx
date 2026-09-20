"use client";

import Link from "next/link";
import { TournamentBrand } from "../../components/tournament-brand";
import { useEffect, useMemo, useState } from "react";

type MatchStatus =
  | "Scheduled"
  | "Live"
  | "Completed"
  | "Cancelled";

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
  status: MatchStatus;
  winnerId?: string;
  mvpPlayerId?: string;
  topFraggerPlayerId?: string;
  playerStats: PlayerStat[];
  createdAt: string;
};

type Team = {
  id: string;
  name: string;
  tag: string;
  seed: number;
  logo?: string;
  wins: number;
  losses: number;
  captainRank?: string;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value: string) {
  if (!value) {
    return "TBD";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    dateStyle: "full",
    timeStyle: "short",
  });
}

function getTeam(
  teams: Team[],
  id?: string,
) {
  return teams.find(
    (team) => team.id === id,
  );
}

function getTeamName(
  teams: Team[],
  id?: string,
) {
  return (
    getTeam(teams, id)?.name ??
    "TBD"
  );
}

function getTeamTag(
  teams: Team[],
  id?: string,
) {
  return (
    getTeam(teams, id)?.tag ??
    "TBD"
  );
}

function getPlayerName(
  stats: PlayerStat[],
  id?: string,
) {
  return (
    stats.find(
      (player) =>
        player.playerId ===
        id,
    )?.playerName ??
    "—"
  );
}

function statusClass(
  status: MatchStatus,
) {
  if (status === "Live") {
    return "border-red-400/40 bg-red-500/10 text-red-300 shadow-[0_0_20px_rgba(248,113,113,0.12)]";
  }

  if (status === "Completed") {
    return "border-emerald-400/40 bg-emerald-500/10 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.10)]";
  }

  return "border-[#52e2ff]/25 bg-[#52e2ff]/[0.06] text-[#a9dff0]";
}

export default function PublicMatchDetailPage({
  params,
}: PageProps) {
  const [matchId, setMatchId] =
    useState("");

  const [match, setMatch] =
    useState<Match | null>(
      null,
    );

  const [teams, setTeams] =
    useState<Team[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const resolved =
          await params;

        if (!active) {
          return;
        }

        setMatchId(
          resolved.id,
        );

        const [
          matchResponse,
          teamsResponse,
        ] = await Promise.all([
          fetch(
            `/api/matches/${encodeURIComponent(
              resolved.id,
            )}`,
            {
              cache: "force-cache",
            },
          ),
          fetch("/api/teams", {
            cache: "force-cache",
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

        if (!active) {
          return;
        }

        setMatch(
          matchData,
        );

        setTeams(
          Array.isArray(
            teamsData,
          )
            ? teamsData
            : [],
        );
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load match.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [params]);

  const team1 =
    useMemo(
      () =>
        getTeam(
          teams,
          match?.team1Id,
        ),
      [teams, match],
    );

  const team2 =
    useMemo(
      () =>
        getTeam(
          teams,
          match?.team2Id,
        ),
      [teams, match],
    );

  const team1Stats =
    useMemo(
      () =>
        (match?.playerStats ??
          []).filter(
            (stat) =>
              stat.teamId ===
              match?.team1Id,
          ),
      [match],
    );

  const team2Stats =
    useMemo(
      () =>
        (match?.playerStats ??
          []).filter(
            (stat) =>
              stat.teamId ===
              match?.team2Id,
          ),
      [match],
    );

  const sortedStats =
    useMemo(
      () =>
        [
          ...(match?.playerStats ??
            []),
        ].sort(
          (a, b) =>
            b.kills -
            a.kills ||
            a.deaths -
              b.deaths ||
            b.assists -
              a.assists,
        ),
      [match],
    );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#04070f] text-white">
        <div className="rounded-2xl border border-[#2b3d58] bg-[#0b1220] px-8 py-6 text-sm font-bold text-[#72e9ff] shadow-[0_0_35px_rgba(39,217,255,0.08)]">
          Loading match...
        </div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="min-h-screen bg-[#04070f] px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#ff3158]/50 bg-gradient-to-br from-[#170b13] to-[#0a1019] p-8 shadow-[0_0_35px_rgba(255,49,88,0.08)]">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff5275]">
            MATCH ERROR
          </div>
          <h1 className="mt-3 text-3xl font-black">Match not found</h1>
          <p className="mt-2 text-sm text-[#ff9bb0]">
            {error || `No match exists for ${matchId}.`}
          </p>
          <Link
            href="/tournament/matches"
            className="mt-6 inline-flex rounded-xl border border-[#52e2ff]/40 bg-[#07131c] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#72e9ff]"
          >
            ← ALL MATCHES
          </Link>
        </div>
      </main>
    );
  }

  const scheduledDate = match.scheduledAt
    ? new Date(match.scheduledAt)
    : null;
  const validScheduledDate =
    scheduledDate && !Number.isNaN(scheduledDate.getTime());
  const dateLabel = validScheduledDate
    ? scheduledDate.toLocaleDateString([], {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "TBD";
  const timeLabel = validScheduledDate
    ? scheduledDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "TBD";

  const mapName = match.map || "TBD";
  const winnerName = getTeamName(teams, match.winnerId);
  const team1Won = match.status === "Completed" && match.winnerId === match.team1Id;
  const team2Won = match.status === "Completed" && match.winnerId === match.team2Id;

  function StatTable({
    title,
    accent,
    stats,
  }: {
    title: string;
    accent: "pink" | "cyan";
    stats: PlayerStat[];
  }) {
    const accentText =
      accent === "pink" ? "text-[#ff5275]" : "text-[#52e2ff]";
    const accentBorder =
      accent === "pink" ? "border-[#ff3158]/40" : "border-[#52e2ff]/40";
    const accentBg =
      accent === "pink" ? "bg-[#ff3158]/[0.06]" : "bg-[#52e2ff]/[0.06]";

    return (
      <section className={`overflow-hidden rounded-2xl border ${accentBorder} bg-gradient-to-br from-[#0d1522] to-[#080e17]`}>
        <div className={`flex items-center justify-between border-b border-white/[0.07] ${accentBg} px-5 py-4`}>
          <div>
            <div className={`text-[10px] font-black uppercase tracking-[0.25em] ${accentText}`}>
              TEAM
            </div>
            <h3 className="mt-1 text-lg font-black uppercase">{title}</h3>
          </div>
          <div className={`rounded-lg border ${accentBorder} px-3 py-1.5 text-[9px] font-black uppercase tracking-wider ${accentText}`}>
            {stats.length} PLAYERS
          </div>
        </div>

        {stats.length === 0 ? (
          <div className="flex min-h-28 items-center justify-center px-6 text-center text-sm text-[#7188a5]">
            No player stats recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead className="bg-[#07101a] text-[9px] font-black uppercase tracking-[0.16em] text-[#7188a5]">
                <tr>
                  <th className="px-5 py-3">Player</th>
                  <th className="px-3 py-3">K</th>
                  <th className="px-3 py-3">D</th>
                  <th className="px-3 py-3">A</th>
                  <th className="px-3 py-3">ACS</th>
                  <th className="px-3 py-3">ADR</th>
                  <th className="px-3 py-3">KAST</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat) => {
                  const isMvp = stat.playerId === match?.mvpPlayerId;
                  const isTopFragger = stat.playerId === match?.topFraggerPlayerId;

                  return (
                    <tr key={stat.playerId} className="border-t border-[#1c2938]">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-white">{stat.playerName}</div>
                        {(isMvp || isTopFragger) && (
                          <div className="mt-1 flex gap-1">
                            {isMvp && (
                              <span className="rounded border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0.5 text-[8px] font-black text-yellow-300">
                                MVP
                              </span>
                            )}
                            {isTopFragger && (
                              <span className="rounded border border-[#8b2cff]/40 bg-[#8b2cff]/10 px-1.5 py-0.5 text-[8px] font-black text-[#c79aff]">
                                TOP FRAG
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3.5 font-black">{stat.kills}</td>
                      <td className="px-3 py-3.5 text-[#a9b8cc]">{stat.deaths}</td>
                      <td className="px-3 py-3.5 text-[#a9b8cc]">{stat.assists}</td>
                      <td className="px-3 py-3.5 font-bold">{stat.acs}</td>
                      <td className="px-3 py-3.5">{Number(stat.adr).toFixed(1)}</td>
                      <td className="px-3 py-3.5">{Number(stat.kast).toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#04070f] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_8%_8%,rgba(255,49,88,0.15),transparent_25%),radial-gradient(circle_at_92%_18%,rgba(39,217,255,0.12),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(139,92,246,0.12),transparent_36%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-30 [background-image:linear-gradient(120deg,transparent_0%,rgba(255,49,88,0.025)_48%,transparent_50%),linear-gradient(300deg,transparent_0%,rgba(82,226,255,0.025)_55%,transparent_57%)]" />

      <header className="relative border-b border-[#263750] bg-[#060b14]/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1400px] px-5 py-5 sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <Link
                href="/tournament/matches"
                className="text-[10px] font-black uppercase tracking-[0.18em] text-[#52e2ff] hover:text-white"
              >
                ← All Matches
              </Link>
              <div className="mt-3">
                <TournamentBrand compact />
              </div>
            </div>

            <div className={`rounded-xl border px-4 py-2.5 ${statusClass(match.status)}`}>
              <div className="text-[9px] font-black uppercase tracking-[0.18em] opacity-70">
                STATUS
              </div>
              <div className="mt-0.5 text-xs font-black uppercase">{match.status}</div>
            </div>
          </div>

          <div className="mt-7">
            <div className="text-[10px] font-black uppercase tracking-[0.32em] text-[#52e2ff]">
              MATCH {String(match.matchNumber).padStart(2, "0")}
            </div>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black uppercase leading-none tracking-tight sm:text-5xl">
                  <span className="text-white">{match.stage.split(" ")[0]}</span>{" "}
                  <span className="bg-gradient-to-r from-[#ff5275] to-[#ff9ab0] bg-clip-text text-transparent">
                    {match.stage.split(" ").slice(1).join(" ") || match.stage}
                  </span>
                </h1>
                <div className="mt-3 text-xs font-bold text-[#8195b0]">
                  Best of {match.bestOf} (BO{match.bestOf})
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-[1400px] px-5 py-7 sm:px-8">
        <section className="relative overflow-hidden rounded-2xl border border-[#2b3d58] bg-gradient-to-br from-[#0d1522] via-[#09111c] to-[#0a1019] shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ff3158] via-[#ff5275] to-[#52e2ff]" />
          <div className="absolute left-0 top-0 h-full w-1/3 bg-[radial-gradient(circle_at_25%_50%,rgba(255,49,88,0.13),transparent_62%)]" />
          <div className="absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(circle_at_75%_50%,rgba(39,217,255,0.13),transparent_62%)]" />

          <div className="relative grid gap-7 p-5 sm:p-8 lg:grid-cols-[1fr_1.1fr_1fr] lg:items-center">
            <div className={`text-center lg:text-left ${team1Won ? "scale-[1.02]" : ""}`}>
              {team1?.logo ? (
                <img
                  src={team1.logo}
                  alt=""
                  className="mx-auto h-24 w-24 rounded-2xl border border-[#ff3158]/40 bg-[#060b14] object-contain p-2 shadow-[0_0_35px_rgba(255,49,88,0.10)] lg:mx-0"
                />
              ) : (
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl border border-[#ff3158]/40 bg-[#060b14] text-xl font-black text-[#ff6685] shadow-[0_0_35px_rgba(255,49,88,0.08)] lg:mx-0">
                  {(team1?.tag ?? "TBD").slice(0, 3)}
                </div>
              )}
              <div className="mt-4 text-xl font-black uppercase">{team1?.name ?? "TBD"}</div>
              <div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#7188a5]">
                {team1?.tag ?? "TBD"} {team1Won && " · WINNER"}
              </div>
            </div>

            <div className="order-first text-center lg:order-none">
              <div className="text-[9px] font-black uppercase tracking-[0.32em] text-[#7188a5]">
                MATCH SCORE
              </div>
              <div className="mt-2 text-6xl font-black tracking-tight sm:text-7xl">
                {match.team1Score}
                <span className="mx-3 text-[#ff5275]">-</span>
                {match.team2Score}
              </div>
              <div className="mx-auto mt-3 h-px w-44 bg-gradient-to-r from-transparent via-[#52e2ff] to-transparent" />

              <div className="mx-auto mt-5 max-w-sm overflow-hidden rounded-xl border border-[#405675] bg-[#07101a]">
                <div className="flex h-8 items-center justify-center border-b border-white/[0.06] text-[9px] font-black uppercase tracking-[0.25em] text-[#52e2ff]">
                  MAP
                </div>
                <div className="relative flex min-h-28 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_30%_30%,rgba(255,49,88,0.24),transparent_35%),radial-gradient(circle_at_70%_60%,rgba(39,217,255,0.22),transparent_40%),linear-gradient(135deg,#111a29,#080d16)]">
                  <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(135deg,transparent_24%,rgba(255,255,255,0.12)_25%,transparent_26%),linear-gradient(315deg,transparent_24%,rgba(255,255,255,0.08)_25%,transparent_26%)] [background-size:36px_36px]" />
                  <div className="relative text-2xl font-black uppercase tracking-[0.12em] text-white drop-shadow-[0_0_18px_rgba(82,226,255,0.25)]">
                    {mapName}
                  </div>
                </div>
              </div>
            </div>

            <div className={`text-center lg:text-right ${team2Won ? "scale-[1.02]" : ""}`}>
              {team2?.logo ? (
                <img
                  src={team2.logo}
                  alt=""
                  className="mx-auto h-24 w-24 rounded-2xl border border-[#52e2ff]/40 bg-[#060b14] object-contain p-2 shadow-[0_0_35px_rgba(39,217,255,0.10)] lg:ml-auto lg:mr-0"
                />
              ) : (
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl border border-[#52e2ff]/40 bg-[#060b14] text-xl font-black text-[#72e9ff] shadow-[0_0_35px_rgba(39,217,255,0.08)] lg:ml-auto lg:mr-0">
                  {(team2?.tag ?? "TBD").slice(0, 3)}
                </div>
              )}
              <div className="mt-4 text-xl font-black uppercase">{team2?.name ?? "TBD"}</div>
              <div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#7188a5]">
                {team2?.tag ?? "TBD"} {team2Won && " · WINNER"}
              </div>
            </div>
          </div>

          <div className="relative grid border-t border-white/[0.07] bg-[#07101a]/70 sm:grid-cols-3">
            <div className="border-b border-white/[0.07] px-5 py-4 text-center sm:border-b-0 sm:border-r">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#607791]">DATE</div>
              <div className="mt-1 text-sm font-black">{dateLabel}</div>
            </div>
            <div className="border-b border-white/[0.07] px-5 py-4 text-center sm:border-b-0 sm:border-r">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#607791]">TIME</div>
              <div className="mt-1 text-sm font-black">{timeLabel}</div>
            </div>
            <div className="px-5 py-4 text-center">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#607791]">FORMAT</div>
              <div className="mt-1 text-sm font-black">Best of {match.bestOf} (BO{match.bestOf})</div>
            </div>
          </div>
        </section>

        {match.status === "Completed" && (
          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#52e2ff]/30 bg-gradient-to-br from-[#0d1820] to-[#091019] p-5 shadow-[0_0_25px_rgba(39,217,255,0.05)]">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#52e2ff]">WINNER</div>
              <div className="mt-2 text-lg font-black">{winnerName}</div>
            </div>
            <div className="rounded-2xl border border-[#8b2cff]/30 bg-gradient-to-br from-[#120d20] to-[#0a1019] p-5">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#b88cff]">MVP</div>
              <div className="mt-2 text-lg font-black">{getPlayerName(match.playerStats, match.mvpPlayerId)}</div>
            </div>
            <div className="rounded-2xl border border-[#ff3158]/30 bg-gradient-to-br from-[#180b14] to-[#0a1019] p-5">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#ff6d8b]">TOP FRAGGER</div>
              <div className="mt-2 text-lg font-black">{getPlayerName(match.playerStats, match.topFraggerPlayerId)}</div>
            </div>
          </section>
        )}

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#ff3158]/30 bg-gradient-to-br from-[#0e111c] to-[#080e17] p-6">
            <div className="text-[9px] font-black uppercase tracking-[0.22em] text-[#ff5275]">MATCH DETAILS</div>
            <div className="mt-4 space-y-0 overflow-hidden rounded-xl border border-[#263750]">
              {[
                ["Tournament Stage", match.stage],
                ["Match Number", `M${String(match.matchNumber).padStart(2, "0")}`],
                ["Map", mapName],
                ["Format", `Best of ${match.bestOf} (BO${match.bestOf})`],
                ["Status", match.status],
                ["Scheduled Date", dateLabel],
                ["Scheduled Time", timeLabel],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-2 border-b border-[#1c2938] px-4 py-3 text-xs last:border-0">
                  <span className="font-bold text-[#7188a5]">{label}</span>
                  <span className="text-right font-black text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#52e2ff]/30 bg-gradient-to-br from-[#0b141d] to-[#080e17] p-6">
            <div className="text-[9px] font-black uppercase tracking-[0.22em] text-[#52e2ff]">MAP & SCHEDULE</div>
            <div className="mt-4 flex min-h-[230px] items-center justify-center overflow-hidden rounded-xl border border-[#263750] bg-[radial-gradient(circle_at_25%_30%,rgba(255,49,88,0.18),transparent_30%),radial-gradient(circle_at_75%_65%,rgba(39,217,255,0.18),transparent_34%),linear-gradient(135deg,#111a29,#070c15)]">
              <div className="text-center">
                <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#52e2ff]">SELECTED MAP</div>
                <div className="mt-2 text-4xl font-black uppercase tracking-[0.08em] text-white">{mapName}</div>
                <div className="mt-3 text-xs font-bold text-[#8195b0]">{dateLabel} · {timeLabel}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-4">
            <div className="text-[9px] font-black uppercase tracking-[0.25em] text-[#52e2ff]">PLAYER STATISTICS</div>
            <h2 className="mt-1 text-2xl font-black uppercase">Match Performance</h2>
            <p className="mt-1 text-xs text-[#7188a5]">Official player statistics published with the match result.</p>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <StatTable title={getTeamName(teams, match.team1Id)} accent="pink" stats={team1Stats} />
            <StatTable title={getTeamName(teams, match.team2Id)} accent="cyan" stats={team2Stats} />
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#ff3158]/25 bg-[#0b111b] p-6">
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#ff5275]">{getTeamName(teams, match.team1Id)}</div>
            <div className="mt-4 space-y-2">
              {team1Stats.length === 0 ? (
                <div className="text-sm text-[#7188a5]">No player stats recorded.</div>
              ) : (
                team1Stats.map((stat) => (
                  <div key={stat.playerId} className="flex items-center justify-between rounded-lg border border-[#1c2938] bg-[#080e17] px-3 py-2">
                    <span className="text-sm font-bold">{stat.playerName}</span>
                    <span className="text-xs font-black text-[#ff9ab0]">{stat.kills} / {stat.deaths} / {stat.assists}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#52e2ff]/25 bg-[#0b111b] p-6">
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#52e2ff]">{getTeamName(teams, match.team2Id)}</div>
            <div className="mt-4 space-y-2">
              {team2Stats.length === 0 ? (
                <div className="text-sm text-[#7188a5]">No player stats recorded.</div>
              ) : (
                team2Stats.map((stat) => (
                  <div key={stat.playerId} className="flex items-center justify-between rounded-lg border border-[#1c2938] bg-[#080e17] px-3 py-2">
                    <span className="text-sm font-bold">{stat.playerName}</span>
                    <span className="text-xs font-black text-[#72e9ff]">{stat.kills} / {stat.deaths} / {stat.assists}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/tournament/matches" className="rounded-xl border border-[#2b3d58] bg-[#0b1220] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#bcd0e8] hover:border-[#52e2ff]/50 hover:text-[#72e9ff]">
            ← ALL MATCHES
          </Link>
          <Link href="/tournament/teams" className="rounded-xl border border-[#2b3d58] bg-[#0b1220] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#bcd0e8] hover:border-[#ff3158]/50 hover:text-[#ff8da5]">
            VIEW TEAMS
          </Link>
        </div>
      </div>
    </main>
  );
}